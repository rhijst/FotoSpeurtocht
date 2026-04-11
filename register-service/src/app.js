require("dotenv").config();
const express = require("express");

const connectDB = require("./config/db");
const { connectRabbit } = require("./config/rabbit");

const participantRoutes = require("./routes/participantRoutes");
const { startParticipantResultConsumer } = require("./consumers/participantResultConsumer");
const { startDeadlineConsumer } = require("./consumers/deadlineConsumer");

const app = express();
app.use(express.json());

// internal security
app.use((req, res, next) => {
  if (req.headers['x-internal-secret'] !== process.env.INTERNAL_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// connect services
connectDB();

connectRabbit().then(() => {
  startParticipantResultConsumer();
  startDeadlineConsumer();
});

// routes
app.use("/participants", participantRoutes);

app.get("/status", (req, res) => {
  res.json({ status: "Join service running" });
});

app.listen(process.env.PORT, () => {
  console.log(`Join service running on port ${process.env.PORT}`);
});