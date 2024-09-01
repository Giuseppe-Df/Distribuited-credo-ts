import type { AgentMessage } from '../../../agent/AgentMessage'
import { AgentContext } from 'packages/core/src/agent'
import { EncryptedMessage } from '../../../types'
import { Logger } from '../../../logger'
import { MessageReceiver } from '../../../agent/MessageReceiver'

import { DistribuitedUnpackRecordProps } from '../repository/DistribuitedUnpackRecord'
import { DistribuitedUnpackRecord } from '../repository/DistribuitedUnpackRecord'
import { DistribuitedUnpackState, DistribuitedUnpackRole } from '../models'
import { DistribuitedUnpackRepository } from '../repository'
import { DistribuitedUnpackRequestMessage, DistribuitedUnpackResponseMessage } from '../messages'
import { PubKeyApi } from '../../pubkey/PubKeyApi'
import { EnvelopeService } from '../../../agent/EnvelopeService'

import { inject, injectable } from '../../../plugins'
import { InjectionSymbols } from '../../../constants'
import { first, map, timeout } from 'rxjs/operators'
import { JsonEncoder } from '../../../utils/JsonEncoder'
import { firstValueFrom, ReplaySubject } from 'rxjs'
import {CredoError} from '../../../error'
import { TypedArrayEncoder } from '../../../utils'
import { Key, KeyType } from '../../../crypto'


@injectable()
export class DistribuitedUnpackService {
  private pubKeyApi: PubKeyApi
  private envelopeService: EnvelopeService
  private distribuitedUnpackRepository: DistribuitedUnpackRepository
  private logger: Logger

  public constructor(
    @inject(InjectionSymbols.Logger) logger: Logger,
    pubKeyApi: PubKeyApi,
    envelopeService: EnvelopeService,
    distribuitedUnpackRepository: DistribuitedUnpackRepository
  ) {
    this.pubKeyApi = pubKeyApi
    this.envelopeService = envelopeService
    this.distribuitedUnpackRepository = distribuitedUnpackRepository
    this.logger = logger
  }


  public async createRequest(agentContext:AgentContext, encryptedMessage:EncryptedMessage): Promise<CekProtocolMsgReturnType<DistribuitedUnpackRequestMessage>> {
    this.logger.debug("Creating distribuited unpack Request")
    const protectedJson = JsonEncoder.fromBase64(encryptedMessage.protected)
    const recipientKids: string[] = protectedJson.recipients.map((r: any) => r.header.kid)
    const verKey = await this.pubKeyApi.getPublicKey()
    
    const recipientKeyFound = recipientKids.some((recipientKid) => recipientKid === verKey.publicKeyBase58)
    const recipient = protectedJson.recipients.find((r: any) => r.header.kid === verKey.publicKeyBase58)
    if (!recipientKeyFound || !recipient){
      throw new CredoError("No corresponding recipient key found")
    }

    const alg = protectedJson.alg
    if (!['Anoncrypt', 'Authcrypt'].includes(alg)) {
      throw new CredoError(`Unsupported pack algorithm: ${alg}`)
    }

    const sender = recipient.header.sender ? TypedArrayEncoder.fromBase64(recipient.header.sender) : undefined
    const iv = recipient.header.iv ? TypedArrayEncoder.fromBase64(recipient.header.iv) : undefined

    if (!sender || !iv) {
      throw new CredoError('Missing IV')
    } 

    const distribuitedUnpackRecord = await this.createRecord(agentContext, {
        encryptedMessage,
        role:DistribuitedUnpackRole.Requester,
        state:DistribuitedUnpackState.Start      
    })

    const encryptedKey_buffer= TypedArrayEncoder.fromBase64(recipient.encrypted_key)
    const encryptedKey_hex= TypedArrayEncoder.toHex(encryptedKey_buffer)
    const senderKey = TypedArrayEncoder.toHex(sender)
    const message = new DistribuitedUnpackRequestMessage({encryptedKey:encryptedKey_hex, dataId: distribuitedUnpackRecord.id, senderKey,nonce: TypedArrayEncoder.toHex(iv)})
    
    return {
      message,
      distribuitedUnpackRecord
    }
  }

  public async processResponse(message:DistribuitedUnpackResponseMessage, agentContext:AgentContext):Promise<void>{
    this.logger.debug("Processing distribuited unpack Response")
    const distribuitedUnpackRecord = await this.getById(agentContext,message.dataId)

    distribuitedUnpackRecord.assertRole(DistribuitedUnpackRole.Requester)
    distribuitedUnpackRecord.assertState(DistribuitedUnpackState.RequestSent)
    
    const decryptedMessage = await this.envelopeService.distribuitedUnpackMessage(agentContext,distribuitedUnpackRecord.encryptedMessage,message.payloadKey)
    const recipientKey= await this.pubKeyApi.getPublicKey()

    const decryptedMessageContext={
      plaintextMessage: decryptedMessage,
      senderKey: Key.fromPublicKey(TypedArrayEncoder.fromHex(message.senderKey), KeyType.Ed25519),
      recipientKey
    }

    const messageReceiver = agentContext.dependencyManager.resolve(MessageReceiver)
    await messageReceiver.receivePlaintextMessageFromBroker(agentContext,decryptedMessageContext)
    
  }

  public async createRecord(agentContext: AgentContext, options: DistribuitedUnpackRecordProps): Promise<DistribuitedUnpackRecord> {
    const distribuitedUnpackRecord = new DistribuitedUnpackRecord(options)
    await this.distribuitedUnpackRepository.save(agentContext, distribuitedUnpackRecord)
    return distribuitedUnpackRecord
  }

  public async updateState(agentContext: AgentContext, distribuitedUnpackRecord: DistribuitedUnpackRecord, newState: DistribuitedUnpackState) {
    const previousState = distribuitedUnpackRecord.state
    distribuitedUnpackRecord.state = newState
    await this.distribuitedUnpackRepository.update(agentContext, distribuitedUnpackRecord)
  }

  public update(agentContext: AgentContext, cekRecord: DistribuitedUnpackRecord) {
    return this.distribuitedUnpackRepository.update(agentContext, cekRecord)
  }


  /**
   * Retrieve all DistribuitedUnpack records
   *
   * @returns List containing all connection records
   */
  public getAll(agentContext: AgentContext) {
    return this.distribuitedUnpackRepository.getAll(agentContext)
  }

  /**
   * Retrieve a DistribuitedUnpack record by id
   *
   * @param distribuitedUnpackId The connection record id
   * @throws {RecordNotFoundError} If no record is found
   * @return The pubkey record
   *
   */
  public getById(agentContext: AgentContext, distribuitedUnpackId: string): Promise<DistribuitedUnpackRecord> {
    return this.distribuitedUnpackRepository.getById(agentContext, distribuitedUnpackId)
  }


}

export interface CekProtocolMsgReturnType<MessageType extends AgentMessage> {
  message: MessageType
  distribuitedUnpackRecord: DistribuitedUnpackRecord
}