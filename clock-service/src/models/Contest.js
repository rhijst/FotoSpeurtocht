const mongoose = require("mongoose");

const contestSchema = new mongoose.Schema({
  targetId: { type: String, required: true, unique: true },
  deadline: { type: Date, required: true },
  notified: { type: Boolean, default: false },
  lastReminderSent: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model("Contest", contestSchema);
