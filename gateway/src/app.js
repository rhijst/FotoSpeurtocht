const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

//CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

/*
Auth - Login
*/
app.post('/auth/login', express.json(), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verify credentials via join-service (database-per-service)
    const response = await fetch(`${process.env.JOIN_SERVICE_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_SECRET,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { userId } = await response.json();

    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
Block /auth/verify from being called publicly through the gateway
*/
app.all('/auth/verify', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

/*
JWT verification middleware — skips /auth/login and /auth/register
*/
function verifyToken(req, res, next) {
  const unprotected = ['/auth/login', '/auth/register'];
  if (unprotected.includes(req.path)) return next();

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.headers['x-user-id'] = String(decoded.userId);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.use(verifyToken);

/*
Auth - Register (proxied to join-service)
*/
app.use(
  '/auth',
  createProxyMiddleware({
    target: process.env.JOIN_SERVICE_URL,
    changeOrigin: true,
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader('x-internal-secret', process.env.INTERNAL_SECRET);
    },
  })
);

/*
Target Service
*/
app.use(
  '/targets',
  createProxyMiddleware({
    target: process.env.TARGET_SERVICE_URL,
    changeOrigin: true,
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader('x-internal-secret', process.env.INTERNAL_SECRET);
    },
  })
);

/*
Score Service
*/
app.use(
  '/score',
  createProxyMiddleware({
    target: process.env.SCORE_SERVICE_URL,
    changeOrigin: true,
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader('x-internal-secret', process.env.INTERNAL_SECRET);
    },
  })
);

/*
Join Service (Participants)
*/
app.use(
  '/participants',
  createProxyMiddleware({
    target: process.env.REGISTER_SERVICE_URL,
    changeOrigin: true,
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader('x-internal-secret', process.env.INTERNAL_SECRET);
    },
  })
);

/*
Health check
*/
app.get('/status', (req, res) => {
  res.json({ status: 'Gateway running' });
});

app.listen(3000, () => {
  console.log('Gateway running on port 3000');
});
