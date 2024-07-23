import { Expose, Type } from 'class-transformer'
import { IsOptional, IsString, ValidateNested } from 'class-validator'

import { AgentMessage } from '../../../agent/AgentMessage'
import { IsValidMessageType, parseMessageType } from '../../../utils/messageType'

import { DidDocument } from '../../dids'

export interface SignatureExchangeExchangeRequestMessageOptions {
  id?: string
  contextId:string
}

/**
 * Message to communicate the DID document to the other agent when creating a connection
 *
 * @see https://github.com/hyperledger/aries-rfcs/blob/main/features/0023-did-exchange/README.md#1-exchange-request
 */
export class PubKeyRequestMessage extends AgentMessage {
  /**
   * Create new DidExchangeRequestMessage instance.
   * @param options
   */
  public constructor(options: SignatureExchangeExchangeRequestMessageOptions) {
    super();

    if (options) {
      this.id = options.id || this.generateId();
      this.contextId = options.contextId;
    }
  }

  @IsValidMessageType(PubKeyRequestMessage.type)
  public readonly type = PubKeyRequestMessage.type.messageTypeUri;
  public static readonly type = parseMessageType('https://didcomm.org/pubkey_exchange/1.0/request');

  @IsString()
  public readonly contextId?: string;
}