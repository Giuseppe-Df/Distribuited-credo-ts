import type { MessageHandler, MessageHandlerInboundMessage } from '../../../agent/MessageHandler'

import { OutboundMessageContext } from '../../../agent/models'
import { ReturnRouteTypes } from '../../../decorators/transport/TransportDecorator'
import { CredoError } from '../../../error'
import { DistribuitedPackRole } from '../models'

import { DistribuitedPackService } from '../services'
import { DistribuitedPackResponseMessage } from '../messages/DistribuitedPackResponseMessage'

export class DistribuitedPackResponseHandler implements MessageHandler {
  private distribuitedPackService: DistribuitedPackService

  public supportedMessages = [DistribuitedPackResponseMessage]

  public constructor(
    distribuitedPackService: DistribuitedPackService,
  ) {
    this.distribuitedPackService = distribuitedPackService
  }

  public async handle(messageContext: MessageHandlerInboundMessage<DistribuitedPackResponseHandler>) {
    const { message } = messageContext
    
    const {encryptedMessage, endpoint, connectionId, service} = await this.distribuitedPackService.processResponse(message,messageContext.agentContext)

    return { outboundPackage:{
      payload: encryptedMessage,
      responseRequested: message.hasAnyReturnRoute(),
      endpoint,
      connectionId
    }, service}
    
  }
}
