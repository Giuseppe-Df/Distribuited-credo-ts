import { Expose, Type } from 'class-transformer'
import { IsOptional, IsString, ValidateNested } from 'class-validator'

import { AgentMessage } from '../../../agent/AgentMessage'
import { IsValidMessageType, parseMessageType } from '../../../utils/messageType'


export interface CekExchangeRequestMessageOptions {
  id?: string
  senderKey: string
  encryptedKey:string
  dataId: string
  nonce: string
}

/**
 * Message to communicate the DID document to the other agent when creating a connection
 *
 * @see https://github.com/hyperledger/aries-rfcs/blob/main/features/0023-did-exchange/README.md#1-exchange-request
 */
export class CekRequestMessage extends AgentMessage {
  /**
   * Create new DidExchangeRequestMessage instance.
   * @param options
   */
  public constructor(options: CekExchangeRequestMessageOptions) {
    super();

    if (options) {
      this.id = options.id || this.generateId();
      this.dataId = options.dataId;
      this.senderKey = options.senderKey;
      this.encryptedKey = options.encryptedKey;
      this.nonce = options.nonce;
    }
  }

  @IsValidMessageType(CekRequestMessage.type)
  public readonly type = CekRequestMessage.type.messageTypeUri;
  public static readonly type = parseMessageType('https://didcomm.org/cek_exchange/1.0/request');

  @IsString()
  public readonly encryptedKey!: string;

  @IsString()
  public readonly dataId!: string;

  @IsString()
  public readonly nonce!: string;

  @IsString()
  public readonly senderKey!: string;
}