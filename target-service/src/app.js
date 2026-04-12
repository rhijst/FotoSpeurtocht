const express = require("express");
require("dotenv").config();
const path = require("path");

const connectDB = require("./config/db");
const targetRoutes = require("./routes/targetRoutes");
const { connectRabbit } = require("./config/rabbit");
const { startParticipantConsumer } = require("./consumers/participantConsumer");
const { startDeadlineConsumer } = require("./consumers/deadlineConsumer");

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  if (req.headers['x-internal-secret'] !== process.env.INTERNAL_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// connect database
connectDB();

// connect rabbitMQ
connectRabbit().then(() => {
  startParticipantConsumer();
  startDeadlineConsumer();
});

// routes
app.use("/targets", targetRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Target service running on port ${process.env.PORT}`);
});

