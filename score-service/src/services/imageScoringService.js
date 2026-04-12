const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const FormData = require('form-data');

const IMAGGA_URL = 'https://api.imagga.com/v2/tags';

function buildAuthHeader() {
    const credentials = Buffer.from(
        `${process.env.IMAGGA_API_KEY}:${process.env.IMAGGA_API_SECRET}`
    ).toString('base64');

    return `Basic ${credentials}`;
}

function calculateSimilarity(subTags, targetTags) {
    if (!subTags?.length || !targetTags?.length) return 0;

    const subMap = new Map(subTags.map(t => [t.tag.en, t.confidence]));
    const targetMap = new Map(targetTags.map(t => [t.tag.en, t.confidence]));

    // Weighted similarity over matched tags — high confidence target tags matter more
    let weightedScore = 0;
    let totalWeight = 0;

    for (const [tag, targetConf] of targetMap.entries()) {
        const weight = targetConf / 100;
        if (subMap.has(tag)) {
            const subConf = subMap.get(tag);
            const diff = Math.abs(targetConf - subConf);
            const tagSimilarity = Math.max(0, 100 - diff);
            weightedScore += tagSimilarity * weight;
        }
        // unmatched target tags contribute 0 but still add to total weight
        totalWeight += weight;
    }

    if (totalWeight === 0) return 0;

    const similarity = weightedScore / totalWeight;

    // Soft penalty for submission tags that don't appear in the target
    // sqrt keeps many small irrelevant tags from killing the score
    const unmatchedTags = subTags.filter(t => !targetMap.has(t.tag.en));
    const rawPenalty = unmatchedTags.reduce((sum, t) => sum + t.confidence, 0) / subTags.length;
    const softPenalty = Math.sqrt(rawPenalty) * 2;

    return Math.max(0, similarity - softPenalty);
}

function calculateSpeedBonus(openedAt, deadline) {
    if (!openedAt || !deadline) return 0;

    const now = Date.now();
    const open = new Date(openedAt).getTime();
    const close = new Date(deadline).getTime();
    const window = close - open;

    if (window <= 0) return 0;

    const timeLeft = close - now;
    const ratio = Math.max(0, timeLeft / window);

    // Square root curve — even late submissions get something, but early is rewarded
    return Math.sqrt(ratio) * 100;
}

async function getTagsFromBuffer(buffer) {
    const form = new FormData();
    form.append('image', buffer, {
        filename: 'image.jpg',
        contentType: 'image/jpeg'
    });

    const url = process.env.USE_FAKE_IMAGE_API === 'true'
        ? process.env.IMAGE_FAKE_URL
        : IMAGGA_URL;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: buildAuthHeader(),
            ...form.getHeaders()
        },
        body: form
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Image API error: ${JSON.stringify(data)}`);
    }

    return data.result.tags;
}

async function getTagsFromUrl(imageUrl) {
    const response = await fetch(imageUrl);

    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const buffer = await response.buffer();
    return getTagsFromBuffer(buffer);
}

async function scoreImage(imageUrl, targetTags, openedAt, deadline) {
    const submissionTags = await getTagsFromUrl(imageUrl);

    const similarity = calculateSimilarity(submissionTags, targetTags);
    const speedBonus = calculateSpeedBonus(openedAt, deadline);

    const finalScore = Math.min(100, Math.max(0, similarity * 0.7 + speedBonus * 0.3));

    return {
        submissionTags,
        similarity,
        speedBonus,
        finalScore
    };
}

module.exports = {
    scoreImage
};