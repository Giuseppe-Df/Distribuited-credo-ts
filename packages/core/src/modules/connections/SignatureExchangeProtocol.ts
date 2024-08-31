import { AgentContext } from '../../agent'
import { InjectionSymbols } from '../../constants'

import { Logger } from '../../logger'
import { inject, injectable } from '../../plugins'
import { TypedArrayEncoder, isDid, Buffer } from '../../utils'
import { JsonEncoder } from '../../utils/JsonEncoder'

import { SignatureExchangeService } from './services'
import { DidExchangeRequestMessage } from './messages'
import { SignatureExchangeRole, SignatureExchangeState } from './models'
import { MessageSender } from '../../agent/MessageSender'
import { DidDocument } from '../dids'
import { SignatureExchangeRequestMessageOptions, SignatureExchangeRequestMessage } from './messages/SignatureExchangeRequestMessage'
import { OutboundMessageContext } from '../../agent/models'



@injectable()
export class SignatureExchangeProtocol {
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

  public async createRequest(agentContext:AgentContext, storedMessage: DidExchangeRequestMessage, connectionId:string, didDoc:DidDocument,parentid:string) : Promise <void>{
    
    const {message, signatureRecord} = await this.signatureExchangeService.createRequest(agentContext, {
      message: storedMessage.toJSON(),
      connectionId: connectionId,
      didDocument: didDoc,
      parentid:parentid
    })

    await this.messageSender.sendMessageToBroker(message,agentContext)
    await this.signatureExchangeService.updateState(agentContext, signatureRecord,SignatureExchangeState.RequestSent)
    
  }

}