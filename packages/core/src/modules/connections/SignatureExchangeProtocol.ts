import { AgentContext } from '../../agent'
import { InjectionSymbols } from '../../constants'

import { Logger } from '../../logger'
import { inject, injectable } from '../../plugins'

import { SignatureExchangeService } from './services'
import { DidExchangeRequestMessage } from './messages'
import { SignatureExchangeRole, SignatureExchangeState } from './models'
import { MessageSender } from '../../agent/MessageSender'
import { DidDocument } from '../dids'
import { SignatureExchangeExchangeRequestMessageOptions, SignatureExchangeRequestMessage } from './messages/SignatureExchangeRequestMessage'
import { OutboundMessageContext } from '../../agent/models'



@injectable()
export class DidExchangeProtocol {
  private logger: Logger
  private signatureExchangeService: SignatureExchangeService
  private messageSender: MessageSender

  public constructor(
    @inject(InjectionSymbols.Logger) logger: Logger,
    messageSender: MessageSender,
    signatureExchangeService: SignatureExchangeService
  ) {
    this.logger = logger
    this.signatureExchangeService=signatureExchangeService
    this.messageSender = messageSender
  }

  public async creteRequest(agentContext:AgentContext, message: DidExchangeRequestMessage, connectionId:string, didDoc:DidDocument) : Promise <void>{
    const signatureExchangeRecord = await this.signatureExchangeService.createRequest(agentContext, {
      message: message,
      connectionId: connectionId,
      contextId: agentContext.contextCorrelationId,
      state: SignatureExchangeState.Start,
      role: SignatureExchangeRole.Requester
    })

    const label = agentContext.config.label
    const requestMessage= new SignatureExchangeRequestMessage({label,didDoc,connectionId})
    this.messageSender.sendMessageToBroker(requestMessage,"signature")
    
  }

}