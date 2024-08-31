import { AgentContext } from '../../agent'
import { MessageSender } from '../../agent/MessageSender'
import { CekRequestMessage } from './messages'
import { CekExchangeService } from './services'
import { CekRole,CekState } from './models'
import { CekResponseMessage } from './messages/CekResponseMessage'

import { injectable } from '../../plugins'
import { CekRecord } from './repository'
import { MessageHandlerRegistry } from '../../agent/MessageHandlerRegistry'
import { CekResponseHandler } from './handlers'
import { EncryptedMessage } from '../../types'

@injectable()
export class CekExchangeApi {
    private agentContext: AgentContext
    private messageSender: MessageSender
    private cekService: CekExchangeService

    public constructor(
        messageHandlerRegistry: MessageHandlerRegistry,
        messageSender: MessageSender,
        agentContext: AgentContext,
        cekService: CekExchangeService
    ) {
        this.agentContext = agentContext
        this.messageSender = messageSender
        this.cekService = cekService

        this.registerMessageHandlers(messageHandlerRegistry)
    }


    public async requestContentEncryptionKey(encryptedMessage: EncryptedMessage, receivedAt?: Date){
        const result= await this.cekService.createRequest(this.agentContext,encryptedMessage,receivedAt)
        const {message,cekRecord}=result
        await this.messageSender.sendMessageToBroker(message,this.agentContext)
        await this.cekService.updateState(this.agentContext,cekRecord,CekState.RequestSent)
        return cekRecord
    }



    private registerMessageHandlers(messageHandlerRegistry: MessageHandlerRegistry) {
        messageHandlerRegistry.registerMessageHandler(
          new CekResponseHandler(
            this.cekService
          )
        )
      }

}