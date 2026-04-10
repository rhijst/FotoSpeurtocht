const amqp = require('amqplib');

let channel;

async function connectRabbit() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();
  return channel;
}

function getChannel() {
  if (!channel) throw new Error('RabbitMQ not connected');
  return channel;
}

module.exports = { connectRabbit, getChannel };