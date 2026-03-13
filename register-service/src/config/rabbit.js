const amqp = require("amqplib");

let channel;

async function connectRabbit() {
  const connection = await amqp.connect("amqp://rabbitmq");
  channel = await connection.createChannel();

  console.log("RabbitMQ connected");
}

function getChannel() {
  return channel;
}

module.exports = { connectRabbit, getChannel };