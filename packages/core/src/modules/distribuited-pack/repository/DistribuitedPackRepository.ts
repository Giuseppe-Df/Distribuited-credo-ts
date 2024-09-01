import type { AgentContext } from '../../../agent'
import { EventEmitter } from '../../../agent/EventEmitter'
import { Repository } from '../../../storage/Repository'
import { StorageService } from '../../../storage/StorageService'

import { InjectionSymbols } from '../../../constants'
import { injectable, inject } from '../../../plugins'

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


}
