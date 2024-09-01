import type { AgentMessage } from '../../../agent/AgentMessage'
import { AgentContext } from 'packages/core/src/agent'
import { EventEmitter } from '../../../agent/EventEmitter'
import { PubKeyApi } from '../../pubkey/PubKeyApi'
import { EnvelopeKeys, EnvelopeService } from '../../../agent/EnvelopeService'

import { DistribuitedPackRecordProps } from '../repository/DistribuitedPackRecord'
import { DistribuitedPackRecord } from '../repository/DistribuitedPackRecord'
import { DistribuitedPackState, DistribuitedPackRole } from '../models'
import { DistribuitedPackRepository } from '../repository/DistribuitedPackRepository'
import { DistribuitedPackRequestMessage, DistribuitedPackResponseMessage } from '../messages'


import { Logger } from '../../../logger'
import { EncryptedMessage } from '../../../types'
import { inject, injectable } from '../../../plugins'
import { InjectionSymbols } from '../../../constants'
import {CredoError} from '../../../error'
import { TypedArrayEncoder } from '../../../utils'
import { ResolvedDidCommService } from '../../didcomm/types'
import { Key, KeyType } from '../../../crypto'

@injectable()
export class DistribuitedPackService {
  private pubKeyApi: PubKeyApi
  private envelopeService: EnvelopeService
  private distribuitedPackRepository: DistribuitedPackRepository
  private logger: Logger

  public constructor(
    @inject(InjectionSymbols.Logger) logger: Logger,
    pubKeyApi: PubKeyApi,
    envelopeService: EnvelopeService,
    distribuitedPackRepository: DistribuitedPackRepository
  ) {
    this.pubKeyApi = pubKeyApi
    this.envelopeService = envelopeService
    this.distribuitedPackRepository = distribuitedPackRepository
    this.logger = logger
  }


  public async createRequest(
    agentContext: AgentContext,
    {
      keys,
      payload,
      endpoint,
      service,
      connectionId
    }: {
      keys: EnvelopeKeys
      payload: AgentMessage
      endpoint: string
      service:ResolvedDidCommService
      connectionId?:string
    }
  ): Promise<DistribuitedPackMsgReturnType<DistribuitedPackRequestMessage>> {
    this.logger.debug("Creating Distribuited Pack Request")

    const { recipientKeys, senderKey } = keys
    const recipientKey= TypedArrayEncoder.toHex(recipientKeys[0].publicKey)
    const recipientKeyBase58 = recipientKeys[0].publicKeyBase58
    const senderKeyBase58 = senderKey && senderKey.publicKeyBase58
    const deviceKey = await this.pubKeyApi.getPublicKey()

    if (senderKeyBase58!==deviceKey.publicKeyBase58){
      throw new CredoError("Device key and Sender key does not match")
    }

    const record= await this.createRecord(agentContext,{
      payload:payload.toJSON({ useDidSovPrefixWhereAllowed: agentContext.config.useDidSovPrefixWhereAllowed }),
      recipientKeyBase58,
      senderKeyBase58,
      endpoint,
      serviceId: service.id,
      connectionId,
      state: DistribuitedPackState.Start,
      role: DistribuitedPackRole.Requester
    })

    const cek= await agentContext.wallet.createCek(record.id)
    const message = new DistribuitedPackRequestMessage({cek, recipientKey,dataId:record.id})
    
    return {
      messageToSend: message,
      record
    }
  }

  public async processResponse(message:DistribuitedPackResponseMessage, agentContext:AgentContext):Promise<{encryptedMessage:EncryptedMessage, endpoint:string, connectionId?:string, service: ResolvedDidCommService}>{
    
    const dataId = message.dataId
    const record = await this.getById(agentContext,dataId)
    record.assertRole(DistribuitedPackRole.Requester)
    record.assertState(DistribuitedPackState.RequestSent)

    const keys = {
      recipientKeys: [Key.fromPublicKeyBase58(record.recipientKeyBase58,KeyType.Ed25519)],
      routingKeys: [],
      senderKey: Key.fromPublicKeyBase58(record.senderKeyBase58,KeyType.Ed25519),
    }
    
    const service ={
      id: record.serviceId,
      recipientKeys: [Key.fromPublicKeyBase58(record.recipientKeyBase58,KeyType.Ed25519)],
      routingKeys: [],
      serviceEndpoint: record.endpoint
    }
    
    const encryptedMessage = await this.envelopeService.distribuitedPackMessage(agentContext,record.payload,keys, dataId,message.nonce, message.encryptedCek)

    return {encryptedMessage, endpoint: record.endpoint, connectionId:record.connectionId, service}
    

  }

  public async createRecord(agentContext: AgentContext, options: DistribuitedPackRecordProps): Promise<DistribuitedPackRecord> {
    const record = new DistribuitedPackRecord(options)
    await this.distribuitedPackRepository.save(agentContext,record)
    return record
  }

  public async updateState(agentContext: AgentContext, record: DistribuitedPackRecord, newState: DistribuitedPackState) {
    const previousState = record.state
    record.state = newState
    await this.distribuitedPackRepository.update(agentContext, record)

    //this.emitStateChangedEvent(agentContext, connectionRecord, previousState)
  }

  public update(agentContext: AgentContext, record: DistribuitedPackRecord) {
    return this.distribuitedPackRepository.update(agentContext, record)
  }


  /**
   * Retrieve all pubKey records
   *
   * @returns List containing all connection records
   */
  public getAll(agentContext: AgentContext) {
    return this.distribuitedPackRepository.getAll(agentContext)
  }

  /**
   * Retrieve a cek record by id
   *
   * @param cekId The connection record id
   * @throws {RecordNotFoundError} If no record is found
   * @return The pubkey record
   *
   */
  public getById(agentContext: AgentContext, id: string): Promise<DistribuitedPackRecord> {
    return this.distribuitedPackRepository.getById(agentContext, id)
  }


}

export interface DistribuitedPackMsgReturnType<MessageType extends AgentMessage> {
  messageToSend: MessageType
  record: DistribuitedPackRecord
}