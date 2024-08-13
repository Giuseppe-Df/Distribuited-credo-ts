import type { TagsBase } from '../../../storage/BaseRecord'

import { CredoError } from '../../../error'
import { BaseRecord } from '../../../storage/BaseRecord'
import { uuid } from '../../../utils/uuid'
import { PubKeyRole, PubKeyState } from '../models'


export interface PubKeyRecordProps {
  id?: string
  key?: String
  contextId: string
  role: PubKeyRole
  state: PubKeyState
}

export type CustomPubKeyTags = TagsBase
export type DefaultPubKeyTags = {
  contextId: string,
  id: string
}

export class PubKeyRecord extends BaseRecord<DefaultPubKeyTags, CustomPubKeyTags> {
  public state!: PubKeyState
  public role!: PubKeyRole

  public key?: String
  public contextId!: string

  public static readonly type = 'PubKeyRecord'
  public readonly type = PubKeyRecord.type

  public constructor(props: PubKeyRecordProps) {
    super()

    if (props) {
      this.id = props.id ?? uuid()
      this.key = props.key
      this.contextId = props.contextId
      this.state = props.state
      this.role = props.role
    }
  }

  public getTags(): DefaultPubKeyTags & CustomPubKeyTags {
    return {
      ...this._tags,
      contextId: this.contextId,
      id:this.id,
    }
  }

  public assertState(expectedStates: PubKeyState | PubKeyState[]) {
    if (!Array.isArray(expectedStates)) {
      expectedStates = [expectedStates]
    }

    if (!expectedStates.includes(this.state)) {
      throw new CredoError(
        `Connection record is in invalid state ${this.state}. Valid states are: ${expectedStates.join(', ')}.`
      )
    }
  }

  public assertRole(expectedRole: PubKeyRole) {
    if (this.role !== expectedRole) {
      throw new CredoError(`Connection record has invalid role ${this.role}. Expected role ${expectedRole}.`)
    }
  }

  public get isRequester() {
    return this.role === PubKeyRole.Requester
  }

}
