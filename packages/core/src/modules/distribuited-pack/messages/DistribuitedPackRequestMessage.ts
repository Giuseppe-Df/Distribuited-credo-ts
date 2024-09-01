import { AgentMessage } from '../../../agent/AgentMessage'

import {IsString} from 'class-validator'
import { IsValidMessageType, parseMessageType } from '../../../utils/messageType'

export interface DistribuitedPackRequestMessageOptions {
  id?: string,
  cek:string,
  recipientKey: string,
  dataId:string
}

export class DistribuitedPackRequestMessage extends AgentMessage {
  /**
   * Create new DistribuitedPackRequestMessage instance.
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