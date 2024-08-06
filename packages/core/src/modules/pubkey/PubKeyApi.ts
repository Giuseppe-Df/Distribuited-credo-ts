import { AgentContext } from '../../agent'
import { MessageSender } from '../../agent/MessageSender'
import { PubKeyRequestMessage } from './messages'
import { PubKeyService } from './services'
import { PubKeyRole,PubKeyState } from './models'
import { PubKeyResponseMessage } from './messages/PubKeyResponseMessage'
import { Key, KeyType } from '../../crypto'

import { injectable } from '../../plugins'
import { PubKeyRecord } from './repository'

@injectable()
export class PubKeyApi {
    private agentContext: AgentContext
    private messageSender: MessageSender
    private pubKeyService: PubKeyService

    public constructor(
        messageSender: MessageSender,
        agentContext: AgentContext,
        pubKeyService: PubKeyService
    ) {
        this.agentContext = agentContext
        this.messageSender = messageSender
        this.pubKeyService = pubKeyService
    }

    private hexStringToUint8Array(hexString: string): Uint8Array {
        if (hexString.length % 2 !== 0) {
          throw new Error('Invalid hex string');
        }
        const arrayBuffer = new Uint8Array(hexString.length / 2);
        for (let i = 0; i < hexString.length; i += 2) {
          arrayBuffer[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
        }
        return arrayBuffer;
    }

    public async requestPubKey(){
        const result= await this.pubKeyService.createRequest(this.agentContext)
        const {message,keyRecord}=result
        await this.messageSender.sendMessageToBroker(message,"pubkey")
        this.pubKeyService.updateState(this.agentContext,keyRecord,PubKeyState.RequestSent)
    }

    public async processResponse(message:PubKeyResponseMessage){
    
        const key= this.hexStringToUint8Array(message.publicKey)
        const keyObj=new Key(key,KeyType.Ed25519)
        const keyRecord = await this.pubKeyService.createRecord(this.agentContext, {
            key: keyObj,
            contextId: this.agentContext.contextCorrelationId,
            role:PubKeyRole.Requester,
            state:PubKeyState.ResponseReceived        
        })
    }

}