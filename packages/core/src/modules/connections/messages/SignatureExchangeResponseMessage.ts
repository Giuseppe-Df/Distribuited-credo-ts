import { AgentMessage } from '../../../agent/AgentMessage'

import { IsString} from 'class-validator'
import { IsValidMessageType, parseMessageType } from '../../../utils/messageType'

export interface SignatureExchangeResponseMessageOptions {
  id?: string
  data: string
  dataId:string
}

/**
 * Message to communicate the DID document to the remote signer agent
 */
export class SignatureExchangeResponseMessage extends AgentMessage {
  /**
   * Create new DidExchangeRequestMessage instance.
   * @param options
   */
  public constructor(options: SignatureExchangeResponseMessageOptions) {
    super();

    if (options) {
      this.id = options.id || this.generateId();
      this.dataId = options.dataId;
      this.data = options.data;
    }
  }

  @IsValidMessageType(SignatureExchangeResponseMessage.type)
  public readonly type = SignatureExchangeResponseMessage.type.messageTypeUri;
  public static readonly type = parseMessageType('https://didcomm.org/signature_exchange/1.0/response');

  @IsString()
  public data!: string; 

  @IsString()
  public readonly dataId!: string;
}
