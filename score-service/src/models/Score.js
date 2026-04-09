const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema(
  {
    targetId: { type: String, required: true },
    userId: { type: String, required: true },
    imageUrl: { type: String },
    tags: { type: Array, default: [] },
    similarity: { type: Number, required: true },
    speedBonus: { type: Number, default: 0 },
    finalScore: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'scores' }
);

module.exports = mongoose.model('Score', scoreSchema);