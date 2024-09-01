import { AgentMessage } from '../../../agent/AgentMessage'
import { IsValidMessageType, parseMessageType } from '../../../utils/messageType'
import { IsString} from 'class-validator'


export interface DistribuitedUnpackRequestMessageOptions {
  id?: string
  senderKey: string
  encryptedKey:string
  dataId: string
  nonce: string
}


export class DistribuitedUnpackRequestMessage extends AgentMessage {
  /**
   * Create new DidExchangeRequestMessage instance.
   * @param options
   */
  public constructor(options: DistribuitedUnpackRequestMessageOptions) {
    super();

    if (options) {
      this.id = options.id || this.generateId();
      this.dataId = options.dataId;
      this.senderKey = options.senderKey;
      this.encryptedKey = options.encryptedKey;
      this.nonce = options.nonce;
    }
  }

  @IsValidMessageType(DistribuitedUnpackRequestMessage.type)
  public readonly type = DistribuitedUnpackRequestMessage.type.messageTypeUri;
  public static readonly type = parseMessageType('https://didcomm.org/distribuited_unpack/1.0/request');

  @IsString()
  public readonly encryptedKey!: string;

  @IsString()
  public readonly dataId!: string;

  @IsString()
  public readonly nonce!: string;

  @IsString()
  public readonly senderKey!: string;
}