import * as amqp from "amqplib";
import { logger } from "../logger";

let connection: any = null;
let channel: amqp.Channel | null = null;

export async function initQueue(): Promise<void> {
  try {
    const url = process.env.RABBITMQ_URL || "amqp://localhost:5672";
    const conn = await amqp.connect(url);
    connection = conn as any;
    // createChannel exists on amqplib Connection; use any to avoid typing mismatches from ESM/CJS
    const ch = await (connection as any).createChannel?.();
    if (!ch) throw new Error("Failed to create channel");
    channel = ch;

    // Assert queues (create if they don't exist)
    if (channel) {
      await channel.assertQueue("notifications", { durable: true });
      await channel.assertQueue("emails", { durable: true });
      await channel.assertQueue("crypto-payments", { durable: true });
    }

    logger.info("RabbitMQ connected and queues asserted");
  } catch (error) {
    logger.error("RabbitMQ init failed:", error);
    throw error;
  }
}

export async function sendToQueue(queue: string, message: any): Promise<void> {
  if (!channel) throw new Error("Queue not initialized");
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });
  logger.debug(`Message sent to queue ${queue}`);
}

export async function consumeQueue(
  queue: string,
  handler: (msg: amqp.Message) => Promise<boolean>,
): Promise<void> {
  if (!channel) throw new Error("Queue not initialized");

  // Set prefetch to limit concurrent processing
  await channel.prefetch(10);

  channel.consume(queue, async (msg) => {
    if (msg) {
      try {
        const shouldAck = await handler(msg);
        if (shouldAck) {
          channel!.ack(msg);
          logger.debug(`Message processed from queue ${queue}`);
        } else {
          channel!.nack(msg, false, true); // Requeue for retry
          logger.warn(`Message requeued in ${queue}`);
        }
      } catch (error) {
        logger.error(`Queue handler error for ${queue}:`, error);
        channel!.nack(msg, false, false); // Don't requeue on error
      }
    }
  });

  logger.info(`Consumer started for queue: ${queue}`);
}

export async function closeQueue(): Promise<void> {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection && typeof connection.close === "function") {
      await connection.close();
      connection = null;
    }
    logger.info("RabbitMQ connection closed");
  } catch (err) {
    logger.error("Error closing RabbitMQ connection:", err);
  }
}
