import type { AgentContext } from '../../../agent'
import { EventEmitter } from '../../../agent/EventEmitter'
import { Repository } from '../../../storage/Repository'
import { StorageService } from '../../../storage/StorageService'

import { InjectionSymbols } from '../../../constants'
import { injectable, inject } from '../../../plugins'

import { SignatureExchangeRecord } from './SignatureExchangeRecord'

@injectable()
export class SignatureExchangeRepository extends Repository<SignatureExchangeRecord> {
  public constructor(
    @inject(InjectionSymbols.StorageService) storageService: StorageService<SignatureExchangeRecord>,
    eventEmitter: EventEmitter
  ) {
    super(SignatureExchangeRecord, storageService, eventEmitter)
  }

  public async findByDids(agentContext: AgentContext, { ourDid, theirDid }: { ourDid: string; theirDid: string }) {
    return this.findSingleByQuery(agentContext, {
      $or: [
        {
          did: ourDid,
          theirDid,
        },
        { did: ourDid, previousTheirDids: [theirDid] },
        { previousDids: [ourDid], theirDid },
      ],
    })
  }

  public getByContextId(agentContext: AgentContext, contextId: string): Promise<SignatureExchangeRecord> {
    return this.getSingleByQuery(agentContext, { contextId })
  }


}
