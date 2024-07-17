import type { AgentContext } from '../../../agent'
import { Logger } from '../../../logger'
import { inject, injectable } from '../../../plugins'
import { SignatureExchangeRepository } from '../repository/SignatureExchangeRepository'
import { InjectionSymbols } from '../../../constants'
import { EventEmitter } from '../../../agent/EventEmitter'
import type { SignatureExchangeRecordProps } from '../repository/SignatureExchangeRecord'
import { SignatureExchangeRecord } from '../repository/SignatureExchangeRecord'


@injectable()
export class SignatureExchangeService {
  private signatureExchangeRepository: SignatureExchangeRepository
  private logger: Logger
  private eventEmitter: EventEmitter

  public constructor(
    @inject(InjectionSymbols.Logger) logger: Logger,
    signatureExchangeRepository:SignatureExchangeRepository,
    eventEmitter: EventEmitter
  ) {
    this.signatureExchangeRepository = signatureExchangeRepository
    this.eventEmitter = eventEmitter
    this.logger = logger
  }

  public async createRequest(agentContext: AgentContext, options: SignatureExchangeRecordProps): Promise<SignatureExchangeRecord> {
    const signatureExchangeRecord = new SignatureExchangeRecord(options)
    await this.signatureExchangeRepository.save(agentContext, signatureExchangeRecord)
    return signatureExchangeRecord
  }
}
