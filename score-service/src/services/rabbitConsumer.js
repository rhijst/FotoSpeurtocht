const { getChannel } = require('../config/rabbit');
const Score = require('../models/Score');

const IMAGGA_BASE_URL = 'https://api.imagga.com/v2/tags';

function buildAuthHeader() {
  const credentials = Buffer.from(
    `${process.env.IMAGGA_API_KEY}:${process.env.IMAGGA_API_SECRET}`
  ).toString('base64');
  return `Basic ${credentials}`;
}

function calculateSimilarity(tags) {
  if (!tags || !tags.length) return 0;
  const topTags = tags.slice(0, 10);
  const avgConfidence = topTags.reduce((sum, t) => sum + t.confidence, 0) / topTags.length;
  return avgConfidence;
}

async function scoreImageFromUrl(imageUrl) {
  const { default: fetch } = await import('node-fetch');
  const FormData = require('form-data');

  // Download the image from MinIO (accessible via host.docker.internal)
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image from MinIO: ${imageResponse.status}`);
  }
  const imageBuffer = await imageResponse.buffer();

  // Upload the image bytes to Imagga instead of passing the URL
  const form = new FormData();
  form.append('image', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' });

  const params = new URLSearchParams({ language: 'en', limit: 20, threshold: 0 });
  const response = await fetch(`${IMAGGA_BASE_URL}?${params}`, {
    method: 'POST',
    headers: { Authorization: buildAuthHeader(), ...form.getHeaders() },
    body: form,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Imagga error: ${JSON.stringify(data)}`);
  }

  return data.result.tags;
}

async function startConsumer() {
  const channel = getChannel();

  const exchange = 'events';
  const routingKey = 'target.created';
  const queue = 'score-service.target.created';

  await channel.assertExchange(exchange, 'topic', { durable: true });
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, exchange, routingKey);

  console.log(`Listening for "${routingKey}" events on exchange "${exchange}"`);

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString());
      console.log(`[target.created] Received event for target ${payload.targetId}`);

      const tags = await scoreImageFromUrl(payload.imageURL);
      const similarity = calculateSimilarity(tags);
      const speedBonus = 10;
      const finalScore = similarity * 0.8 + speedBonus * 0.2;

      await Score.create({
        targetId: payload.targetId,
        userId: payload.ownerId,
        imageUrl: payload.imageURL,
        tags,
        similarity,
        speedBonus,
        finalScore,
      });

      console.log(`[target.created] Score for target ${payload.targetId}:`);
      console.log(`  similarity:  ${similarity.toFixed(2)}`);
      console.log(`  speedBonus:  ${speedBonus}`);
      console.log(`  finalScore:  ${finalScore.toFixed(2)}`);
      console.log(`  top tags:    ${tags.slice(0, 5).map(t => t.tag.en).join(', ')}`);

      channel.ack(msg);
    } catch (err) {
      console.error('[target.created] Failed to process event:', err.message);
      channel.nack(msg, false, false); // discard, don't requeue
    }
  });
}

module.exports = { startConsumer };
