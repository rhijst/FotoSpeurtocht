const mongoose = require("mongoose");

const closedTargetSchema = new mongoose.Schema({
  targetId: { type: String, required: true, unique: true },
  closedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ClosedTarget", closedTargetSchema);
