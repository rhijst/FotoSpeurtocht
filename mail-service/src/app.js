require('dotenv').config();

const { connectRabbit } = require('./config/rabbit');
const { startConsumer } = require('./consumers/eventConsumer');

async function start() {
  await connectRabbit();
  await startConsumer();
}

start();

app.listen(process.env.PORT, () => {
  console.log(`Join service running on port ${process.env.PORT}`);
});