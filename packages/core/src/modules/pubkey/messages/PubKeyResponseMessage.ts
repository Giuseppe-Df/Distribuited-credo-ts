import { IsString } from 'class-validator'

import { AgentMessage } from '../../../agent/AgentMessage'
import { IsValidMessageType, parseMessageType } from '../../../utils/messageType'


export interface SignatureExchangeExchangeResponseMessageOptions {
  id?: string
  contextId:string
  publicKey:string
}

/**
 * Message to communicate the DID document to the other agent when creating a connection
 *
 * @see https://github.com/hyperledger/aries-rfcs/blob/main/features/0023-did-exchange/README.md#1-exchange-request
 */
export class PubKeyResponseMessage extends AgentMessage {
  /**
   * Create new DidExchangeRequestMessage instance.
   * @param options
   */
  public constructor(options: SignatureExchangeExchangeResponseMessageOptions) {
    super();

    if (options) {
      this.id = options.id || this.generateId();
      this.contextId = options.contextId;
    }
  }

  @IsValidMessageType(PubKeyResponseMessage.type)
  public readonly type = PubKeyResponseMessage.type.messageTypeUri;
  public static readonly type = parseMessageType('https://didcomm.org/pubkey_exchange/1.0/response');

  @IsString()
  public readonly contextId?: string;

  @IsString()
  public readonly publicKey!: string;
}