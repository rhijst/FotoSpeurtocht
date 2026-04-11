const { getChannel } = require("../config/rabbit");
const Contest = require("../models/Contest");

function startTargetCreatedConsumer() {
  const channel = getChannel();

  const exchange = "events";
  const queue = "clock-service.target.created";

  channel.assertExchange(exchange, "topic", { durable: true });
  channel.assertQueue(queue, { durable: true });
  channel.bindQueue(queue, exchange, "target.created");

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    const event = JSON.parse(msg.content.toString());
    console.log("[CLOCK] target.created received:", event);

    const { targetId, deadline } = event;

    if (!targetId || !deadline) {
      console.warn("[CLOCK] Missing targetId or deadline, skipping");
      channel.ack(msg);
      return;
    }

    await Contest.findOneAndUpdate(
      { targetId: String(targetId) },
      { targetId: String(targetId), deadline: new Date(deadline), notified: false },
      { upsert: true, new: true }
    );

    console.log(`[CLOCK] Tracking contest ${targetId} until ${deadline}`);
    channel.ack(msg);
  });
}

module.exports = { startTargetCreatedConsumer };
