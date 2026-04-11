const { getChannel } = require('../config/rabbit');
const handlers = require('../handlers');

async function startConsumer() {
  const channel = getChannel();

  const exchange = 'events';
  const queue = 'mail-service.queue';

  await channel.assertExchange(exchange, 'topic', { durable: true });
  await channel.assertQueue(queue, { durable: true });

  // bind all known events dynamically
  for (const key of Object.keys(handlers)) {
    await channel.bindQueue(queue, exchange, key);
  }

  console.log('📧 Mail service listening for events...');

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    const routingKey = msg.fields.routingKey;

    try {
      const payload = JSON.parse(msg.content.toString());

      console.log(`📩 Event received: ${routingKey}`);

      const handler = handlers[routingKey];

      if (!handler) {
        console.warn(`⚠️ No handler for event: ${routingKey}`);
        channel.ack(msg);
        return;
      }

      await handler(payload);

      channel.ack(msg);

    } catch (err) {
      console.error(`❌ Error handling ${routingKey}:`, err.message);

      // Drop message
      channel.nack(msg, false, false);
    }
  });
}

module.exports = { startConsumer };