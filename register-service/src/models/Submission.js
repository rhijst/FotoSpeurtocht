const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
    participationId: { type: String, required: true },
    userId: { type: String, required: true },
    targetId: { type: String, required: true },

    imageUrl: { type: String, required: true },

    status: {
        type: String,
        enum: ["PENDING", "ACCEPTED", "REJECTED"],
        default: "PENDING"
    },

    submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Submission", submissionSchema);