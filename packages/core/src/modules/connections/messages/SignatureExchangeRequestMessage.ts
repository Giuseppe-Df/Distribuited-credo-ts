import { AgentMessage } from '../../../agent/AgentMessage'

import { IsString} from 'class-validator'
import { IsValidMessageType, parseMessageType } from '../../../utils/messageType'

export interface SignatureExchangeRequestMessageOptions {
  id?: string
  label: string
  data: string
  dataId:string
}

/**
 * Message to communicate the DID document to the remote signer agent
 */
export class SignatureExchangeRequestMessage extends AgentMessage {
  /**
   * Create new DidExchangeRequestMessage instance.
   * @param options
   */
  public constructor(options: SignatureExchangeRequestMessageOptions) {
    super();

    if (options) {
      this.id = options.id || this.generateId();
      this.label = options.label;
      this.dataId = options.dataId;
      this.data = options.data;
    }
  }

  @IsValidMessageType(SignatureExchangeRequestMessage.type)
  public readonly type = SignatureExchangeRequestMessage.type.messageTypeUri;
  public static readonly type = parseMessageType('https://didcomm.org/signature_exchange/1.0/request');

  @IsString()
  public readonly label?: string;

  @IsString()
  public data?: string; 

  @IsString()
  public readonly dataId?: string;
}
