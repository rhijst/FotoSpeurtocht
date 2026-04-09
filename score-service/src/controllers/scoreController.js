const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const FormData = require('form-data');
const Score = require('../models/Score');

const IMAGGA_BASE_URL = 'https://api.imagga.com/v2/tags';

function buildAuthHeader() {
  const credentials = Buffer.from(
    `${process.env.IMAGGA_API_KEY}:${process.env.IMAGGA_API_SECRET}`
  ).toString('base64');
  return `Basic ${credentials}`;
}

// Eenvoudige similarity functie: gemiddelde confidence van tags
function calculateSimilarity(tags) {
  if (!tags || !tags.length) return 0;
  const topTags = tags.slice(0, 10); // top 10 tags
  const avgConfidence = topTags.reduce((sum, t) => sum + t.confidence, 0) / topTags.length;
  return avgConfidence; // 0-100
}

async function scoreByUrl(req, res) {
  const { image_url, targetId, language = 'en', limit = 20, threshold = 0 } = req.body;

  if (!image_url || !targetId) {
    return res.status(400).json({ error: 'image_url and targetId are required' });
  }

  const params = new URLSearchParams({ image_url, language, limit, threshold });

  const response = await fetch(`${IMAGGA_BASE_URL}?${params}`, {
    headers: { Authorization: buildAuthHeader() },
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json({ error: data });
  }

  const similarity = calculateSimilarity(data.result.tags);
  const speedBonus = 10; // voorbeeld, kan berekend worden mbv timestamp
  const finalScore = similarity * 0.8 + speedBonus * 0.2;

  const newScore = new Score({
    targetId,
    userId: req.user.userId,
    similarity,
    speedBonus,
    finalScore,
  });

  await newScore.save();

  res.json({ similarity, speedBonus, finalScore, tags: data.result.tags });
}

async function scoreByUpload(req, res) {
  console.log("test")
  if (!req.file) {
    return res.status(400).json({ error: 'image file is required' });
  }

  const { targetId, language = 'en', limit = 20, threshold = 0 } = req.body;

  if (!targetId) {
    return res.status(400).json({ error: 'targetId is required' });
  }

  const form = new FormData();
  form.append('image', req.file.buffer, {
    filename: req.file.originalname,
    contentType: req.file.mimetype,
  });

  const params = new URLSearchParams({ language, limit, threshold });

  const response = await fetch(`${IMAGGA_BASE_URL}?${params}`, {
    method: 'POST',
    headers: {
      Authorization: buildAuthHeader(),
      ...form.getHeaders(),
    },
    body: form,
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json({ error: data });
  }

  const similarity = calculateSimilarity(data.result.tags);
  const speedBonus = 10; // voorbeeld
  const finalScore = similarity * 0.8 + speedBonus * 0.2;

  const newScore = new Score({
    targetId,
    userId: req.user.userId,
    similarity,
    speedBonus,
    finalScore,
  });

  await newScore.save();

  res.json({ similarity, speedBonus, finalScore, tags: data.result.tags });
}

module.exports = { scoreByUrl, scoreByUpload };