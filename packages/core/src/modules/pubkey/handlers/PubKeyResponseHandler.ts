import type { MessageHandler, MessageHandlerInboundMessage } from '../../../agent/MessageHandler'

import { OutboundMessageContext } from '../../../agent/models'
import { ReturnRouteTypes } from '../../../decorators/transport/TransportDecorator'
import { CredoError } from '../../../error'
import { PubKeyRole } from '../models'

import { PubKeyService } from '../services'
import { PubKeyResponseMessage } from '../messages/PubKeyResponseMessage'

export class PubKeyResponseHandler implements MessageHandler {
  private pubKeyService: PubKeyService

  public supportedMessages = [PubKeyResponseMessage]

  public constructor(
    pubKeyService: PubKeyService,
  ) {
    this.pubKeyService = pubKeyService
  }

  public async handle(messageContext: MessageHandlerInboundMessage<PubKeyResponseHandler>) {
    const { message } = messageContext
    
    await this.pubKeyService.processResponse(message,messageContext.agentContext)
    
  }
}
