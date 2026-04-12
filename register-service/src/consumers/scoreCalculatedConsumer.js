const { getChannel } = require('../config/rabbit');
const Submission = require('../models/Submission');

function startScoreCalculatedConsumer() {
    const channel = getChannel();

    const exchange = 'events';
    const queue = 'participant-service.score';

    channel.assertExchange(exchange, 'topic', { durable: true });
    channel.assertQueue(queue, { durable: true });

    channel.bindQueue(queue, exchange, 'score.calculated');

    console.log('📊 Listening for score.calculated...');

    channel.consume(queue, async (msg) => {
        if (!msg) return;

        try {
            const event = JSON.parse(msg.content.toString());

            console.log('[PARTICIPANT] score received:', event);

            const submission = await Submission.findOne({
                participationId: event.participationId
            });

            if (!submission) {
                throw new Error('Submission not found');
            }

            submission.status = event.status;
            submission.score = event.score;

            await submission.save();

            channel.ack(msg);

        } catch (err) {
            console.error('[SCORE UPDATE ERROR]', err.message);
            channel.nack(msg, false, false);
        }
    });
}

module.exports = { startScoreCalculatedConsumer };