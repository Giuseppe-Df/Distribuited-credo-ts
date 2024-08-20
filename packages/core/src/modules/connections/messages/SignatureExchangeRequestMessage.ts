import { Expose, Type } from 'class-transformer'
import { IsOptional, IsString, ValidateNested } from 'class-validator'

import { AgentMessage } from '../../../agent/AgentMessage'
import { Attachment } from '../../../decorators/attachment/Attachment'
import { IsValidMessageType, parseMessageType } from '../../../utils/messageType'

import { DidDocument } from '../../dids'

export interface SignatureExchangeExchangeRequestMessageOptions {
  id?: string
  label: string
  data: string
  dataId:string
}

/**
 * Message to communicate the DID document to the other agent when creating a connection
 *
 * @see https://github.com/hyperledger/aries-rfcs/blob/main/features/0023-did-exchange/README.md#1-exchange-request
 */
export class SignatureExchangeRequestMessage extends AgentMessage {
  /**
   * Create new DidExchangeRequestMessage instance.
   * @param options
   */
  public constructor(options: SignatureExchangeExchangeRequestMessageOptions) {
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
