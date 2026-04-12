const { getChannel } = require('../config/rabbit');
const Score = require('../models/Score');
const { scoreImage } = require('../services/imageScoringService');

function startTargetCreatedConsumer() {
    const channel = getChannel();

    const exchange = 'events';
    const queue = 'score-service.target.created';

    channel.assertExchange(exchange, 'topic', { durable: true });
    channel.assertQueue(queue, { durable: true });

    channel.bindQueue(queue, exchange, 'target.created');

    console.log('📦 Listening for target.created...');

    channel.consume(queue, async (msg) => {
        if (!msg) return;

        try {
            const event = JSON.parse(msg.content.toString());

            console.log('[SCORE] target created:', event);

            // 🔥 score the target image itself (baseline)
            const result = await scoreImage(event.imageURL, []);

            // store baseline score
            await Score.create({
                targetId: event.targetId,
                userId: event.ownerId,
                imageUrl: event.imageURL,
                tags: result.submissionTags,
                similarity: 100,        // baseline
                speedBonus: 0,
                finalScore: 100,        // reference baseline
                openedAt: event.openedAt,
                deadline: event.deadline
            });

            console.log(`[SCORE] baseline created for target ${event.targetId}`);

            channel.ack(msg);
        } catch (err) {
            console.error('[TARGET CREATED ERROR]', err.message);
            channel.nack(msg, false, false);
        }
    });
}

module.exports = { startTargetCreatedConsumer };