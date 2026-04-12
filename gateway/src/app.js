const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const { createServiceBreaker, circuitBreakerGuard } = require('./circuitBreaker');
require('dotenv').config();

const app = express();

// Circuit breakers per microservice
const breakers = {
  join:     createServiceBreaker('join-service',     process.env.JOIN_SERVICE_URL),
  target:   createServiceBreaker('target-service',   process.env.TARGET_SERVICE_URL),
  score:    createServiceBreaker('score-service',    process.env.SCORE_SERVICE_URL),
  register: createServiceBreaker('register-service', process.env.REGISTER_SERVICE_URL),
};

//CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
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

    // Circuit breaker check vóór aanroep join-service
    await breakers.join.fire().catch(() => {
      const err = new Error('join-service niet bereikbaar');
      err.status = 503;
      throw err;
    });

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

    const { userId, email: userEmail } = await response.json();

    const token = jwt.sign(
      { userId, email: userEmail },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    if (err.status === 503) {
      return res.status(503).json({
        error: 'Service tijdelijk niet beschikbaar. Probeer het later opnieuw.',
        service: 'join-service',
      });
    }
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
    req.headers['x-user-email'] = String(decoded.email);
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
  circuitBreakerGuard(breakers.join, 'join-service'),
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
  circuitBreakerGuard(breakers.target, 'target-service'),
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
  circuitBreakerGuard(breakers.score, 'score-service'),
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
  circuitBreakerGuard(breakers.register, 'register-service'),
  createProxyMiddleware({
    target: process.env.REGISTER_SERVICE_URL,
    changeOrigin: true,
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader('x-internal-secret', process.env.INTERNAL_SECRET);
    },
  })
);

app.listen(3000, () => {
  console.log('Gateway running on port 3000');
});
