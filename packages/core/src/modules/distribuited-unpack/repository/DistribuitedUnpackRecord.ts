import type { TagsBase } from '../../../storage/BaseRecord'
import { CredoError } from '../../../error'
import { BaseRecord } from '../../../storage/BaseRecord'
import { uuid } from '../../../utils/uuid'
import { DistribuitedUnpackRole, DistribuitedUnpackState } from '../models'
import { EncryptedMessage } from '../../../types'


export interface DistribuitedUnpackRecordProps {
  id?: string
  encryptedMessage: EncryptedMessage
  role: DistribuitedUnpackRole
  state: DistribuitedUnpackState
}

export type CustomDistribuitedUnpackTags = TagsBase
export type DefaultDistribuitedUnpackTags = {
  id: string
}

export class DistribuitedUnpackRecord extends BaseRecord<DefaultDistribuitedUnpackTags, CustomDistribuitedUnpackTags> {
  public state!: DistribuitedUnpackState
  public role!: DistribuitedUnpackRole

  public encryptedMessage!: EncryptedMessage
  

  public static readonly type = 'DistribuitedUnpackRecord'
  public readonly type = DistribuitedUnpackRecord.type

  public constructor(props: DistribuitedUnpackRecordProps) {
    super()

    if (props) {
      this.id = props.id ?? uuid()
      this.encryptedMessage=props.encryptedMessage
      this.state = props.state
      this.role = props.role
    }
  }

  public getTags(): DefaultDistribuitedUnpackTags & CustomDistribuitedUnpackTags {
    return {
      ...this._tags,
      id:this.id,
    }
  }

  public assertState(expectedStates: DistribuitedUnpackState | DistribuitedUnpackState[]) {
    if (!Array.isArray(expectedStates)) {
      expectedStates = [expectedStates]
    }

    if (!expectedStates.includes(this.state)) {
      throw new CredoError(
        `Distribuited Unpack record is in invalid state ${this.state}. Valid states are: ${expectedStates.join(', ')}.`
      )
    }
  }

  public assertRole(expectedRole: DistribuitedUnpackRole) {
    if (this.role !== expectedRole) {
      throw new CredoError(`Distribuited Unpack record has invalid role ${this.role}. Expected role ${expectedRole}.`)
    }
  }

  public get isRequester() {
    return this.role === DistribuitedUnpackRole.Requester
  }

}
