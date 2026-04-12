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

    const deadline = new Date(payload.deadline);
    const hoursLeft = Math.round((deadline - new Date()) / (1000 * 60 * 60));
    const deadlineStr = deadline.toLocaleString('nl-NL', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    await sendMail(
        payload.email,
        'Reminder: There is still time to submit your photo!',
        `You have ${hoursLeft} hours left to submit your photo. The deadline is ${deadlineStr}.`
    );
}

async function handleContestWinner(payload) {
    if (!payload.email) throw new Error("Missing email");

    await sendMail(
        payload.email,
        'You won the contest!',
        `Congratulations! You won the FotoSpeurtocht contest for target ${payload.targetId} with a score of ${Math.round(payload.score)}%. Well done!`
    );
}

async function handleContestLoser(payload) {
    if (!payload.email) throw new Error("Missing email");

    await sendMail(
        payload.email,
        'Contest results',
        `The contest for target ${payload.targetId} has ended. Unfortunately you did not win this time. Your score was ${Math.round(payload.score)}%. Better luck next time!`
    );
}

module.exports = {
    handleUserRegistered,
    handleScoreCalculated,
    handleDeadlineReminder,
    handleContestWinner,
    handleContestLoser
};