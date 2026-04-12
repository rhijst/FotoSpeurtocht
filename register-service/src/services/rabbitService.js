const { getChannel } = require("../config/rabbit");

async function publishEvent(exchange, routingKey, message) {
    const channel = getChannel();

    await channel.assertExchange(exchange, "topic", { durable: true });

    channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
    );

    console.log(`📤 Event published: ${routingKey}`);
}

module.exports = { publishEvent };