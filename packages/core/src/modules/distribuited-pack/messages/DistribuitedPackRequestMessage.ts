import { Expose, Type } from 'class-transformer'
import { IsOptional, IsString, ValidateNested } from 'class-validator'

import { AgentMessage } from '../../../agent/AgentMessage'
import { IsValidMessageType, parseMessageType } from '../../../utils/messageType'


export interface DistribuitedPackRequestMessageOptions {
  id?: string,
  cek:string,
  recipientKey: string,
  dataId:string
}

/**
 * Message to communicate the DID document to the other agent when creating a connection
 *
 * @see https://github.com/hyperledger/aries-rfcs/blob/main/features/0023-did-exchange/README.md#1-exchange-request
 */
export class DistribuitedPackRequestMessage extends AgentMessage {
  /**
   * Create new DidExchangeRequestMessage instance.
   * @param options
   */
  public constructor(options: DistribuitedPackRequestMessageOptions) {
    super();

    if (options) {
      this.id = options.id || this.generateId();
      this.cek = options.cek;
      this.recipientKey = options.recipientKey;
      this.dataId = options.dataId
    }
  }

  @IsValidMessageType(DistribuitedPackRequestMessage.type)
  public readonly type = DistribuitedPackRequestMessage.type.messageTypeUri;
  public static readonly type = parseMessageType('https://didcomm.org/distribuited_pack/1.0/request');

  @IsString()
  public readonly cek!: string;

  @IsString()
  public readonly recipientKey!: string;

  @IsString()
  public readonly dataId!: string;
}