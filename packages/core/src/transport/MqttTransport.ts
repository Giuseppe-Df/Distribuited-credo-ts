import type { OutboundTransport } from './OutboundTransport'
import type { Agent } from '../agent/Agent'
import mqtt, { MqttClient } from "mqtt"
import { OutboundPackage } from '../types'
import { AgentMessage } from '../agent/AgentMessage'
import { MessageReceiver } from '../agent/MessageReceiver'
import { getOutboundTopics, getInboundTopics } from './MqttTopics'
import { resolve } from 'path'

export class MqttTransport {

    private client!: MqttClient
    private brokerUrl: string
    private outboundTopics: Record<string, string>;
    private inboundTopics: string[]
    public supportedSchemes = ['mqtt', 'mqtts']

    public constructor(url:string, deviceId:string) {
        this.brokerUrl = url
        this.outboundTopics=getOutboundTopics(deviceId)
        this.inboundTopics=getInboundTopics(deviceId)
    }

    /*public async start(agent: Agent) {
        const messageReceiver = agent.dependencyManager.resolve(MessageReceiver)
        agent.config.logger.debug(`Starting MQTT Transport`)

        this.client = mqtt.connect(this.brokerUrl);
        this.client.on('message', (topic, message) => {
            //agent.config.logger.debug(`Received message on ${topic}: ${JSON.parse(message.toString())}`);
            if (topic==this.pubKeyResponse){
                const parsedMessage=JSON.parse(message.toString())
                messageReceiver.receivePubKeyResponde(parsedMessage)
            }
        });
        return new Promise<void>((resolve, reject) => {
            this.client.on('connect', () => {
              agent.config.logger.debug(`MQTT Transport Started`);
              // Cancellare i messaggi retained precedenti
                this.client.publish(this.pubKeyResponse, '', { retain: true }, (err) => {
                    if (!err) {
                    console.log('Messaggio retained cancellato');
                    } else {
                    console.error('Errore nella cancellazione del messaggio retained:', err);
                    }
                });
                this.client.subscribe(this.pubKeyResponse,{qos:2}, (err) => {
                    if (err) {
                        agent.config.logger.debug(`MQTT-Failed to subscribe to ${this.pubKeyResponse}: ${err}`);
                        reject(err)
                    } else {
                        agent.config.logger.debug(`MQTT-Subscribed to ${this.pubKeyResponse}`);
                        resolve();
                    }
                });
              
            });

            this.client.on('error', (err) => {
              agent.config.logger.debug(`MQTT Error: ${err}`);
              reject(err); // Se desideri interrompere il processo di start in caso di errore iniziale
            });
      
            this.client.on('close', () => {
              agent.config.logger.debug('Disconnected from MQTT broker');
            });
          });
    }*/

    public async start(agent: Agent) {
        const messageReceiver = agent.dependencyManager.resolve(MessageReceiver)
        agent.config.logger.debug(`Starting MQTT Transport`)
        try{
            await this.connect()
            agent.config.logger.debug(`MQTT Transport Started`)
        }catch(err){
            agent.config.logger.debug(`Error Starting MQTT Transport`, err)
        }

        try{
            await this.clean()
            await this.subscribe()
            agent.config.logger.debug(`Inbound MQTT Topics Ready`)
        }catch(err){
            agent.config.logger.debug(`Error Inbound MQTT Topic`, err)
        }

        this.client.on('message', (topic, message) => {
            agent.config.logger.debug(`Received Message on topic: `+topic+" "+message.toString())
            const parsedMessage=JSON.parse(message.toString())
            messageReceiver.receiveMessageFromBroker(parsedMessage,agent.context.contextCorrelationId)
        });
        
        this.client.on('close', () => {
            agent.config.logger.debug('Disconnected from MQTT broker');
        });
            
    }

    public async publish(message: AgentMessage) {
        if (!this.client) {
            await this.connect();
        }

        const topic = this.outboundTopics[message.type];
        if (!topic) {
            throw new Error(`Unsupported message type: ${message.type}`);
        }

        return new Promise<void>((resolve, reject) => {
            this.client.publish(topic, JSON.stringify(message), (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    public async connect(){
        return new Promise <void>((resolve,reject) =>{
            this.client = mqtt.connect(this.brokerUrl);
            this.client.on('connect', () => {resolve();});
            this.client.on('error', (err) => {reject(err);});
        }) 
    }

    public async clean(){
        const cleanPromises = this.inboundTopics.map(topic => {
            return new Promise<void>((resolve, reject) => {
                this.client.publish(topic, '', { retain: true }, (err) => {
                    if (!err) {
                        resolve();
                    } else {
                        reject(err);
                    }
                });
            });
        });
    
        await Promise.all(cleanPromises);
    }

    public async subscribe(){
        const subscriptionPromises = Object.values(this.inboundTopics).map(topic => {
            return new Promise<void>((resolve, reject) => {
                this.client.subscribe(topic, { qos: 2 }, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });
    
        await Promise.all(subscriptionPromises);
    }

    /*public async publishSignatureRequest(message: AgentMessage) {
        if(this.client){
            this.client.publish(this.signatureTopic, JSON.stringify(message), (err) => {
                if (err) {
                    //agent.config.logger.debug(`MQTT-Failed to publish to ${this.signatureTopic}: ${err}`);
                } else {
                    //agent.config.logger.debug(`MQTT-Published to ${this.signatureTopic}`);
                }
            });
        }
    }*/

    

    /*public async publishPubKeyRequest(message: AgentMessage) {
        if (!this.client){
            await this.connect()
        }
        return new Promise<void>((resolve, reject) => {
            this.client.publish(this.pubKeyTopic, JSON.stringify(message), (err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            });
        })
    }*/

    public async stop(): Promise<void> {

    }
    
}