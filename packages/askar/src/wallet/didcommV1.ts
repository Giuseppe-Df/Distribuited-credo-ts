import type { EncryptedMessage } from '@credo-ts/core'

import { WalletError, JsonEncoder, JsonTransformer, Key, KeyType, TypedArrayEncoder, Buffer } from '@credo-ts/core'
import { CryptoBox, Key as AskarKey, KeyAlgs } from '@hyperledger/aries-askar-shared'

import { JweEnvelope, JweRecipient } from './JweEnvelope'
import sodium from 'libsodium-wrappers'

export function didcommV1Pack(payload: Record<string, unknown>, recipientKeys: string[], senderKey?: AskarKey) {
  let cek: AskarKey | undefined
  let senderExchangeKey: AskarKey | undefined

  try {
    cek = AskarKey.generate(KeyAlgs.Chacha20C20P)

    senderExchangeKey = senderKey ? senderKey.convertkey({ algorithm: KeyAlgs.X25519 }) : undefined

    const recipients: JweRecipient[] = []

    for (const recipientKey of recipientKeys) {
      let targetExchangeKey: AskarKey | undefined
      try {
        targetExchangeKey = AskarKey.fromPublicBytes({
          publicKey: Key.fromPublicKeyBase58(recipientKey, KeyType.Ed25519).publicKey,
          algorithm: KeyAlgs.Ed25519,
        }).convertkey({ algorithm: KeyAlgs.X25519 })

        if (senderKey && senderExchangeKey) {
          const encryptedSender = CryptoBox.seal({
            recipientKey: targetExchangeKey,
            //message: TypedArrayEncoder.fromString(TypedArrayEncoder.toBase58(senderKey.publicBytes)),
            message: senderKey.publicBytes,
          })
        
          const nonce = CryptoBox.randomNonce()
          const encryptedCek = CryptoBox.cryptoBox({
            recipientKey: targetExchangeKey,
            senderKey: senderExchangeKey,
            message: cek.secretBytes,
            nonce,
          })

          recipients.push(
            new JweRecipient({
              encryptedKey: encryptedCek,
              header: {
                kid: recipientKey,
                sender: TypedArrayEncoder.toBase64URL(encryptedSender),
                iv: TypedArrayEncoder.toBase64URL(nonce),
              },
            })
          )
        } else {
          const encryptedCek = CryptoBox.seal({
            recipientKey: targetExchangeKey,
            message: cek.secretBytes,
          })
          recipients.push(
            new JweRecipient({
              encryptedKey: encryptedCek,
              header: {
                kid: recipientKey,
              },
            })
          )
        }
      } finally {
        targetExchangeKey?.handle.free()
      }
    }

    const protectedJson = {
      enc: 'xchacha20poly1305_ietf',
      typ: 'JWM/1.0',
      alg: senderKey ? 'Authcrypt' : 'Anoncrypt',
      recipients: recipients.map((item) => JsonTransformer.toJSON(item)),
    }

    const { ciphertext, tag, nonce } = cek.aeadEncrypt({
      message: Buffer.from(JSON.stringify(payload)),
      aad: Buffer.from(JsonEncoder.toBase64URL(protectedJson)),
    }).parts

    const envelope = new JweEnvelope({
      ciphertext: TypedArrayEncoder.toBase64URL(ciphertext),
      iv: TypedArrayEncoder.toBase64URL(nonce),
      protected: JsonEncoder.toBase64URL(protectedJson),
      tag: TypedArrayEncoder.toBase64URL(tag),
    }).toJson()

    return envelope as EncryptedMessage
  } finally {
    cek?.handle.free()
    senderExchangeKey?.handle.free()
  }
}

export function didcommV1DistribuitedPack(cek:AskarKey, cekNonceHex: string, encryptedCekHex: string, payload: Record<string, unknown>, recipientKey: string, senderKeyBase58 : string) {
  let targetExchangeKey: AskarKey | undefined

  try {

    if (!senderKeyBase58){
      throw new WalletError("Unable to process distribuited pack without senderKey")
    }

    targetExchangeKey = AskarKey.fromPublicBytes({
      publicKey: Key.fromPublicKeyBase58(recipientKey, KeyType.Ed25519).publicKey,
      algorithm: KeyAlgs.Ed25519,
    }).convertkey({ algorithm: KeyAlgs.X25519 })

    const senderKey = TypedArrayEncoder.fromBase58(senderKeyBase58)

    const encryptedSender = CryptoBox.seal({
      recipientKey: targetExchangeKey,
      message: TypedArrayEncoder.fromString(TypedArrayEncoder.toBase58(senderKey)),
    })
    const cekNonce = TypedArrayEncoder.fromHex(cekNonceHex)
    const encryptedCek = TypedArrayEncoder.fromHex(encryptedCekHex)

    
    const recipient = new JweRecipient({
        encryptedKey: encryptedCek,
        header: {
          kid: recipientKey,
          sender: TypedArrayEncoder.toBase64URL(encryptedSender),
          iv: TypedArrayEncoder.toBase64URL(cekNonce),
        },
      })
    
    const protectedJson = {
      enc: 'xchacha20poly1305_ietf',
      typ: 'JWM/1.0',
      alg: senderKey ? 'Authcrypt' : 'Anoncrypt',
      recipients: [JsonTransformer.toJSON(recipient)],
    }

    const { ciphertext, tag, nonce } = cek.aeadEncrypt({
      message: Buffer.from(JSON.stringify(payload)),
      aad: Buffer.from(JsonEncoder.toBase64URL(protectedJson)),
    }).parts

    const envelope = new JweEnvelope({
      ciphertext: TypedArrayEncoder.toBase64URL(ciphertext),
      iv: TypedArrayEncoder.toBase64URL(nonce),
      protected: JsonEncoder.toBase64URL(protectedJson),
      tag: TypedArrayEncoder.toBase64URL(tag),
    }).toJson()

    return envelope as EncryptedMessage
  } catch (err){
    throw new WalletError("error didcommv1distribuited",err)
  } finally {
    cek?.handle.free()
    targetExchangeKey?.handle.free()
  }
}

