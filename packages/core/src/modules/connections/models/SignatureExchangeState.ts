/**
 * Connection states as defined in RFC 0023.
 *
 * @see https://github.com/hyperledger/aries-rfcs/blob/main/features/0023-did-exchange/README.md#state-machine-tables
 */
export enum SignatureExchangeState {
    Start = 'start',
    RequestSent = 'request-sent',
    RequestReceived = 'request-received',
    ResponseSent = 'response-sent',
    ResponseReceived = 'response-received',
    Abandoned = 'abandoned',
    Completed = 'completed',
  }
  