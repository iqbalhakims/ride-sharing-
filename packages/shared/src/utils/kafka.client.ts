import { Kafka, Producer, Consumer, KafkaMessage } from 'kafkajs';
import logger from './logger';

export class KafkaProducer {
  private producer: Producer;

  constructor(brokers: string[], clientId: string) {
    const kafka = new Kafka({ clientId, brokers });
    this.producer = kafka.producer({
      retry: { initialRetryTime: 300, retries: 5 },
    });
  }

  async connect(): Promise<void> {
    await this.producer.connect();
    logger.info('Kafka producer connected');
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }

  async publish(topic: string, key: string, value: object): Promise<void> {
    await this.producer.send({
      topic,
      messages: [{ key, value: JSON.stringify(value) }],
    });
  }
}

export class KafkaConsumer {
  private consumer: Consumer;
  private kafka: Kafka;

  constructor(brokers: string[], clientId: string, groupId: string) {
    this.kafka = new Kafka({ clientId, brokers });
    this.consumer = this.kafka.consumer({ groupId });
  }

  async connect(): Promise<void> {
    await this.consumer.connect();
    logger.info('Kafka consumer connected');
  }

  async disconnect(): Promise<void> {
    await this.consumer.disconnect();
  }

  async subscribe(
    topics: string | string[],
    handler: (topic: string, message: KafkaMessage, parsedValue: unknown) => Promise<void>,
  ): Promise<void> {
    const topicList = Array.isArray(topics) ? topics : [topics];
    for (const topic of topicList) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
    }

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const raw = message.value?.toString();
          const parsed = raw ? JSON.parse(raw) : null;
          await handler(topic, message, parsed);
        } catch (err) {
          logger.error('Error processing Kafka message', { topic, err });
        }
      },
    });
  }
}
