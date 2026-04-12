const { getChannel } = require("../config/rabbit");

async function publishEvent(exchange, routingKey, payload) {
  try {
    const channel = getChannel();
    await channel.assertExchange(exchange, "topic", { durable: true });
    channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)), { persistent: true });
    console.log(`[CLOCK] Published ${exchange}:${routingKey}`, payload);
  } catch (err) {
    console.error("[CLOCK] Failed to publish event:", err);
  }
}

module.exports = { publishEvent };
