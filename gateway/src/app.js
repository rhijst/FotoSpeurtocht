require("dotenv").config();

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

app.use(express.json());

/*
Register Service
*/
app.use(
  "/auth",
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true
  })
);

/*
Target Service
*/
app.use(
  "/targets",
  createProxyMiddleware({
    target: process.env.TARGET_SERVICE_URL,
    changeOrigin: true
  })
);

/*
Health check
*/
app.get("/status", (req, res) => {
  res.json({ status: "Gateway running" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});