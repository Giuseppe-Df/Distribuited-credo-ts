import { AgentContext } from '../../agent'
import { MessageSender } from '../../agent/MessageSender'
import { EncryptedMessage } from '../../types'


import { DistribuitedUnpackService } from './services'
import { DistribuitedUnpackState } from './models'
import { DistribuitedUnpackResponseHandler } from './handlers'

import { injectable } from '../../plugins'
import { MessageHandlerRegistry } from '../../agent/MessageHandlerRegistry'

@injectable()
export class DistribuitedUnpackApi {
    private agentContext: AgentContext
    private messageSender: MessageSender
    private distribuitedUnpackService: DistribuitedUnpackService

    public constructor(
        messageHandlerRegistry: MessageHandlerRegistry,
        messageSender: MessageSender,
        agentContext: AgentContext,
        distribuitedUnpackService: DistribuitedUnpackService
    ) {
        this.agentContext = agentContext
        this.messageSender = messageSender
        this.distribuitedUnpackService = distribuitedUnpackService

        this.registerMessageHandlers(messageHandlerRegistry)
    }


    public async distribuitedUnpack(encryptedMessage: EncryptedMessage){
        const result= await this.distribuitedUnpackService.createRequest(this.agentContext,encryptedMessage)
        const {message,distribuitedUnpackRecord}=result

        await this.messageSender.sendMessageToBroker(message,this.agentContext)
        await this.distribuitedUnpackService.updateState(this.agentContext,distribuitedUnpackRecord,DistribuitedUnpackState.RequestSent)
        return distribuitedUnpackRecord
    }



    private registerMessageHandlers(messageHandlerRegistry: MessageHandlerRegistry) {
        messageHandlerRegistry.registerMessageHandler(
          new DistribuitedUnpackResponseHandler(
            this.distribuitedUnpackService
          )
        )
      }

}