const http = require("http");
const { getChannel } = require("../config/rabbit");
const { publishEvent } = require("../services/rabbitService");
const Participant = require("../models/participant");
const Submission = require("../models/Submission");

function fetchUserEmail(userId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: process.env.JOIN_SERVICE_HOST || "join-service",
      port: process.env.JOIN_SERVICE_PORT || 3001,
      path: `/auth/users/${userId}`,
      method: "GET",
      headers: {
        "x-internal-secret": process.env.INTERNAL_SECRET
      }
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (!parsed.email) return reject(new Error("No email in response"));
          resolve(parsed.email);
        } catch (err) {
          reject(new Error("Failed to parse user response"));
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

function startDeadlineReminderTickConsumer() {
  const channel = getChannel();
  const exchange = "events";
  const queue = "register-service.clock.reminder.tick";

  channel.assertExchange(exchange, "topic", { durable: true });
  channel.assertQueue(queue, { durable: true });
  channel.bindQueue(queue, exchange, "clock.reminder.tick");

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    const { targetId, deadline } = JSON.parse(msg.content.toString());
    console.log(`[REGISTER] Reminder tick received for target ${targetId}`);

    try {
      const participants = await Participant.find({ targetId, status: "ACCEPTED" });

      for (const participant of participants) {
        const submission = await Submission.findOne({
          userId: participant.userId,
          targetId
        });

        if (submission) continue;

        try {
          const email = await fetchUserEmail(participant.userId);

          await publishEvent("events", "deadline.reminder", {
            email,
            userId: participant.userId,
            targetId,
            deadline
          });

          console.log(`[REGISTER] Deadline reminder published for user ${participant.userId}`);
        } catch (err) {
          console.error(`[REGISTER] Failed to process reminder for user ${participant.userId}:`, err.message);
          // Continue with remaining participants
        }
      }

      channel.ack(msg);
    } catch (err) {
      console.error("[REGISTER] Error processing reminder tick:", err.message);
      channel.nack(msg, false, false);
    }
  });
}

module.exports = { startDeadlineReminderTickConsumer };

