import type { TagsBase } from '../../../storage/BaseRecord'

import { Transform } from 'class-transformer'

import { CredoError } from '../../../error'
import { BaseRecord } from '../../../storage/BaseRecord'
import { uuid } from '../../../utils/uuid'

import { DidExchangeRequestMessage} from '../messages'
import { SignatureExchangeRole, SignatureExchangeState } from '../models'


export interface SignatureExchangeRecordProps {
    id?: string
    tags?: CustomSignatureExchangeTags
    createdAt?: Date
    message: DidExchangeRequestMessage
    connectionId: string
    contextId: string
    state: SignatureExchangeState
    role: SignatureExchangeRole
}

export type CustomSignatureExchangeTags = TagsBase
export type DefaultSignatureExchangeTags = {
    contextId: string
}

export class SignatureExchangeRecord extends BaseRecord<DefaultSignatureExchangeTags, CustomSignatureExchangeTags> {
    public state!: SignatureExchangeState
    public role!: SignatureExchangeRole
    public message!: DidExchangeRequestMessage
    public connectionId!: string
    public contextId!: string

    public static readonly type = 'SignatureExchange'
    public readonly type = SignatureExchangeRecord.type

    public constructor(props: SignatureExchangeRecordProps) {
        super()
    
        if (props) {
          this.id = props.id ?? uuid()
          this.createdAt = props.createdAt ?? new Date()
          this.state = props.state
          this.role = props.role
          this._tags = props.tags ?? {}
          this.message = props.message
          this.connectionId = props.connectionId
          this.contextId = props.contextId
        }
    }

    public getTags(): DefaultSignatureExchangeTags & CustomSignatureExchangeTags {
        return {
          ...this._tags,
          contextId: this.contextId,
        }
    }

}