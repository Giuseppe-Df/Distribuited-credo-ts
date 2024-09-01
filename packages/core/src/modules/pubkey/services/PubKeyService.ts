import type { AgentMessage } from '../../../agent/AgentMessage'
import { AgentContext } from 'packages/core/src/agent'
import { EventEmitter } from '../../../agent/EventEmitter'
import { Key, KeyType } from '../../../crypto'

import { PubKeyRepository } from '../repository/PubKeyRepository'
import { PubKeyRecordProps } from '../repository/PubKeyRecord'
import { PubKeyRecord } from '../repository/PubKeyRecord'
import { PubKeyState, PubKeyRole } from '../models'
import { PubKeyRequestMessage, PubKeyResponseMessage } from '../messages'
import type { PubKeyStateChangedEvent } from '../PubKeyEvents'
import { PubKeyEventTypes } from '../PubKeyEvents'

import { Logger } from '../../../logger'
import { inject, injectable } from '../../../plugins'
import { InjectionSymbols } from '../../../constants'
import { first, map, timeout } from 'rxjs/operators'
import { filterContextCorrelationId } from '../../../agent/Events'
import { firstValueFrom, ReplaySubject } from 'rxjs'
import {CredoError} from '../../../error'
import { TypedArrayEncoder } from '../../../utils'


@injectable()
export class PubKeyService {
  private pubKeyRepository: PubKeyRepository
  private eventEmitter: EventEmitter
  private logger: Logger

  public constructor(
    @inject(InjectionSymbols.Logger) logger: Logger,
    pubKeyRepository: PubKeyRepository,
    eventEmitter: EventEmitter
  ) {
    this.pubKeyRepository= pubKeyRepository
    this.eventEmitter = eventEmitter
    this.logger = logger
  }

  public async createRequest(agentContext:AgentContext): Promise<PubKeyProtocolMsgReturnType<PubKeyRequestMessage>> {
    this.logger.debug("Creating Public Key Request")
    const pubKey= await this.findByContextId(agentContext,agentContext.contextCorrelationId)
    let keyRecord: PubKeyRecord

    if (pubKey){
      this.logger.debug("Resetting the exisisting Public Key")
      this.delete(agentContext,pubKey)
    }else{
      this.logger.debug("No Exisisting Public Key Found")
    }

    keyRecord = await this.createRecord(agentContext, {
        contextId: agentContext.contextCorrelationId,
        role:PubKeyRole.Requester,
        state:PubKeyState.Start      
    })    
    const message = new PubKeyRequestMessage({contextId:agentContext.contextCorrelationId})
    
    return {
      message,
      keyRecord
    }
  }

  public async processResponse(message:PubKeyResponseMessage, agentContext:AgentContext):Promise<void>{
    this.logger.debug("Processing Public Key response")
    const keyRecord= await this.findByContextId(agentContext,agentContext.contextCorrelationId);

    if (!keyRecord || !message.publicKey){
      throw new CredoError("Unable to process Public Key Response");
    }

    keyRecord.assertState(PubKeyState.RequestSent)
    keyRecord.assertRole(PubKeyRole.Requester)
    
    const previusState=keyRecord.state
    keyRecord.key=message.publicKey
    keyRecord.state=PubKeyState.Completed

    this.update(agentContext,keyRecord)
    this.emitStateChangedEvent(agentContext,keyRecord,previusState)

  }

  public async getPublicKey (agentContext:AgentContext):Promise<Key>{
    this.logger.debug("Retriving device Public Key")
    const publicKeyRecord = await this.getByContextId(agentContext,agentContext.contextCorrelationId)
    const {key}= publicKeyRecord
    if (!key){
      throw new CredoError("The agent has no associated public key")
    }
    return Key.fromPublicKey(TypedArrayEncoder.fromHex(key),KeyType.Ed25519)
  }

  public async createRecord(agentContext: AgentContext, options: PubKeyRecordProps): Promise<PubKeyRecord> {
    const keyRecord = new PubKeyRecord(options)
    await this.pubKeyRepository.save(agentContext, keyRecord)
    return keyRecord
  }

  public async updateState(agentContext: AgentContext, pubKeyRecord: PubKeyRecord, newState: PubKeyState) {
    const previousState = pubKeyRecord.state
    pubKeyRecord.state = newState
    await this.pubKeyRepository.update(agentContext, pubKeyRecord)
  }

  public update(agentContext: AgentContext, pubKeyRecord: PubKeyRecord) {
    return this.pubKeyRepository.update(agentContext, pubKeyRecord)
  }

  private emitStateChangedEvent(
    agentContext: AgentContext,
    pubKeyRecord: PubKeyRecord,
    previousState:PubKeyState | null
  ) {
    this.eventEmitter.emit<PubKeyStateChangedEvent>(agentContext, {
      type: PubKeyEventTypes.PubKeyStateChanged,
      payload: {
        // Connection record in event should be static
        pubKeyRecord: pubKeyRecord.clone(),
        previousState,
      },
    })
  }

  /**
   * Retrieve all pubKey records
   *
   * @returns List containing all connection records
   */
  public getAll(agentContext: AgentContext) {
    return this.pubKeyRepository.getAll(agentContext)
  }

  /**
   * Retrieve a pubKey record by context id or throw an error
   *
   */
  public async getByContextId(agentContext: AgentContext, contextId: string): Promise<PubKeyRecord> {
    return this.pubKeyRepository.getByContextId(agentContext, contextId)
  }

  /**
   * Retrieve a pubKey record by context id
   *
   */
  public async findByContextId(agentContext: AgentContext, contextId: string): Promise<PubKeyRecord|null> {
    return this.pubKeyRepository.findByContextId(agentContext, contextId)
  }

  /**
   * Retrieve a pubKey record by id
   *
   * @param pubkeyId The connection record id
   * @throws {RecordNotFoundError} If no record is found
   * @return The pubkey record
   *
   */
  public getById(agentContext: AgentContext, pubkeyId: string): Promise<PubKeyRecord> {
    return this.pubKeyRepository.getById(agentContext, pubkeyId)
  }

  /**
   * Delete a pubKey record
   *
   * @param pubkeyRecord The record to delete
   *
   */
  private delete(agentContext: AgentContext, pubkeyRecord: PubKeyRecord) {
    this.pubKeyRepository.delete(agentContext, pubkeyRecord)
  }

  public async returnWhenIsObtained(
    agentContext: AgentContext,
    pubKeyId: string,
    timeoutMs = 20000
  ){
    const isObtained = (pubKey: PubKeyRecord) => {
      return pubKey.id === pubKeyId && pubKey.state === PubKeyState.Completed
    }

    const observable = this.eventEmitter.observable<PubKeyStateChangedEvent>(
      PubKeyEventTypes.PubKeyStateChanged
    )
    const subject = new ReplaySubject<PubKeyRecord>(1)

    observable
      .pipe(
        filterContextCorrelationId(agentContext.contextCorrelationId),
        map((e) => e.payload.pubKeyRecord),
        first(isObtained), // Do not wait for longer than specified timeout
        timeout({
          first: timeoutMs,
          meta: 'PubKeyService.returnWhenIsObtained',
        })
      )
      .subscribe(subject)

    const pubKey = await this.getById(agentContext, pubKeyId)
    if (isObtained(pubKey)) {
      subject.next(pubKey)
    }

    return firstValueFrom(subject)
  }

}

export interface PubKeyProtocolMsgReturnType<MessageType extends AgentMessage> {
  message: MessageType
  keyRecord: PubKeyRecord
}