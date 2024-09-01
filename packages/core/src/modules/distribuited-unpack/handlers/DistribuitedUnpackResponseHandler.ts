import type { MessageHandler, MessageHandlerInboundMessage } from '../../../agent/MessageHandler'

import { DistribuitedUnpackService } from '../services'
import { DistribuitedUnpackResponseMessage } from '../messages/DistribuitedUnpackResponseMessage'

export class DistribuitedUnpackResponseHandler implements MessageHandler {
  private distribuitedUnpackService: DistribuitedUnpackService

  public supportedMessages = [DistribuitedUnpackResponseMessage]

  public constructor(
    distribuitedUnpackService: DistribuitedUnpackService,
  ) {
    this.distribuitedUnpackService = distribuitedUnpackService
  }

  public async handle(messageContext: MessageHandlerInboundMessage<DistribuitedUnpackResponseHandler>) {
    const { message } = messageContext
    
    await this.distribuitedUnpackService.processResponse(message,messageContext.agentContext)
    
  }
}
