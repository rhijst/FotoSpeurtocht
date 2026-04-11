const { sendMail } = require('../services/mailService');

async function handleUserRegistered(payload) {
    if (!payload.email) throw new Error("Missing email");

    await sendMail(
        payload.email,
        'Welcome!',
        `Hi! Your account has been created.`
    );
}

async function handleScoreCalculated(payload) {
    if (!payload.email || payload.score == null) {
        throw new Error("Invalid score payload");
    }

    await sendMail(
        payload.email,
        'Your score!',
        `You scored ${payload.score}% on target ${payload.targetId}`
    );
}

async function handleDeadlineReminder(payload) {
    if (!payload.email) throw new Error("Missing email");

    await sendMail(
        payload.email,
        'Reminder!',
        `You still have time to submit your photo!`
    );
}

module.exports = {
    handleUserRegistered,
    handleScoreCalculated,
    handleDeadlineReminder
};