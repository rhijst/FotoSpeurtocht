const {
    handleUserRegistered,
    handleScoreCalculated,
    handleDeadlineReminder,
    handleContestWinner,
    handleContestLoser
} = require('./mailHandlers');

module.exports = {
    'user.registered': handleUserRegistered,
    'score.calculated': handleScoreCalculated,
    'deadline.reminder': handleDeadlineReminder,
    'contest.winner': handleContestWinner,
    'contest.loser': handleContestLoser
};