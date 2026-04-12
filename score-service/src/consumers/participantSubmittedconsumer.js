const { getChannel } = require('../config/rabbit');
const Score = require('../models/Score');
const { scoreImage } = require('../services/imageScoringService');

function startParticipantSubmittedConsumer() {
  const channel = getChannel();

  const exchange = 'events';
  const queue = 'score-service.submission';

  channel.assertExchange(exchange, 'topic', { durable: true });
  channel.assertQueue(queue, { durable: true });

  channel.bindQueue(queue, exchange, 'participant.submitted');

  console.log('🎯 Listening for participant.submitted...');

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    try {
      const event = JSON.parse(msg.content.toString());

      console.log('[SCORE] submission received:', event);

      // 1. Get target baseline
      const targetScore = await Score.findOne({
        targetId: event.targetId
      });

      if (!targetScore) {
        throw new Error(`No baseline score for target ${event.targetId}`);
      }

      // 2. Score submission vs baseline
      const result = await scoreImage(
        event.imageUrl,
        targetScore.tags,
        targetScore.openedAt,
        targetScore.deadline
      );

      // 3. Save submission score
      await Score.create({
        targetId: event.targetId,
        userId: event.userId,
        imageUrl: event.imageUrl,
        tags: result.submissionTags,
        similarity: result.similarity,
        speedBonus: result.speedBonus,
        finalScore: result.finalScore
      });

      // 4. Publish result
      channel.publish(
        exchange,
        'score.calculated',
        Buffer.from(JSON.stringify({
          email: event.email,
          participationId: event.participationId,
          userId: event.userId,
          targetId: event.targetId,
          score: result.finalScore,
          status: result.finalScore = 'ACCEPTED' 
        }))
      );

      channel.ack(msg);

    } catch (err) {
      console.error('[SCORE ERROR]', err.message);
      channel.nack(msg, false, false);
    }
  });
}

module.exports = { startParticipantSubmittedConsumer };