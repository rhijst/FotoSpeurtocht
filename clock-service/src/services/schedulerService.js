const Contest = require("../models/Contest");
const { publishEvent } = require("./rabbitService");

const CHECK_INTERVAL_MS = 30 * 1000; // every 30 seconds

async function checkDeadlines() {
  const expired = await Contest.find({
    deadline: { $lte: new Date() },
    notified: false
  });

  for (const contest of expired) {
    await publishEvent("events", "target.deadline.reached", {
      targetId: contest.targetId
    });

    contest.notified = true;
    await contest.save();

    console.log(`[CLOCK] Deadline reached for target ${contest.targetId}`);
  }
}

function startScheduler() {
  console.log("[CLOCK] Scheduler started, checking every 30s");
  // Run once immediately on startup to catch any missed deadlines
  checkDeadlines();
  setInterval(checkDeadlines, CHECK_INTERVAL_MS);
}

module.exports = { startScheduler };
