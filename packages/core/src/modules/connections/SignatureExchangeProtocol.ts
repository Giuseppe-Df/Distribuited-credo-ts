import { AgentContext } from '../../agent'
import { MessageSender } from '../../agent/MessageSender'

import { Logger } from '../../logger'
import { inject, injectable } from '../../plugins'
import { InjectionSymbols } from '../../constants'
import { DidDocument } from '../dids'
import { DidExchangeRequestMessage } from './messages'

import { SignatureExchangeService } from './services'
import {SignatureExchangeState } from './models'



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