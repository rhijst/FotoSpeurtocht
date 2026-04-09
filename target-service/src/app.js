const express = require("express");
require("dotenv").config();
const path = require("path");

const connectDB = require("./config/db");
const targetRoutes = require("./routes/targetRoutes");
const { connectRabbit } = require("./config/rabbit");
const initMinio = require("./utils/initMinio");

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
connectRabbit();

// Set up bucket in minio
initMinio();

// Web browser GUI
app.use(express.static(path.join(__dirname, "public")));

// routes
app.use("/targets", targetRoutes);

app.get("/status", (req, res) => {
  res.json({ status: "Target service running" });
});

// Images
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.listen(process.env.PORT, () => {
  console.log(`Target service running on port ${process.env.PORT}`);
});

