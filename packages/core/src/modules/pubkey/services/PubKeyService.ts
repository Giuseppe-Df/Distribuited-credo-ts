import { Logger } from '../../../logger'
import type { AgentMessage } from '../../../agent/AgentMessage'
import { inject, injectable } from '../../../plugins'
import { PubKeyRepository } from '../repository/PubKeyRepository'
import { InjectionSymbols } from '../../../constants'
import { EventEmitter } from '../../../agent/EventEmitter'
import { AgentContext } from 'packages/core/src/agent'
import { PubKeyRecordProps } from '../repository/PubKeyRecord'
import { PubKeyRecord } from '../repository/PubKeyRecord'
import { PubKeyState, PubKeyRole } from '../models'
import { PubKeyRequestMessage } from '../messages'

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
    const pubKey= await this.getByContextId(agentContext,agentContext.contextCorrelationId)
    let keyRecord: PubKeyRecord
    if(!pubKey){
        keyRecord = await this.createRecord(agentContext, {
            contextId: agentContext.contextCorrelationId,
            role:PubKeyRole.Requester,
            state:PubKeyState.Start      
        })    
    }else{
        pubKey.state=PubKeyState.Start
        pubKey.key=undefined
        keyRecord=pubKey
    }
    const message = new PubKeyRequestMessage({contextId:agentContext.contextCorrelationId})
    
    return {
      message,
      keyRecord
    }
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

    //this.emitStateChangedEvent(agentContext, connectionRecord, previousState)
  }

  public update(agentContext: AgentContext, pubKeyRecord: PubKeyRecord) {
    return this.pubKeyRepository.update(agentContext, pubKeyRecord)
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
   * Retrieve a pubKey record by context id
   *
   */
  public async getByContextId(agentContext: AgentContext, contextId: string): Promise<PubKeyRecord> {
    return this.pubKeyRepository.getByContextId(agentContext, contextId)
  }

}

export interface PubKeyProtocolMsgReturnType<MessageType extends AgentMessage> {
  message: MessageType
  keyRecord: PubKeyRecord
}