const { getChannel } = require('../config/rabbit');

async function publishEvent(exchange, routingKey, payload) {
  try {
    const channel = await getChannel();
    
    // Ensure the exchange exists
    await channel.assertExchange(exchange, 'topic', { durable: true });

    // Publish the message
    channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)));

    // Optional: log for debugging
    console.log(`Published event to ${exchange}:${routingKey}`, payload);

    // Handle channel errors safely
    channel.on('error', (err) => console.error('RabbitMQ channel error:', err));
    channel.on('close', () => console.warn('RabbitMQ channel closed'));

  } catch (err) {
    console.error('Failed to publish RabbitMQ event:', err);
  }
}

module.exports = { publishEvent };