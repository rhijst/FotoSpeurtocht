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

    let score = 0;
    let matches = 0;

    for (const [tag, targetConf] of targetMap.entries()) {
        if (subMap.has(tag)) {
            const subConf = subMap.get(tag);

            const diff = Math.abs(targetConf - subConf);
            const similarity = Math.max(0, 100 - diff);

            // weight by importance of target tag
            score += similarity * (targetConf / 100);
            matches++;
        }
    }

    if (matches === 0) return 0;

    return score / matches;
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

async function scoreImage(imageUrl, targetTags) {
    const submissionTags = await getTagsFromUrl(imageUrl);

    const similarity = calculateSimilarity(submissionTags, targetTags);
    const speedBonus = 10;

    const finalScore = similarity * 0.8 + speedBonus * 0.2;

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