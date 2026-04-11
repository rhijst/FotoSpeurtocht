const {
    handleUserRegistered,
    handleScoreCalculated,
    handleDeadlineReminder
} = require('./mailHandlers');

module.exports = {
    'user.registered': handleUserRegistered,
    'score.calculated': handleScoreCalculated,
    'deadline.reminder': handleDeadlineReminder
};