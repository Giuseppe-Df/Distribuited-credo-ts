import { Logger } from '../../../logger'
import { inject, injectable } from '../../../plugins'
import { PubKeyRepository } from '../repository/PubKeyRepository'
import { InjectionSymbols } from '../../../constants'
import { EventEmitter } from '../../../agent/EventEmitter'
import { AgentContext } from 'packages/core/src/agent'
import { PubKeyRecordProps } from '../repository/PubKeyRecord'
import { PubKeyRecord } from '../repository/PubKeyRecord'

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

  public async createKey(agentContext: AgentContext, options: PubKeyRecordProps): Promise<PubKeyRecord> {
    const keyRecord = new PubKeyRecord(options)
    await this.pubKeyRepository.save(agentContext, keyRecord)
    return keyRecord
  }
}