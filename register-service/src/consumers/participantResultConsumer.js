const { getChannel } = require("../config/rabbit");
const Participant = require("../models/participant");

function startParticipantResultConsumer() {
  const channel = getChannel();

  const exchange = "events";
  const queue = "register-service.participant.result";

  channel.assertExchange(exchange, "topic", { durable: true });

  channel.assertQueue(queue, { durable: true });

  channel.bindQueue(queue, exchange, "participant.join.result");

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    const event = JSON.parse(msg.content.toString());

    console.log("[JOIN] result received:", event);

    await Participant.findByIdAndUpdate(event.participationId, {
      status: event.status,
      targetOwnerId: event.targetOwnerId ?? null
    });

    channel.ack(msg);
  });
}

module.exports = { startParticipantResultConsumer };