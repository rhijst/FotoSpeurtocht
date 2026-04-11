const { getChannel } = require("../config/rabbit");
const Target = require("../models/Target");

function startDeadlineConsumer() {
  const channel = getChannel();

  const exchange = "events";
  const queue = "target-service.target.deadline";

  channel.assertExchange(exchange, "topic", { durable: true });
  channel.assertQueue(queue, { durable: true });
  channel.bindQueue(queue, exchange, "target.deadline.reached");

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    const event = JSON.parse(msg.content.toString());
    console.log("[TARGET] deadline reached:", event);

    await Target.findByIdAndUpdate(event.targetId, { deadlineReached: true });

    console.log(`[TARGET] deadlineReached set to true for target ${event.targetId}`);
    channel.ack(msg);
  });
}

module.exports = { startDeadlineConsumer };
