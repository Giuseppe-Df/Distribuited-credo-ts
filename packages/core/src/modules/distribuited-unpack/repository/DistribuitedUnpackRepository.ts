import type { AgentContext } from '../../../agent'
import type { DistribuitedUnpackRole } from '../models'

import { EventEmitter } from '../../../agent/EventEmitter'
import { InjectionSymbols } from '../../../constants'
import { injectable, inject } from '../../../plugins'
import { Repository } from '../../../storage/Repository'
import { StorageService } from '../../../storage/StorageService'

import { DistribuitedUnpackRecord } from './DistribuitedUnpackRecord'

@injectable()
export class DistribuitedUnpackRepository extends Repository<DistribuitedUnpackRecord> {
  public constructor(
    @inject(InjectionSymbols.StorageService) storageService: StorageService<DistribuitedUnpackRecord>,
    eventEmitter: EventEmitter
  ) {
    super(DistribuitedUnpackRecord, storageService, eventEmitter)
  }


  public getById(agentContext: AgentContext, id: string): Promise<DistribuitedUnpackRecord> {
    return this.getSingleByQuery(agentContext, { id })
  }

}
