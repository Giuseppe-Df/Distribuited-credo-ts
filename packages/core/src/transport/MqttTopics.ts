
//function to retrieve outbound topics
export const getOutboundTopics = (deviceId: string): Record<string, string> => ({
  "https://didcomm.org/pubkey_exchange/1.0/request": `${deviceId}/pubKey/request`,
  "https://didcomm.org/signature_exchange/1.0/request": `${deviceId}/signatureExchange/request`,
  "https://didcomm.org/cek_exchange/1.0/request": `${deviceId}/cekExchange/request`,
  "https://didcomm.org/distribuited_pack/1.0/request": `${deviceId}/distribuitedPack/request`
});

//List of inbound topics
export const getInboundTopics = (deviceId: string): string[] => [
  `${deviceId}/pubKey/response`,
  `${deviceId}/signatureExchange/response`,
  `${deviceId}/cekExchange/response`,
];