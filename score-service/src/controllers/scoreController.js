const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const FormData = require('form-data');

const IMAGGA_BASE_URL = 'https://api.imagga.com/v2/tags';

function buildAuthHeader() {
  const credentials = Buffer.from(
    `${process.env.IMAGGA_API_KEY}:${process.env.IMAGGA_API_SECRET}`
  ).toString('base64');
  return `Basic ${credentials}`;
}

async function scoreByUrl(req, res) {
  const { image_url, language = 'en', limit = 20, threshold = 0 } = req.body;

  if (!image_url) {
    return res.status(400).json({ error: 'image_url is required' });
  }

  const params = new URLSearchParams({ image_url, language, limit, threshold });

  const response = await fetch(`${IMAGGA_BASE_URL}?${params}`, {
    headers: { Authorization: buildAuthHeader() },
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json({ error: data });
  }

  res.json(data);
}

async function scoreByUpload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'image file is required' });
  }

  const { language = 'en', limit = 20, threshold = 0 } = req.body;

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

  res.json(data);
}

module.exports = { scoreByUrl, scoreByUpload };
