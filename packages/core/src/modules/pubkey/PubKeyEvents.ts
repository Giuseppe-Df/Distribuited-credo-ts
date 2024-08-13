import type { PubKeyState } from './models'
import type { PubKeyRecord } from './repository/PubKeyRecord'
import type { BaseEvent } from '../../agent/Events'

export enum PubKeyEventTypes {
  PubKeyStateChanged = 'ConnectionStateChanged'
}

export interface PubKeyStateChangedEvent extends BaseEvent {
  type: typeof PubKeyEventTypes.PubKeyStateChanged
  payload: {
    pubKeyRecord: PubKeyRecord
    previousState: PubKeyState | null
  }
}