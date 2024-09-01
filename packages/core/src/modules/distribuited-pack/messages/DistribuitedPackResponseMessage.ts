import { IsString } from 'class-validator'

import { AgentMessage } from '../../../agent/AgentMessage'
import { IsValidMessageType, parseMessageType } from '../../../utils/messageType'


export interface DistribuitedPackResponseMessageOptions {
  id?: string,
  encryptedCek:string,
  nonce:string,
  dataId:string
}

export class DistribuitedPackResponseMessage extends AgentMessage {
  /**
   * Create new DistribuitedPackRequestMessage instance.
   * @param options
   */
  public constructor(options: DistribuitedPackResponseMessageOptions) {
    super();

    if (options) {
      this.id = options.id || this.generateId();
      this.encryptedCek = options.encryptedCek;
      this.nonce = options.nonce;
      this.dataId= options.dataId;
    }
  }

  @IsValidMessageType(DistribuitedPackResponseMessage.type)
  public readonly type = DistribuitedPackResponseMessage.type.messageTypeUri;
  public static readonly type = parseMessageType('https://didcomm.org/distribuited_pack/1.0/response');

  @IsString()
  public readonly encryptedCek!: string;

  @IsString()
  public readonly nonce!: string;

  @IsString()
  public readonly dataId!: string;

}