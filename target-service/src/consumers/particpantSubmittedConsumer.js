const { getChannel } = require("../config/rabbit");
const Target = require("../models/Target");
const mongoose = require("mongoose");

function startSubmissionConsumer() {
    const channel = getChannel();

    const exchange = "events";
    const queue = "target-service.submission";

    channel.assertExchange(exchange, "topic", { durable: true });
    channel.assertQueue(queue, { durable: true });

    channel.bindQueue(queue, exchange, "participant.submission.created");

    channel.consume(queue, async (msg) => {
        if (!msg) return;

        const event = JSON.parse(msg.content.toString());
        console.log("[TARGET] submission received:", event);

        let status = "REJECTED";

        if (mongoose.Types.ObjectId.isValid(event.targetId)) {
            const target = await Target.findById(event.targetId);
            if (new Date(target.deadline) < new Date()) {
                status = "rejected deadline passed";
            }

            if (target && new Date(target.deadline) > new Date()) {
                status = "ACCEPTED";
            }
        }
        
        await publishEvent("events", "participant.submission.created", {
            submissionId: submission._id,
            participationId,
            userId,
            targetId,
            imageUrl
        });

        channel.ack(msg);
    });
}

module.exports = { startSubmissionConsumer };