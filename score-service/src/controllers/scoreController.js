const Score = require('../models/Score');
const { scoreImage } = require('../services/imageScoringService');

async function scoreByUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'image required' });
    }

    const { targetId } = req.body;

    const result = await scoreImage(req.file.buffer);

    const score = await Score.create({
      targetId,
      userId: req.user?.userId || 'test-user',
      ...result
    });

    res.json(score);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { scoreByUpload };