import type { TagsBase } from '../../../storage/BaseRecord'
import { CredoError } from '../../../error'
import { uuid } from '../../../utils/uuid'

import { BaseRecord } from '../../../storage/BaseRecord'
import { DidDocument } from '../../dids'
import { PlaintextMessage } from 'packages/core/src/types'

import { SignatureExchangeRole, SignatureExchangeState } from '../models'


export interface SignatureExchangeRecordProps {
    id?: string
    tags?: CustomSignatureExchangeTags
    createdAt?: Date
    message: PlaintextMessage
    connectionId: string
    state: SignatureExchangeState
    role: SignatureExchangeRole
    didDocument: DidDocument
    base64Payload: string
    base64UrlProtectedHeader: string
    parentId:string
}

export type CustomSignatureExchangeTags = TagsBase
export type DefaultSignatureExchangeTags = {
    id: string
}

export class SignatureExchangeRecord extends BaseRecord<DefaultSignatureExchangeTags, CustomSignatureExchangeTags> {
    public state!: SignatureExchangeState
    public role!: SignatureExchangeRole
    public message!: PlaintextMessage
    public connectionId!: string
    public didDocument!: DidDocument
    public base64Payload!: string
    public base64UrlProtectedHeader!: string
    public parentId!:string

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
          this.parentId = props.parentId
        }
    }

    public getTags(): DefaultSignatureExchangeTags & CustomSignatureExchangeTags {
        return {
          ...this._tags,
          id: this.id,
        }
    }

    public assertState(expectedStates: SignatureExchangeState | SignatureExchangeState[]) {
        if (!Array.isArray(expectedStates)) {
          expectedStates = [expectedStates]
        }
    
        if (!expectedStates.includes(this.state)) {
          throw new CredoError(
            `Signature record is in invalid state ${this.state}. Valid states are: ${expectedStates.join(', ')}.`
          )
        }
      }
    
      public assertRole(expectedRole: SignatureExchangeRole) {
        if (this.role !== expectedRole) {
          throw new CredoError(`Signature record has invalid role ${this.role}. Expected role ${expectedRole}.`)
        }
      }
    
      public get isRequester() {
        return this.role === SignatureExchangeRole.Requester
      }

}