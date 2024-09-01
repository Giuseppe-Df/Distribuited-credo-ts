import { IsString } from 'class-validator'
import { AgentMessage } from '../../../agent/AgentMessage'
import { IsValidMessageType, parseMessageType } from '../../../utils/messageType'


export interface DistribuitedUnpackResponseMessageOptions {
  id?: string
  payloadKey:string
  dataId:string
  senderKey:string
}

export class DistribuitedUnpackResponseMessage extends AgentMessage {
  /**
   * Create new DistribuitedUnpackResponseMessage instance.
   * @param options
   */
  public constructor(options: DistribuitedUnpackResponseMessageOptions) {
    super();

    if (options) {
      this.id = options.id || this.generateId();
      this.payloadKey = options.payloadKey;
      this.dataId= options.dataId
      this.senderKey = options.senderKey
    }
  }

  @IsValidMessageType(DistribuitedUnpackResponseMessage.type)
  public readonly type = DistribuitedUnpackResponseMessage.type.messageTypeUri;
  public static readonly type = parseMessageType('https://didcomm.org/distribuited_unpack/1.0/response');

  @IsString()
  public readonly payloadKey!: string;

  @IsString()
  public readonly dataId!: string;

  @IsString()
  public readonly senderKey!: string;

}