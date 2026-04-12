const amqp = require("amqplib");

let channel;

async function connectRabbit() {
  let retries = 50;
  while (retries) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      
      channel = await connection.createChannel();
      await channel.assertExchange('events', 'topic', { durable: true });
      console.log("RabbitMQ connected (Mail Service)");
      return;
    } catch (err) {
      retries--;
      console.log(`RabbitMQ connection failed, retrying... (${retries} left)`);
      await new Promise(res => setTimeout(res, 5000)); // wait 5 sec
    }
  }
  console.error("Could not connect to RabbitMQ");
  process.exit(1);
}

function getChannel() {
  return channel;
}

module.exports = { connectRabbit, getChannel };