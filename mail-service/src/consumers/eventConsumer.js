const { getChannel } = require('../config/rabbit');
const { sendMail } = require('../services/mailService');

async function startConsumer() {
  const channel = getChannel();

  const exchange = 'events';
  await channel.assertExchange(exchange, 'topic', { durable: true });

  const queue = 'mail-service.queue';
  await channel.assertQueue(queue, { durable: true });

  // luister naar meerdere events
  await channel.bindQueue(queue, exchange, 'user.registered');
  await channel.bindQueue(queue, exchange, 'score.calculated');
  await channel.bindQueue(queue, exchange, 'deadline.reminder');

  console.log('📧 Mail service listening for events...');

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    try {
      const routingKey = msg.fields.routingKey;
      const payload = JSON.parse(msg.content.toString());

      console.log(`📩 Event received: ${routingKey}`);

      switch (routingKey) {
        case 'user.registered':
          await sendMail(
            payload.email,
            'Welcome!',
            `Hi ${payload.name}, your account has been created.`
          );
          break;

        case 'score.calculated':
          await sendMail(
            payload.email,
            'Your score!',
            `You scored ${payload.score}% on target ${payload.targetId}`
          );
          break;

        case 'deadline.reminder':
          await sendMail(
            payload.email,
            'Reminder!',
            `You still have time to submit your photo!`
          );
          break;
      }

      channel.ack(msg);
    } catch (err) {
      console.error('Mail error:', err.message);
      channel.nack(msg, false, false);
    }
  });
}

module.exports = { startConsumer };