import { AgentContext } from '../../agent'
import { MessageSender } from '../../agent/MessageSender'
import { PubKeyRequestMessage } from './messages'

import { injectable } from '../../plugins'

@injectable()
export class PubKeyApi {
    private agentContext: AgentContext
    private messageSender: MessageSender

    public constructor(
        messageSender: MessageSender,
        agentContext: AgentContext,
    ) {
        this.agentContext = agentContext
        this.messageSender = messageSender
    }

    public async requestPubKey(){
        const message = new PubKeyRequestMessage({contextId:this.agentContext.contextCorrelationId})
        await this.messageSender.sendMessageToBroker(message,"pubkey")
    }

}