export async function didcommV1Unpack(messagePackage: EncryptedMessage, recipientKey: AskarKey) {
  //await sodium.ready
  const protectedJson = JsonEncoder.fromBase64(messagePackage.protected)

  const alg = protectedJson.alg
  if (!['Anoncrypt', 'Authcrypt'].includes(alg)) {
    throw new WalletError(`Unsupported pack algorithm: ${alg}`)
  }

  const recipient = protectedJson.recipients.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (r: any) => r.header.kid === TypedArrayEncoder.toBase58(recipientKey.publicBytes)
  )

  if (!recipient) {
    throw new WalletError('No corresponding recipient key found')
  }

  const sender = recipient?.header.sender ? TypedArrayEncoder.fromBase64(recipient.header.sender) : undefined
  const iv = recipient?.header.iv ? TypedArrayEncoder.fromBase64(recipient.header.iv) : undefined
  const encrypted_key = TypedArrayEncoder.fromBase64(recipient.encrypted_key)

  if (sender && !iv) {
    throw new WalletError('Missing IV')
  } else if (!sender && iv) {
    throw new WalletError('Unexpected IV')
  }

  let payloadKey, senderKey

  let sender_x: AskarKey | undefined
  let recip_x: AskarKey | undefined

  try {
    recip_x = recipientKey.convertkey({ algorithm: KeyAlgs.X25519 })

    if (sender && iv) {
      senderKey = TypedArrayEncoder.toUtf8String(
        CryptoBox.sealOpen({
          recipientKey: recip_x,
          ciphertext: sender,
        })
      )
      
      sender_x = AskarKey.fromPublicBytes({
        algorithm: KeyAlgs.Ed25519,
        publicKey: TypedArrayEncoder.fromBase58(senderKey),
      }).convertkey({ algorithm: KeyAlgs.X25519 })

      payloadKey = CryptoBox.open({
        recipientKey: recip_x,
        senderKey: sender_x,
        message: encrypted_key,
        nonce: iv,
      })
      //payloadKey = sodium.crypto_box_open_easy(encrypted_key,iv,sender_x.publicBytes,recip_x.secretBytes)
      /*if (payloadKey){
        throw new WalletError("cek decifrato ricevuto in hex "+TypedArrayEncoder.toHex(payloadKey))
      }*/
        

    } else {
      payloadKey = CryptoBox.sealOpen({ ciphertext: encrypted_key, recipientKey: recip_x })
    }
  } finally {
    sender_x?.handle.free()
    recip_x?.handle.free()
  }

  if (!senderKey && alg === 'Authcrypt') {
    throw new WalletError('Sender public key not provided for Authcrypt')
  }

  let cek: AskarKey | undefined
  try {
    cek = AskarKey.fromSecretBytes({ algorithm: KeyAlgs.Chacha20C20P, secretKey: payloadKey })
    const message = cek.aeadDecrypt({
      ciphertext: TypedArrayEncoder.fromBase64(messagePackage.ciphertext),
      nonce: TypedArrayEncoder.fromBase64(messagePackage.iv),
      tag: TypedArrayEncoder.fromBase64(messagePackage.tag),
      aad: TypedArrayEncoder.fromString(messagePackage.protected),
    })
    return {
      plaintextMessage: JsonEncoder.fromBuffer(message),
      senderKey,
      recipientKey: TypedArrayEncoder.toBase58(recipientKey.publicBytes),
    }
  } finally {
    cek?.handle.free()
  }
}

export function didcommV1DistribuitedUnpack(messagePackage: EncryptedMessage,payloadKeyBase64: string) {
  const payloadKey = TypedArrayEncoder.fromHex(payloadKeyBase64)

  let cek: AskarKey | undefined
  try {
    cek = AskarKey.fromSecretBytes({ algorithm: KeyAlgs.Chacha20C20P, secretKey: payloadKey })
    const message = cek.aeadDecrypt({
      ciphertext: TypedArrayEncoder.fromBase64(messagePackage.ciphertext),
      nonce: TypedArrayEncoder.fromBase64(messagePackage.iv),
      tag: TypedArrayEncoder.fromBase64(messagePackage.tag),
      aad: TypedArrayEncoder.fromString(messagePackage.protected),
    })
    return JsonEncoder.fromBuffer(message)
  } finally {
    cek?.handle.free()
  }
}
