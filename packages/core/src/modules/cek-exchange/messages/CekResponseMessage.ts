import { IsString } from 'class-validator'

import { AgentMessage } from '../../../agent/AgentMessage'
import { IsValidMessageType, parseMessageType } from '../../../utils/messageType'


export interface CekExchangeResponseMessageOptions {
  id?: string
  payloadKey:string
  dataId:string
  senderKey:string
}

/**
 * Message to communicate the DID document to the other agent when creating a connection
 *
 * @see https://github.com/hyperledger/aries-rfcs/blob/main/features/0023-did-exchange/README.md#1-exchange-request
 */
export class CekResponseMessage extends AgentMessage {
  /**
   * Create new DidExchangeRequestMessage instance.
   * @param options
   */
  public constructor(options: CekExchangeResponseMessageOptions) {
    super();

    if (options) {
      this.id = options.id || this.generateId();
      this.payloadKey = options.payloadKey;
      this.dataId= options.dataId
      this.senderKey = options.senderKey
    }
  }

  @IsValidMessageType(CekResponseMessage.type)
  public readonly type = CekResponseMessage.type.messageTypeUri;
  public static readonly type = parseMessageType('https://didcomm.org/cek_exchange/1.0/response');

  @IsString()
  public readonly payloadKey!: string;

  @IsString()
  public readonly dataId!: string;

  @IsString()
  public readonly senderKey!: string;

}