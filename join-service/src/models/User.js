const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password_hash: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['participant', 'owner'],
        default: 'participant',
    },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);