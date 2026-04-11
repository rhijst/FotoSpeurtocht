const Participant = require("../models/participant");
const ClosedTarget = require("../models/ClosedTarget");
const Submission = require("../models/Submission");
const { publishEvent } = require("../services/rabbitService");

const { v4: uuidv4 } = require("uuid");

const s3 = require("../config/minio");
const { PutObjectCommand } = require("@aws-sdk/client-s3");


exports.joinTarget = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { targetId } = req.body;

    if (!targetId) {
      return res.status(400).json({ error: "targetId required" });
    }

    // prevent duplicates
    const exists = await Participant.findOne({ userId, targetId });
    if (exists) {
      return res.status(400).json({ error: "Already requested/joined" });
    }

    const participation = await Participant.create({
      userId,
      targetId,
      status: "PENDING"
    });

    // New event
    await publishEvent("events", "participant.join.requested", {
      participationId: participation._id,
      userId,
      targetId
    });

    res.status(201).json(participation);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.submitTarget = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { participationId, targetId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // upload image
    const key = `${uuidv4()}-${file.originalname}`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.MINIO_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    }));

    const imageUrl = `http://${process.env.MINIO_HOST}/${process.env.MINIO_BUCKET}/${key}`;

    // save submission
    const submission = await Submission.create({
      participationId,
      userId,
      targetId,
      imageUrl
    });

    // Event
    await publishEvent("events", "participant.submitted", {
      submissionId: submission._id,
      participationId,
      userId,
      targetId,
      imageUrl
    });

    res.status(201).json(submission);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getMyParticipants = async (req, res) => {
  const userId = req.headers['x-user-id'];

  const data = await Participant.find({ userId });
  res.json(data);
};