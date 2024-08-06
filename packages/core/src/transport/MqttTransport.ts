import type { OutboundTransport } from './OutboundTransport'
import type { Agent } from '../agent/Agent'
import mqtt, { MqttClient } from "mqtt"
import { OutboundPackage } from '../types'
import { AgentMessage } from '../agent/AgentMessage'
import { MessageReceiver } from '../agent/MessageReceiver'

export class MqttTransport {

    private client!: MqttClient
    private brokerUrl: string
    private signatureTopic: string
    private pubKeyTopic: string
    private pubKeyResponse: string
    public supportedSchemes = ['mqtt', 'mqtts']

    public constructor(url:string, deviceId:string) {
        this.brokerUrl = url
        this.signatureTopic = deviceId+"/signatureExchange/request"
        this.pubKeyTopic = deviceId+"/PubKey/request"
        this.pubKeyResponse = deviceId+"/PubKey/response"
    }

    public async start(agent: Agent) {
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

    public async publishSignatureRequest(message: AgentMessage) {
        if(this.client){
            this.client.publish(this.signatureTopic, JSON.stringify(message), (err) => {
                if (err) {
                    //agent.config.logger.debug(`MQTT-Failed to publish to ${this.signatureTopic}: ${err}`);
                } else {
                    //agent.config.logger.debug(`MQTT-Published to ${this.signatureTopic}`);
                }
            });
        }
    }

    public async connect(){
        return new Promise <void>((resolve,reject) =>{
            this.client = mqtt.connect(this.brokerUrl);
            this.client.on('connect', () => {
                resolve();
              });
              this.client.on('error', (err) => {
                reject(err);
              });
        })
    }

    public async publishPubKeyRequest(message: AgentMessage) {
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
    }

    public async stop(): Promise<void> {

    }
    
}