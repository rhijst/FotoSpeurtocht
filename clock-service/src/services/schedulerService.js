const Contest = require("../models/Contest");
const { publishEvent } = require("./rabbitService");

const CHECK_INTERVAL_MS = 30 * 1000; // every 30 seconds
const REMINDER_INTERVAL_MS = 48 * 60 * 60 * 1000; // 48 hours
// const REMINDER_INTERVAL_MS = 60 * 1000; // 1 minute

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

async function checkReminders() {
  const now = new Date();
  const reminderCutoff = new Date(now - REMINDER_INTERVAL_MS);

  const contests = await Contest.find({
    deadline: { $gt: now },
    notified: false,
    $or: [
      { lastReminderSent: null },
      { lastReminderSent: { $lte: reminderCutoff } }
    ]
  });

  for (const contest of contests) {
    await publishEvent("events", "clock.reminder.tick", {
      targetId: contest.targetId,
      deadline: contest.deadline
    });

    contest.lastReminderSent = now;
    await contest.save();

    console.log(`[CLOCK] Reminder tick published for target ${contest.targetId}`);
  }
}

function startScheduler() {
  console.log("[CLOCK] Scheduler started, checking every 30s");
  checkDeadlines();
  checkReminders();
  setInterval(checkDeadlines, CHECK_INTERVAL_MS);
  setInterval(checkReminders, CHECK_INTERVAL_MS);
}

module.exports = { startScheduler };
