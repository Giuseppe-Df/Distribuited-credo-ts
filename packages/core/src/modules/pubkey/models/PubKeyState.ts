export enum PubKeyState {
    Start = 'start',
    RequestSent = 'request-sent',
    RequestReceived = 'request-received',
    ResponseSent = 'response-sent',
    ResponseReceived = 'response-received',
    Abandoned = 'abandoned',
    Completed = 'completed',
  }
  