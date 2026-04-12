const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
    participationId: { type: String, required: true },
    userId: { type: String, required: true },
    targetId: { type: String, required: true },
    targetOwnerId: { type: String, default: null },
    score: { type: Number, default: null },
    imageUrl: { type: String, required: false },

    status: {
        type: String,
        enum: ["PENDING", "ACCEPTED", "REJECTED"],
        default: "PENDING"
    },

    submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Submission", submissionSchema);