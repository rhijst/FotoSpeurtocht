const { getChannel } = require("../config/rabbit");
const Target = require("../models/Target");
const mongoose = require("mongoose");

function startParticipantConsumer() {
  const channel = getChannel();

  const exchange = "events";
  const queue = "target-service.participant.join";

  channel.assertExchange(exchange, "topic", { durable: true });

  channel.assertQueue(queue, { durable: true });

  channel.bindQueue(queue, exchange, "participant.join.requested");

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    const event = JSON.parse(msg.content.toString());

    console.log("[TARGET] join request:", event);

    if (!mongoose.Types.ObjectId.isValid(event.targetId)) {
      console.warn("[TARGET] invalid targetId received:", event.targetId);
      channel.ack(msg);
      return;
    }

    const target = await Target.findById(event.targetId);

    let result;

    if (!target) {
      result = "REJECTED";
    } else if (target.deadlineReached) {
      result = "REJECTED - DEADLINE REACHED";
    } else {
      result = "CONFIRMED";
    }

    const payload = {
      participationId: event.participationId,
      userId: event.userId,
      targetId: event.targetId,
      status: result
    };

    channel.publish(
      exchange,
      "participant.join.result",
      Buffer.from(JSON.stringify(payload))
    );

    channel.ack(msg);
  });
}

module.exports = { startParticipantConsumer };