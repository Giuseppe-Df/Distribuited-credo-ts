import type { AgentContext } from '../../../agent'
import type { DistribuitedPackRole } from '../models'

import { EventEmitter } from '../../../agent/EventEmitter'
import { InjectionSymbols } from '../../../constants'
import { injectable, inject } from '../../../plugins'
import { Repository } from '../../../storage/Repository'
import { StorageService } from '../../../storage/StorageService'

import { DistribuitedPackRecord } from './DistribuitedPackRecord'

@injectable()
export class DistribuitedPackRepository extends Repository<DistribuitedPackRecord> {
  public constructor(
    @inject(InjectionSymbols.StorageService) storageService: StorageService<DistribuitedPackRecord>,
    eventEmitter: EventEmitter
  ) {
    super(DistribuitedPackRecord, storageService, eventEmitter)
  }


  public getById(agentContext: AgentContext, id: string): Promise<DistribuitedPackRecord> {
    return this.getSingleByQuery(agentContext, { id })
  }

  /*public getByContextId(agentContext: AgentContext, contextId: string): Promise<CekRecord> {
    return this.getSingleByQuery(agentContext, { contextId })
  }

  public findByContextId(agentContext: AgentContext, contextId: string): Promise<CekRecord|null> {
    return this.findSingleByQuery(agentContext, { contextId })
  }*/

}
