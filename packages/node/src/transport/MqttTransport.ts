import type { InboundTransport, Agent, TransportSession, EncryptedMessage, AgentContext } from '@credo-ts/core'
import mqtt, { MqttClient } from "mqtt"

import { AgentMessage } from '@credo-ts/core'

export class MqttTransport implements InboundTransport{

    private client!: MqttClient
    private brokerUrl: string
    private signatureTopic: string

    public constructor(url:string, deviceId:string) {
        this.brokerUrl = url
        this.signatureTopic = deviceId+"/signatureExchange/request"
    }

    public async start(agent: Agent) {
        agent.config.logger.debug(`Starting MQTT Transport`)

        this.client = mqtt.connect(this.brokerUrl);
        return new Promise<void>((resolve, reject) => {
            this.client.on('connect', () => {
              agent.config.logger.debug(`MQTT Transport Started`);
              resolve();
            });
      
            this.client.on('message', (topic, message) => {
              agent.config.logger.debug(`Received message on ${topic}: ${message.toString()}`);
              // Processa il messaggio come desiderato
            });
      
            this.client.on('error', (err) => {
              agent.config.logger.debug(`MQTT Error: ${err}`);
              reject(err); // Se desideri interrompere il processo di start in caso di errore iniziale
            });
      
            this.client.on('close', () => {
              agent.config.logger.debug('Disconnected from MQTT broker');
            });
          });
    }

    public subscribe(topic: string,agent: Agent) {
        if(this.client){
            this.client.subscribe(topic, (err) => {
                if (err) {
                    agent.config.logger.debug(`MQTT-Failed to subscribe to ${topic}: ${err}`);
                } else {
                    agent.config.logger.debug(`MQTT-Subscribed to ${topic}`);
                }
            });
        }
    }

    public publishSignatureRequest(message: string, agent:Agent) {
        if(this.client){
            this.client.publish(this.signatureTopic, message, (err) => {
                if (err) {
                    agent.config.logger.debug(`MQTT-Failed to publish to ${this.signatureTopic}: ${err}`);
                } else {
                    agent.config.logger.debug(`MQTT-Published to ${this.signatureTopic}`);
                }
            });
        }
    }

    public async stop(): Promise<void> {

    }
    
}