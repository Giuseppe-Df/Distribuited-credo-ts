import { AgentContext } from '../../agent'
import { MessageSender } from '../../agent/MessageSender'
import { PubKeyRequestMessage } from './messages'
import { PubKeyService } from './services'
import { PubKeyRole,PubKeyState } from './models'
import { PubKeyResponseMessage } from './messages/PubKeyResponseMessage'

import { injectable } from '../../plugins'
import { PubKeyRecord } from './repository'
import { MessageHandlerRegistry } from '../../agent/MessageHandlerRegistry'
import { PubKeyResponseHandler } from './handlers'

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

    /* SCRIPT PER ELIMINARE I RECORD
    const records =await this.pubKeyService.getAll(this.agentContext)
        for (const record of records){
          this.pubKeyService.delete(this.agentContext,record)
        }
        const recordsnew=await this.pubKeyService.getAll(this.agentContext)
        this.agentContext.config.logger.debug("record attuali",recordsnew)
    */

    public async requestPubKey(){
        const result= await this.pubKeyService.createRequest(this.agentContext)
        const {message,keyRecord}=result
        await this.messageSender.sendMessageToBroker(message)
        await this.pubKeyService.updateState(this.agentContext,keyRecord,PubKeyState.RequestSent)
        return keyRecord
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