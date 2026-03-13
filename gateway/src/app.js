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
    target: "http://register-service:3001",
    changeOrigin: true
  })
);

/*
Target Service
*/
app.use(
  "/targets",
  createProxyMiddleware({
    target: "http://target-service:3002",
    changeOrigin: true
  })
);

/*
Health check
*/
app.get("/status", (req, res) => {
  res.json({ status: "Gateway running" });
});

app.listen(3000, () => {
  console.log("Gateway running on port 3000");
});