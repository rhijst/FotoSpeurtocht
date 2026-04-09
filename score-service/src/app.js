const express = require('express');
require('dotenv').config();
const connectDB = require('./config/db');
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

app.use('/score', scoreRoutes);

app.get('/status', (req, res) => {
  res.json({ status: 'Score service running' });
});

app.listen(process.env.PORT, () => {
  console.log(`Score service running on port ${process.env.PORT}`);
});
