import type { TagsBase } from '../../../storage/BaseRecord'

import { Transform } from 'class-transformer'

import { CredoError } from '../../../error'
import { BaseRecord } from '../../../storage/BaseRecord'
import { uuid } from '../../../utils/uuid'

import { DidExchangeRequestMessage} from '../messages'
import { SignatureExchangeRole, SignatureExchangeState } from '../models'
import { DidDocument } from '../../dids'


export interface SignatureExchangeRecordProps {
    id?: string
    tags?: CustomSignatureExchangeTags
    createdAt?: Date
    message: DidExchangeRequestMessage
    connectionId: string
    state: SignatureExchangeState
    role: SignatureExchangeRole
    didDocument: DidDocument
    base64Payload: string
    base64UrlProtectedHeader: string
}

export type CustomSignatureExchangeTags = TagsBase
export type DefaultSignatureExchangeTags = {
    id: string
}

export class SignatureExchangeRecord extends BaseRecord<DefaultSignatureExchangeTags, CustomSignatureExchangeTags> {
    public state!: SignatureExchangeState
    public role!: SignatureExchangeRole
    public message!: DidExchangeRequestMessage
    public connectionId!: string
    public didDocument!: DidDocument
    public base64Payload!: string
    public base64UrlProtectedHeader!: string

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
          this.didDocument = props.didDocument
          this.base64Payload = props.base64Payload
          this.base64UrlProtectedHeader = props.base64UrlProtectedHeader
        }
    }

    public getTags(): DefaultSignatureExchangeTags & CustomSignatureExchangeTags {
        return {
          ...this._tags,
          id: this.id,
        }
    }

}