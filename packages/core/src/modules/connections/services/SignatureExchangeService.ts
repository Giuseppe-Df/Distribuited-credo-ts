import type { AgentContext } from '../../../agent'
import { EventEmitter } from '../../../agent/EventEmitter'
import { PubKeyApi } from '../../pubkey'
import { DidExchangeRequestMessage } from '../messages'
import { DidDocument, DidKey } from '../../dids'
import type { AgentMessage } from '../../../agent/AgentMessage'
import { PlaintextMessage } from 'packages/core/src/types'

import { SignatureExchangeRepository } from '../repository/SignatureExchangeRepository'
import type { SignatureExchangeRecordProps } from '../repository/SignatureExchangeRecord'
import { SignatureExchangeRecord } from '../repository/SignatureExchangeRecord'
import { SignatureExchangeRequestMessage} from '../messages/SignatureExchangeRequestMessage'
import { SignatureExchangeResponseMessage } from '../messages/SignatureExchangeResponseMessage'
import { SignatureExchangeRole, SignatureExchangeState } from '../models'

import { Logger } from '../../../logger'
import { inject, injectable } from '../../../plugins'
import { InjectionSymbols } from '../../../constants'
import { Attachment, AttachmentData } from '../../../decorators/attachment/Attachment'
import { TypedArrayEncoder} from '../../../utils'
import { JsonEncoder } from '../../../utils/JsonEncoder'
import { JwaSignatureAlgorithm } from '../../../crypto/jose/jwa'
import { getJwkFromKey } from '../../../crypto/jose/jwk'
import { CredoError } from '../../../error'
import {JwsProtectedHeaderOptions} from '../../../crypto/JwsTypes'

@injectable()
export class SignatureExchangeService {
  private signatureExchangeRepository: SignatureExchangeRepository
  private pubKeyApi: PubKeyApi
  private logger: Logger

  public constructor(
    @inject(InjectionSymbols.Logger) logger: Logger,
    signatureExchangeRepository:SignatureExchangeRepository,
    pubKeyApi: PubKeyApi
  ) {
    this.signatureExchangeRepository = signatureExchangeRepository
    this.pubKeyApi = pubKeyApi
    this.logger = logger
  }

  public async createRecord(agentContext: AgentContext, options: SignatureExchangeRecordProps): Promise<SignatureExchangeRecord> {
    const signatureExchangeRecord = new SignatureExchangeRecord(options)
    await this.signatureExchangeRepository.save(agentContext, signatureExchangeRecord)
    return signatureExchangeRecord
  }

  public async createRequest(agentContext: AgentContext, options: CreateSignatureRequestOptions ): Promise<SignatureExchangeProtocolMsgReturnType<SignatureExchangeRequestMessage>> {

    this.logger.debug("Creating signature exchange request")
    const key = await this.pubKeyApi.getPublicKey()

    const data = options.didDocument.toJSON()
    const payload = JsonEncoder.toBuffer(data)
    const base64Payload = TypedArrayEncoder.toBase64URL(payload)
    const base64UrlProtectedHeader = JsonEncoder.toBase64URL(this.buildProtected({
      alg: JwaSignatureAlgorithm.EdDSA,
      jwk: getJwkFromKey(key),
    }))

    const signatureRecord = await this.createRecord(agentContext,{
      message: options.message,
      connectionId: options.connectionId,
      state: SignatureExchangeState.Start,
      role: SignatureExchangeRole.Requester,
      didDocument: options.didDocument,
      base64Payload,
      base64UrlProtectedHeader,
      parentId:options.parentid
    })

    const dataToSign = `${base64UrlProtectedHeader}.${base64Payload}`

    const label = agentContext.config.label
    const message= new SignatureExchangeRequestMessage({label,data:dataToSign,dataId:signatureRecord.id})

    return {message,signatureRecord}

  }

  public async processResponse(message:SignatureExchangeResponseMessage, agentContext:AgentContext):Promise<{returnMessage: DidExchangeRequestMessage,connectionId: string}>{
    
    this.logger.debug("Start processing signature exchange response ")

    const key = await this.pubKeyApi.getPublicKey()
    const signatureRecord = await this.getById(agentContext,message.dataId)
    signatureRecord.assertRole(SignatureExchangeRole.Requester)
    signatureRecord.assertState(SignatureExchangeState.RequestSent)
    
    if (!message.data || !message.dataId){
      throw new CredoError("Signature response message is invalid")
    }

    const data = signatureRecord.didDocument
    const signedAttach = new Attachment({
      mimeType: 'application/json',
      data: new AttachmentData({
        base64:
          JsonEncoder.toBase64(data),
      }),
    })

    //Creazione della struttura dati rappresentate il jws di tipo JwsGeneralFormat
    const kid = new DidKey(key).did
    const signature = TypedArrayEncoder.toBase64URL(TypedArrayEncoder.fromHex(message.data))
    const jws = {
      protected: signatureRecord.base64UrlProtectedHeader,
      signature,
      header: {kid,},
      payload: signatureRecord.base64Payload,
    }
    signedAttach.addJws(jws)
    
    signatureRecord.message.didDoc=signedAttach
    signatureRecord.state=SignatureExchangeState.Completed
    this.update(agentContext,signatureRecord)

    const returnMessage = new DidExchangeRequestMessage({id: <string>signatureRecord.message['@id'],parentThreadId:signatureRecord.parentId ,label:signatureRecord.message.label as string, did: <string>signatureRecord.message.did})
    returnMessage.didDoc= signedAttach
    
    return  {
      returnMessage,
      connectionId: signatureRecord.connectionId,
    }

  }

  private buildProtected(options: JwsProtectedHeaderOptions) {
    if (!options.jwk && !options.kid) {
      throw new CredoError('Both JWK and kid are undefined. Please provide one or the other.')
    }
    if (options.jwk && options.kid) {
      throw new CredoError('Both JWK and kid are provided. Please only provide one of the two.')
    }

    return {
      ...options,
      alg: options.alg,
      jwk: options.jwk?.toJson(),
      kid: options.kid,
    }
  }

  public async updateState(agentContext: AgentContext, signatureRecord: SignatureExchangeRecord, newState: SignatureExchangeState) {
    const previousState = signatureRecord.state
    signatureRecord.state = newState
    await this.signatureExchangeRepository.update(agentContext, signatureRecord)
  }

  public update(agentContext: AgentContext, signatureRecord: SignatureExchangeRecord) {
    return this.signatureExchangeRepository.update(agentContext, signatureRecord)
  }

  /**
   * Retrieve a signature record by id
   *
   * @param recordId The connection record id
   * @throws {RecordNotFoundError} If no record is found
   * @return The pubkey record
   *
   */
  public getById(agentContext: AgentContext, recordId: string): Promise<SignatureExchangeRecord> {
    return this.signatureExchangeRepository.getById(agentContext, recordId)
  }

}

export interface CreateSignatureRequestOptions {
  message: PlaintextMessage
  connectionId: string,
  didDocument: DidDocument
  parentid:string
}

export interface SignatureExchangeProtocolMsgReturnType<MessageType extends AgentMessage> {
  message: MessageType
  signatureRecord: SignatureExchangeRecord
}