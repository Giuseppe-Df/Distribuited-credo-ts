import type { ConnectionRecord, CredentialExchangeRecord, ProofExchangeRecord, PubKeyRecord } from '@credo-ts/core'

import { BaseAliceAgent } from './BaseAliceAgent'
import { greenText, Output, redText } from './OutputClass'

export class Alice extends BaseAliceAgent {
  public connected: boolean
  public pubKeyObtained: boolean
  public connectionRecordFaberId?: string

  public constructor(port: number, name: string) {
    super({ port, name })
    this.connected = false
    this.pubKeyObtained = false
  }

  public static async build(): Promise<Alice> {
    const alice = new Alice(9000, 'alice')
    await alice.initializeAgent()
  
    return alice
  }

  public async pubKeyRequest(): Promise<void>{
    const keyRecord = await this.agent.pubkey.requestPubKey()
    if (!keyRecord) {
      throw new Error(redText(Output.NoPubKey))
    }
    await this.waitForPublicKey(keyRecord)

  }

  private async getConnectionRecord() {
    if (!this.connectionRecordFaberId) {
      throw Error(redText(Output.MissingConnectionRecord))
    }
    return await this.agent.connections.getById(this.connectionRecordFaberId)
  }

  private async receiveConnectionRequest(invitationUrl: string) {
    const { connectionRecord } = await this.agent.oob.receiveInvitationFromUrl(invitationUrl)
    if (!connectionRecord) {
      throw new Error(redText(Output.NoConnectionRecordFromOutOfBand))
    }
    return connectionRecord
  }

  private async waitForConnection(connectionRecord: ConnectionRecord) {
    connectionRecord = await this.agent.connections.returnWhenIsConnected(connectionRecord.id)
    this.connected = true
    console.log(greenText(Output.ConnectionEstablished))
    return connectionRecord.id
  }

  private async waitForPublicKey(pubKeyRecord: PubKeyRecord) {
    await this.agent.pubkey.returnWhenIsObtained(pubKeyRecord.id)
    this.pubKeyObtained = true
    console.log(greenText(Output.PubKeyObtained))
  }

  public async acceptConnection(invitation_url: string) {
    const connectionRecord = await this.receiveConnectionRequest(invitation_url)
    this.connectionRecordFaberId = await this.waitForConnection(connectionRecord)
  }

  public async acceptCredentialOffer(credentialRecord: CredentialExchangeRecord) {
    await this.agent.credentials.acceptOffer({
      credentialRecordId: credentialRecord.id,
    })
  }

  public async acceptProofRequest(proofRecord: ProofExchangeRecord) {
    const requestedCredentials = await this.agent.proofs.selectCredentialsForRequest({
      proofRecordId: proofRecord.id,
    })

    await this.agent.proofs.acceptRequest({
      proofRecordId: proofRecord.id,
      proofFormats: requestedCredentials.proofFormats,
    })
    console.log(greenText('\nProof request accepted!\n'))
  }

  public async sendMessage(message: string) {
    const connectionRecord = await this.getConnectionRecord()
    await this.agent.basicMessages.sendMessage(connectionRecord.id, message)
  }

  public async exit() {
    console.log(Output.Exit)
    await this.agent.shutdown()
    process.exit(0)
  }

  public async restart() {
    await this.agent.shutdown()
  }
}
