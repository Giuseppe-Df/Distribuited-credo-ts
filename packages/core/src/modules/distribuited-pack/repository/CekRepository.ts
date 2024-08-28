import type { AgentContext } from '../../../agent'
import type { CekRole } from '../models'

import { EventEmitter } from '../../../agent/EventEmitter'
import { InjectionSymbols } from '../../../constants'
import { injectable, inject } from '../../../plugins'
import { Repository } from '../../../storage/Repository'
import { StorageService } from '../../../storage/StorageService'

import { CekRecord } from './CekRecord'

@injectable()
export class CekRepository extends Repository<CekRecord> {
  public constructor(
    @inject(InjectionSymbols.StorageService) storageService: StorageService<CekRecord>,
    eventEmitter: EventEmitter
  ) {
    super(CekRecord, storageService, eventEmitter)
  }


  public getById(agentContext: AgentContext, id: string): Promise<CekRecord> {
    return this.getSingleByQuery(agentContext, { id })
  }

  /*public getByContextId(agentContext: AgentContext, contextId: string): Promise<CekRecord> {
    return this.getSingleByQuery(agentContext, { contextId })
  }

  public findByContextId(agentContext: AgentContext, contextId: string): Promise<CekRecord|null> {
    return this.findSingleByQuery(agentContext, { contextId })
  }*/

}
