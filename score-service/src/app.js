const express = require('express');
require('dotenv').config();
const connectDB = require('./config/db');
const { connectRabbit } = require('./config/rabbit');
const { startTargetCreatedConsumer } = require('./consumers/targetCreatedConsumer');
const { startParticipantSubmittedConsumer } = require('./consumers/participantSubmittedconsumer');
const scoreRoutes = require('./routes/scoreRoutes');

const app = express();

app.use((req, res, next) => {
  if (req.headers['x-internal-secret'] !== process.env.INTERNAL_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Connect to MongoDB
connectDB();

// Connect to RabbitMQ and start listening for events
connectRabbit().then(() => {
  startTargetCreatedConsumer();
  startParticipantSubmittedConsumer();
});

app.use('/score', scoreRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Score service running on port ${process.env.PORT}`);
});
