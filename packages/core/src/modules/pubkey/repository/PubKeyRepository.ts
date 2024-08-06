import type { AgentContext } from '../../../agent'
import type { PubKeyRole } from '../models'

import { EventEmitter } from '../../../agent/EventEmitter'
import { InjectionSymbols } from '../../../constants'
import { injectable, inject } from '../../../plugins'
import { Repository } from '../../../storage/Repository'
import { StorageService } from '../../../storage/StorageService'

import { PubKeyRecord } from './PubKeyRecord'

@injectable()
export class PubKeyRepository extends Repository<PubKeyRecord> {
  public constructor(
    @inject(InjectionSymbols.StorageService) storageService: StorageService<PubKeyRecord>,
    eventEmitter: EventEmitter
  ) {
    super(PubKeyRecord, storageService, eventEmitter)
  }


  public getById(agentContext: AgentContext, id: string): Promise<PubKeyRecord> {
    return this.getSingleByQuery(agentContext, { id })
  }

  public getByContextId(agentContext: AgentContext, contextId: string): Promise<PubKeyRecord> {
    return this.getSingleByQuery(agentContext, { contextId })
  }


}
