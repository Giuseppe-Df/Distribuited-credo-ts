import type { MessageHandler, MessageHandlerInboundMessage } from '../../../agent/MessageHandler'

import { OutboundMessageContext } from '../../../agent/models'
import { ReturnRouteTypes } from '../../../decorators/transport/TransportDecorator'
import { CredoError } from '../../../error'
import { CekRole } from '../models'

import { CekExchangeService } from '../services'
import { CekResponseMessage } from '../messages/CekResponseMessage'

export class CekResponseHandler implements MessageHandler {
  private cekService: CekExchangeService

  public supportedMessages = [CekResponseMessage]

  public constructor(
    cekService: CekExchangeService,
  ) {
    this.cekService = cekService
  }

  public async handle(messageContext: MessageHandlerInboundMessage<CekResponseHandler>) {
    const { message } = messageContext
    
    await this.cekService.processResponse(message,messageContext.agentContext)
    
  }
}
