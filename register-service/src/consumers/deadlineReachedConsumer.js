const http = require("http");
const { getChannel } = require("../config/rabbit");
const { publishEvent } = require("../services/rabbitService");
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

function startDeadlineReachedConsumer() {
  const channel = getChannel();
  const exchange = "events";
  const queue = "register-service.target.deadline.reached";

  channel.assertExchange(exchange, "topic", { durable: true });
  channel.assertQueue(queue, { durable: true });
  channel.bindQueue(queue, exchange, "target.deadline.reached");

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    const { targetId } = JSON.parse(msg.content.toString());
    console.log(`[REGISTER] Deadline reached for target ${targetId}, determining winner...`);

    try {
      const submissions = await Submission.find({ targetId, status: "ACCEPTED" });

      if (submissions.length === 0) {
        console.log(`[REGISTER] No accepted submissions for target ${targetId}`);
        channel.ack(msg);
        return;
      }

      const maxScore = Math.max(...submissions.map(s => s.score ?? 0));

      for (const submission of submissions) {
        const isWinner = (submission.score ?? 0) === maxScore;
        try {
          const email = await fetchUserEmail(submission.userId);
          await publishEvent("events", isWinner ? "contest.winner" : "contest.loser", {
            email,
            userId: submission.userId,
            targetId,
            score: submission.score
          });
          console.log(`[REGISTER] ${isWinner ? "Winner" : "Loser"} notified: user ${submission.userId}`);
        } catch (err) {
          console.error(`[REGISTER] Failed to notify user ${submission.userId}:`, err.message);
        }
      }

      channel.ack(msg);
    } catch (err) {
      console.error("[REGISTER] Error processing deadline result:", err.message);
      channel.nack(msg, false, false);
    }
  });
}

module.exports = { startDeadlineReachedConsumer };
