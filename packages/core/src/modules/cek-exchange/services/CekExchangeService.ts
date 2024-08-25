import type { AgentMessage } from '../../../agent/AgentMessage'
import { EncryptedMessage } from '../../../types'
import { AgentContext } from 'packages/core/src/agent'
import { EventEmitter } from '../../../agent/EventEmitter'
import { filterContextCorrelationId } from '../../../agent/Events'
import { Logger } from '../../../logger'

import { CekRecordProps } from '../repository/CekRecord'
import { CekRecord } from '../repository/CekRecord'
import { CekState, CekRole } from '../models'
import { CekRepository } from '../repository'
import { CekRequestMessage, CekResponseMessage } from '../messages'
import { PubKeyApi } from '../../pubkey/PubKeyApi'
import { EnvelopeService } from '../../../agent/EnvelopeService'

import { inject, injectable } from '../../../plugins'
import { InjectionSymbols } from '../../../constants'
import { first, map, timeout } from 'rxjs/operators'
import { JsonEncoder } from '../../../utils/JsonEncoder'
import { firstValueFrom, ReplaySubject } from 'rxjs'
import {CredoError} from '../../../error'
import { TypedArrayEncoder } from '../../../utils'


@injectable()
export class CekExchangeService {
  private pubKeyApi: PubKeyApi
  private envelopeService: EnvelopeService
  private cekRepository: CekRepository
  private eventEmitter: EventEmitter
  private logger: Logger

  public constructor(
    @inject(InjectionSymbols.Logger) logger: Logger,
    pubKeyApi: PubKeyApi,
    envelopeService: EnvelopeService,
    cekRepository: CekRepository,
    eventEmitter: EventEmitter
  ) {
    this.pubKeyApi = pubKeyApi
    this.envelopeService = envelopeService
    this.cekRepository = cekRepository
    this.eventEmitter = eventEmitter
    this.logger = logger
  }


  public async createRequest(agentContext:AgentContext, encryptedMessage:EncryptedMessage): Promise<CekProtocolMsgReturnType<CekRequestMessage>> {
    this.logger.debug("Creating Cek Exchange Request")
    const protectedJson = JsonEncoder.fromBase64(encryptedMessage.protected)
    const recipientKids: string[] = protectedJson.recipients.map((r: any) => r.header.kid)
    const verKey = await this.pubKeyApi.getPublicKey()
    
    const recipientKeyFound = recipientKids.some((recipientKid) => {recipientKid === verKey.publicKeyBase58})
    const recipient = protectedJson.recipients.find((r: any) => r.header.kid === verKey.publicKeyBase58)
    if (!recipientKeyFound || !recipient){
      throw new CredoError("No corresponding recipient key found")
    }

    const alg = protectedJson.alg
    if (!['Anoncrypt'].includes(alg)) {
      throw new CredoError(`Unsupported pack algorithm: ${alg}`)
    }

    const cekRecord = await this.createRecord(agentContext, {
        encryptedMessage,
        role:CekRole.Requester,
        state:CekState.Start      
    })
    const encryptedKey_buffer= TypedArrayEncoder.fromBase64(recipient.encrypted_key)
    const encryptedKey_hex= TypedArrayEncoder.toHex(encryptedKey_buffer)
    const message = new CekRequestMessage({encryptedKey:encryptedKey_hex, dataId: cekRecord.id})
    
    return {
      message,
      cekRecord
    }
  }

  public async processResponse(message:CekResponseMessage, agentContext:AgentContext):Promise<void>{
    const cekRecord = await this.getById(agentContext,message.dataId)
    
    const decryptedMessage = await this.envelopeService.unpackMessageCek(agentContext,cekRecord.encryptedMessage,message.payloadKey)
    agentContext.config.logger.debug("ci sono riuscito",decryptedMessage)
    

  }

  public async createRecord(agentContext: AgentContext, options: CekRecordProps): Promise<CekRecord> {
    const cekRecord = new CekRecord(options)
    await this.cekRepository.save(agentContext, cekRecord)
    return cekRecord
  }

  public async updateState(agentContext: AgentContext, cekRecord: CekRecord, newState: CekState) {
    const previousState = cekRecord.state
    cekRecord.state = newState
    await this.cekRepository.update(agentContext, cekRecord)

    //this.emitStateChangedEvent(agentContext, connectionRecord, previousState)
  }

  public update(agentContext: AgentContext, cekRecord: CekRecord) {
    return this.cekRepository.update(agentContext, cekRecord)
  }


  /**
   * Retrieve all pubKey records
   *
   * @returns List containing all connection records
   */
  public getAll(agentContext: AgentContext) {
    return this.cekRepository.getAll(agentContext)
  }

  /**
   * Retrieve a cek record by id
   *
   * @param cekId The connection record id
   * @throws {RecordNotFoundError} If no record is found
   * @return The pubkey record
   *
   */
  public getById(agentContext: AgentContext, cekId: string): Promise<CekRecord> {
    return this.cekRepository.getById(agentContext, cekId)
  }


}

export interface CekProtocolMsgReturnType<MessageType extends AgentMessage> {
  message: MessageType
  cekRecord: CekRecord
}