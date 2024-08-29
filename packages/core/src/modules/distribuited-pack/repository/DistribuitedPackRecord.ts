import type { TagsBase } from '../../../storage/BaseRecord'

import { CredoError } from '../../../error'
import { BaseRecord } from '../../../storage/BaseRecord'
import { uuid } from '../../../utils/uuid'
import { DistribuitedPackRole, DistribuitedPackState } from '../models'
import { EncryptedMessage, PlaintextMessage } from '../../../types'
import { AgentMessage } from 'packages/core/src/agent/AgentMessage'
import { EnvelopeKeys } from 'packages/core/src/agent/EnvelopeService'
import { ResolvedDidCommService } from '../../didcomm/types'


export interface DistribuitedPackRecordProps {
  id?: string,
  payload: PlaintextMessage,
  recipientKeyBase58: string,
  senderKeyBase58: string,
  endpoint: string,
  serviceId: string,
  connectionId?:string
  state: DistribuitedPackState,
  role: DistribuitedPackRole
  
}

export type CustomDistribuitedPackTags = TagsBase
export type DefaultDistribuitedPackTags = {
  id: string
}

export class DistribuitedPackRecord extends BaseRecord<DefaultDistribuitedPackTags, CustomDistribuitedPackTags> {
  public state!: DistribuitedPackState
  public role!: DistribuitedPackRole

  public payload!: PlaintextMessage
  public recipientKeyBase58!: string
  public senderKeyBase58!: string
  public endpoint!: string
  public serviceId!: string
  public connectionId?:string
  

  public static readonly type = 'DistribuitedPackRecord'
  public readonly type = DistribuitedPackRecord.type

  public constructor(props: DistribuitedPackRecordProps) {
    super()

    if (props) {
      this.id = props.id ?? uuid()
      this.payload=props.payload
      this.recipientKeyBase58 = props.recipientKeyBase58
      this.senderKeyBase58 = props.senderKeyBase58
      this.endpoint = props.endpoint
      this.state = props.state
      this.role = props.role
      this.serviceId = props.serviceId
      this.connectionId = props.connectionId
    }
  }

  public getTags(): DefaultDistribuitedPackTags & CustomDistribuitedPackTags {
    return {
      ...this._tags,
      id:this.id,
    }
  }

  public assertState(expectedStates: DistribuitedPackState | DistribuitedPackState[]) {
    if (!Array.isArray(expectedStates)) {
      expectedStates = [expectedStates]
    }

    if (!expectedStates.includes(this.state)) {
      throw new CredoError(
        `Connection record is in invalid state ${this.state}. Valid states are: ${expectedStates.join(', ')}.`
      )
    }
  }

  public assertRole(expectedRole: DistribuitedPackRole) {
    if (this.role !== expectedRole) {
      throw new CredoError(`Connection record has invalid role ${this.role}. Expected role ${expectedRole}.`)
    }
  }

  public get isRequester() {
    return this.role === DistribuitedPackRole.Requester
  }

}
