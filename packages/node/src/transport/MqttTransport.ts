import type { InboundTransport, Agent, TransportSession, EncryptedMessage, AgentContext } from '@credo-ts/core'

import mqtt, { MqttClient } from "mqtt"

export class MqttTransport implements InboundTransport{

    private client!: MqttClient
    private brokerUrl: string
    private signatureTopic: string

    public constructor(url:string, deviceId:string) {
        this.brokerUrl = url
        this.signatureTopic = deviceId+"/signatureExchange/send"
    }

    public async start(agent: Agent) {
        agent.config.logger.debug(`Starting MQTT Transport`)

        this.client = mqtt.connect(this.brokerUrl);
        this.client.on("connect", () => {
            agent.config.logger.debug(`MQTT Transport Started`)
        });
        
        this.client.on('message', (topic, message) => {
            agent.config.logger.debug(`Received message on ${topic}: ${message.toString()}`);
            // Processa il messaggio come desiderato
        });
    
        this.client.on('error', (err) => {
            agent.config.logger.debug(`MQTT Error: ${err}`);
        });
    
        this.client.on('close', () => {
            agent.config.logger.debug('Disconnected from MQTT broker');
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

    public publish(topic: string, message: string, agent:Agent) {
        if(this.client){
            this.client.publish(topic, message, (err) => {
                if (err) {
                    agent.config.logger.debug(`MQTT-Failed to publish to ${topic}: ${err}`);
                } else {
                    agent.config.logger.debug(`MQTT-Published to ${topic}`);
                }
            });
        }
    }

    public async stop(): Promise<void> {

    }
    
}