const { getChannel } = require("../config/rabbit");
const ClosedTarget = require("../models/ClosedTarget");

function startDeadlineConsumer() {
  const channel = getChannel();

  const exchange = "events";
  const queue = "register-service.target.deadline";

  channel.assertExchange(exchange, "topic", { durable: true });
  channel.assertQueue(queue, { durable: true });
  channel.bindQueue(queue, exchange, "target.deadline.reached");

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    const event = JSON.parse(msg.content.toString());
    console.log("[REGISTER] deadline reached:", event);

    const { targetId } = event;

    await ClosedTarget.findOneAndUpdate(
      { targetId },
      { targetId },
      { upsert: true }
    );

    console.log(`[REGISTER] Target ${targetId} is now closed for registration`);
    channel.ack(msg);
  });
}

module.exports = { startDeadlineConsumer };
