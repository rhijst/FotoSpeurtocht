require("dotenv").config();
const express = require("express");

const connectDB = require("./config/db");
const { connectRabbit } = require("./config/rabbit");
const { startTargetCreatedConsumer } = require("./consumers/targetCreatedConsumer");
const { startScheduler } = require("./services/schedulerService");

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  if (req.headers["x-internal-secret"] !== process.env.INTERNAL_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

connectDB();

connectRabbit().then(() => {
  startTargetCreatedConsumer();
  startScheduler();
});

app.get("/status", (req, res) => {
  res.json({ status: "Clock service running" });
});

app.listen(process.env.PORT, () => {
  console.log(`Clock service running on port ${process.env.PORT}`);
});
