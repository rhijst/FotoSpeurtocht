const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();

connectDB();

const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  if (req.headers['x-internal-secret'] !== process.env.INTERNAL_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

app.use('/auth', authRoutes);

app.get('/status', (req, res) => {
  res.json({ status: 'Register service running ' });
});

app.listen(process.env.PORT, () => {
  console.log(`Register service running on port ${process.env.PORT}`);
});