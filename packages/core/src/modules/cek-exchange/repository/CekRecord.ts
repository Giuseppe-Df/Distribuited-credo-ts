import type { TagsBase } from '../../../storage/BaseRecord'

import { CredoError } from '../../../error'
import { BaseRecord } from '../../../storage/BaseRecord'
import { uuid } from '../../../utils/uuid'
import { CekRole, CekState } from '../models'
import { EncryptedMessage } from '../../../types'


export interface CekRecordProps {
  id?: string
  encryptedMessage: EncryptedMessage
  role: CekRole
  state: CekState
}

export type CustomCekTags = TagsBase
export type DefaultCekTags = {
  id: string
}

export class CekRecord extends BaseRecord<DefaultCekTags, CustomCekTags> {
  public state!: CekState
  public role!: CekRole

  public encryptedMessage!: EncryptedMessage
  

  public static readonly type = 'CekRecord'
  public readonly type = CekRecord.type

  public constructor(props: CekRecordProps) {
    super()

    if (props) {
      this.id = props.id ?? uuid()
      this.encryptedMessage=props.encryptedMessage
      this.state = props.state
      this.role = props.role
    }
  }

  public getTags(): DefaultCekTags & CustomCekTags {
    return {
      ...this._tags,
      id:this.id,
    }
  }

  public assertState(expectedStates: CekState | CekState[]) {
    if (!Array.isArray(expectedStates)) {
      expectedStates = [expectedStates]
    }

    if (!expectedStates.includes(this.state)) {
      throw new CredoError(
        `Connection record is in invalid state ${this.state}. Valid states are: ${expectedStates.join(', ')}.`
      )
    }
  }

  public assertRole(expectedRole: CekRole) {
    if (this.role !== expectedRole) {
      throw new CredoError(`Connection record has invalid role ${this.role}. Expected role ${expectedRole}.`)
    }
  }

  public get isRequester() {
    return this.role === CekRole.Requester
  }

}
