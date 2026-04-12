const mongoose = require("mongoose");

const participant = new mongoose.Schema({
  userId: { type: String, required: true },
  targetId: { type: String, required: true },
  targetOwnerId: { type: String, default: null },

  status: {
    type: String,
    status: ["PENDING", "ACCEPTED", "REJECTED"],
    default: "PENDING"
  },

  joinedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Participation", participant);