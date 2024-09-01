import { AgentContext } from '../../agent'
import { MessageSender } from '../../agent/MessageSender'
import { MessageHandlerRegistry } from '../../agent/MessageHandlerRegistry'

import { PubKeyService } from './services'
import { PubKeyState } from './models'
import { PubKeyResponseHandler } from './handlers'

import { injectable } from '../../plugins'

@injectable()
export class PubKeyApi {
    private agentContext: AgentContext
    private messageSender: MessageSender
    private pubKeyService: PubKeyService

    public constructor(
        messageHandlerRegistry: MessageHandlerRegistry,
        messageSender: MessageSender,
        agentContext: AgentContext,
        pubKeyService: PubKeyService
    ) {
        this.agentContext = agentContext
        this.messageSender = messageSender
        this.pubKeyService = pubKeyService

        this.registerMessageHandlers(messageHandlerRegistry)
    }

    public async requestPubKey(){  
      const result= await this.pubKeyService.createRequest(this.agentContext)
        const {message,keyRecord}=result
        await this.messageSender.sendMessageToBroker(message,this.agentContext)
        await this.pubKeyService.updateState(this.agentContext,keyRecord,PubKeyState.RequestSent)
        return keyRecord
    }

    public async getPublicKey(){
      return await this.pubKeyService.getPublicKey(this.agentContext)
    }


    public async returnWhenIsObtained(pubKeyId: string, options?: { timeoutMs: number }){
      return this.pubKeyService.returnWhenIsObtained(this.agentContext, pubKeyId, options?.timeoutMs)
    }

    private registerMessageHandlers(messageHandlerRegistry: MessageHandlerRegistry) {
        messageHandlerRegistry.registerMessageHandler(
          new PubKeyResponseHandler(
            this.pubKeyService
          )
        )
      }

}