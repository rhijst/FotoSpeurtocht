const express = require('express');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);

app.get('/status', (req, res) => {
  res.json({ status: 'running' });
});

app.listen(process.env.PORT, () => {
  console.log(`Register service running on port ${process.env.PORT}`);
});