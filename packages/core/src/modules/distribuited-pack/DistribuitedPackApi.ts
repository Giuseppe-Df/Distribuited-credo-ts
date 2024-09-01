import { AgentContext } from '../../agent'
import { MessageSender } from '../../agent/MessageSender'
import { MessageHandlerRegistry } from '../../agent/MessageHandlerRegistry'
import { EnvelopeKeys } from '../../agent/EnvelopeService'
import { AgentMessage } from '../../agent/AgentMessage'

import { DistribuitedPackResponseHandler } from './handlers'
import { DistribuitedPackService } from './services'
import { DistribuitedPackState } from './models'

import { injectable } from '../../plugins'
import { ResolvedDidCommService } from '../didcomm/types'

@injectable()
export class DistribuitedPackApi {
    private agentContext: AgentContext
    private messageSender: MessageSender
    private distribuitedPackService: DistribuitedPackService

    public constructor(
        messageHandlerRegistry: MessageHandlerRegistry,
        messageSender: MessageSender,
        agentContext: AgentContext,
        distribuitedPackService: DistribuitedPackService
    ) {
        this.agentContext = agentContext
        this.messageSender = messageSender
        this.distribuitedPackService = distribuitedPackService

        this.registerMessageHandlers(messageHandlerRegistry)
    }


    public async distribuitedPack(keys: EnvelopeKeys, message: AgentMessage, endpoint: string, service:ResolvedDidCommService, connectionId?:string){
        const result= await this.distribuitedPackService.createRequest(this.agentContext,{keys,payload:message,endpoint,service, connectionId})
        const {messageToSend,record}=result
        
        await this.messageSender.sendMessageToBroker(messageToSend,this.agentContext)
        await this.distribuitedPackService.updateState(this.agentContext,record,DistribuitedPackState.RequestSent)
        return record
    }



    private registerMessageHandlers(messageHandlerRegistry: MessageHandlerRegistry) {
        messageHandlerRegistry.registerMessageHandler(
          new DistribuitedPackResponseHandler(
            this.distribuitedPackService
          )
        )
      }

}