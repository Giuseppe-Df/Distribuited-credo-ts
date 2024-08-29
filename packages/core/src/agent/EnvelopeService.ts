import { AgentMessage } from './AgentMessage'
import { AgentContext } from './context'
import type { EncryptedMessage, PlaintextMessage } from '../types'

import { InjectionSymbols } from '../constants'
import { Key, KeyType } from '../crypto'
import { Logger } from '../logger'
import { ForwardMessage } from '../modules/routing/messages'
import { inject, injectable } from '../plugins'
import { CredoError } from '../error'

export interface EnvelopeKeys {
  recipientKeys: Key[]
  routingKeys: Key[]
  senderKey: Key | null
}

@injectable()
export class EnvelopeService {
  private logger: Logger

  public constructor(@inject(InjectionSymbols.Logger) logger: Logger) {
    this.logger = logger
  }

  public async packMessage(
    agentContext: AgentContext,
    payload: AgentMessage,
    keys: EnvelopeKeys
  ): Promise<EncryptedMessage> {
    const { recipientKeys, routingKeys, senderKey } = keys
    let recipientKeysBase58 = recipientKeys.map((key) => key.publicKeyBase58)
    const routingKeysBase58 = routingKeys.map((key) => key.publicKeyBase58)
    const senderKeyBase58 = senderKey && senderKey.publicKeyBase58
    // pass whether we want to use legacy did sov prefix
    const message = payload.toJSON({ useDidSovPrefixWhereAllowed: agentContext.config.useDidSovPrefixWhereAllowed })

    this.logger.debug(`Pack outbound message ${message['@type']}`)

    let encryptedMessage = await agentContext.wallet.pack(message, recipientKeysBase58, senderKeyBase58 ?? undefined)
    //let encryptedMessage = await agentContext.wallet.pack(message, recipientKeysBase58)
    // If the message has routing keys (mediator) pack for each mediator
    for (const routingKeyBase58 of routingKeysBase58) {
      const forwardMessage = new ForwardMessage({
        // Forward to first recipient key
        to: recipientKeysBase58[0],
        message: encryptedMessage,
      })
      recipientKeysBase58 = [routingKeyBase58]
      this.logger.debug('Forward message created', forwardMessage)

      const forwardJson = forwardMessage.toJSON({
        useDidSovPrefixWhereAllowed: agentContext.config.useDidSovPrefixWhereAllowed,
      })

      // Forward messages are anon packed
      encryptedMessage = await agentContext.wallet.pack(forwardJson, [routingKeyBase58], undefined)
    }

    return encryptedMessage
  }

  public async distribuitedPackMessage(
    agentContext: AgentContext,
    payload: AgentMessage,
    keys: EnvelopeKeys,
    keyId: string,
    cekNonceHex: string,
    encryptedCekHex: string
  ): Promise<EncryptedMessage> {
    const { recipientKeys, routingKeys, senderKey } = keys
    let recipientKeysBase58 = recipientKeys.map((key) => key.publicKeyBase58)
    const routingKeysBase58 = routingKeys.map((key) => key.publicKeyBase58)
    const senderKeyBase58 = senderKey && senderKey.publicKeyBase58

    if (!senderKeyBase58){
      throw new CredoError("Unable to process distribuited pack without sender key")
    }
    // pass whether we want to use legacy did sov prefix
    const message = payload.toJSON({ useDidSovPrefixWhereAllowed: agentContext.config.useDidSovPrefixWhereAllowed })

    this.logger.debug(`Distribuited pack outbound message ${message['@type']}`)

    let encryptedMessage = await agentContext.wallet.distribuitedPack(message, recipientKeysBase58[0],keyId, senderKeyBase58, cekNonceHex, encryptedCekHex)


    return encryptedMessage
  }

  public async unpackMessage(
    agentContext: AgentContext,
    encryptedMessage: EncryptedMessage
  ): Promise<DecryptedMessageContext> {
    const decryptedMessage = await agentContext.wallet.unpack(encryptedMessage)
    const { recipientKey, senderKey, plaintextMessage } = decryptedMessage
    return {
      recipientKey: recipientKey ? Key.fromPublicKeyBase58(recipientKey, KeyType.Ed25519) : undefined,
      senderKey: senderKey ? Key.fromPublicKeyBase58(senderKey, KeyType.Ed25519) : undefined,
      plaintextMessage,
    }
  }

  public async unpackMessageCek(agentContext: AgentContext, encryptedMessage:EncryptedMessage, payloadKey: string): Promise <PlaintextMessage>{
    return await agentContext.wallet.distribuitedUnpack(encryptedMessage,payloadKey);
  }
}

export interface DecryptedMessageContext {
  plaintextMessage: PlaintextMessage
  senderKey?: Key
  recipientKey?: Key
}
