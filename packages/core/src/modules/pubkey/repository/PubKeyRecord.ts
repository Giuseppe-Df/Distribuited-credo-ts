import type { TagsBase } from '../../../storage/BaseRecord'

import { Transform } from 'class-transformer'

import { CredoError } from '../../../error'
import { BaseRecord } from '../../../storage/BaseRecord'
import { uuid } from '../../../utils/uuid'
import { Key } from 'packages/core/src/crypto'
import { PubKeyRole, PubKeyState } from '../models'


export interface PubKeyRecordProps {
  id?: string
  key?: Key
  contextId: string
  role: PubKeyRole
  state: PubKeyState
}

export type CustomPubKeyTags = TagsBase
export type DefaultPubKeyTags = {
  contextId: string
}

export class PubKeyRecord extends BaseRecord<DefaultPubKeyTags, CustomPubKeyTags> {
  public state!: PubKeyState
  public role!: PubKeyRole

  public key?: Key
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
    }
  }

  public get isRequester() {
    return this.role === PubKeyRole.Requester
  }

}
