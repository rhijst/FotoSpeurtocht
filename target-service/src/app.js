const express = require("express");
require("dotenv").config();
const path = require("path");

const connectDB = require("./config/db");
const targetRoutes = require("./routes/targetRoutes");
const { connectRabbit } = require("./config/rabbit");

const app = express();

app.use(express.json());

// connect database
connectDB();

// connect rabbitMQ
connectRabbit();

// routes
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/targets", targetRoutes);

app.get("/status", (req, res) => {
  res.json({ status: "Target service running" });
});

app.listen(process.env.PORT, () => {
  console.log(`Target service running on port ${process.env.PORT}`);
});