
//function to retrieve outbound topics
export const getOutboundTopics = (deviceId: string): Record<string, string> => ({
  "https://didcomm.org/pubkey_exchange/1.0/request": `${deviceId}/pubKey/request`,
  "https://didcomm.org/signature_exchange/1.0/request": `${deviceId}/signatureExchange/request`,
  "https://didcomm.org/distribuited_unpack/1.0/request": `${deviceId}/distribuitedUnpack/request`,
  "https://didcomm.org/distribuited_pack/1.0/request": `${deviceId}/distribuitedPack/request`
});

//List of inbound topics
export const getInboundTopics = (deviceId: string): string[] => [
  `${deviceId}/pubKey/response`,
  `${deviceId}/signatureExchange/response`,
  `${deviceId}/distribuitedUnpack/response`,
  `${deviceId}/distribuitedPack/response`,
  
];