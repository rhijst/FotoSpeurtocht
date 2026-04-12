const Participant = require("../models/participant");
const Submission = require("../models/Submission");
const { publishEvent } = require("../services/rabbitService");

const { v4: uuidv4 } = require("uuid");
const s3 = require("../config/minio");

const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
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
    const email = req.headers["x-user-email"];
    const { participationId, targetId } = req.body;
    const participation = await Participant.findById(participationId);
    const targetOwnerId = participation?.targetOwnerId ?? null;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const existing = await Submission.findOne({ userId, targetId });

    if (existing) {

      // If already has image → block
      if (existing.imageUrl) {
        return res.status(400).json({ error: "You already submitted for this target" });
      }

      // If NO image → allow re-upload
      const key = `${uuidv4()}-${file.originalname}`;

      await s3.send(new PutObjectCommand({
        Bucket: process.env.MINIO_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      }));

      const imageUrl = `http://${process.env.MINIO_HOST}/${process.env.MINIO_BUCKET}/${key}`;

      existing.imageUrl = imageUrl;
      existing.status = "PENDING";
      existing.submittedAt = new Date();
      if (!existing.targetOwnerId && targetOwnerId) existing.targetOwnerId = targetOwnerId;

      await existing.save();

      // publish event again
      await publishEvent("events", "participant.submitted", {
        submissionId: existing._id,
        participationId: existing.participationId,
        userId,
        targetId,
        imageUrl
      });

      return res.json(existing);
    }

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
      targetOwnerId,
      imageUrl
    });

    // Event
    await publishEvent("events", "participant.submitted", {
      submissionId: submission._id,
      email,
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

exports.getMySubmissions = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    const submissions = await Submission.find({ userId });

    const formatted = submissions.map(sub => ({
      id: sub._id,
      targetId: sub.targetId,
      participationId: sub.participationId,
      imageUrl: sub.imageUrl,
      status: sub.status,
      score: sub.score,
      submittedAt: sub.submittedAt
    }));

    res.json(formatted);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSubmissionsOnMyTargets = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    const submissions = await Submission.find({ targetOwnerId: userId });

    const formatted = submissions.map(sub => ({
      id: sub._id,
      targetId: sub.targetId,
      participationId: sub.participationId,
      submittedBy: sub.userId,
      imageUrl: sub.imageUrl,
      status: sub.status,
      score: sub.score,
      submittedAt: sub.submittedAt
    }));

    res.json(formatted);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSubmission = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { id } = req.params;

    const submission = await Submission.findById(id);

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // allow submission owner OR the target owner to delete
    const isSubmissionOwner = submission.userId === userId;
    const isTargetOwner = submission.targetOwnerId && submission.targetOwnerId === userId;
    if (!isSubmissionOwner && !isTargetOwner) {
      return res.status(403).json({ error: "Not allowed" });
    }

    if (submission.imageUrl) {
      const imageKey = submission.imageUrl.split("/").pop();

      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.MINIO_BUCKET,
        Key: imageKey
      }));
    }

    // delete from DB
    await Submission.findByIdAndDelete(id);

    res.json({ message: "Submission deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removePhoto = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { id } = req.params;

    const submission = await Submission.findById(id);

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    if (submission.userId !== userId) {
      return res.status(403).json({ error: "Not allowed" });
    }

    if (!submission.imageUrl) {
      return res.status(400).json({ error: "No photo to remove" });
    }

    const imageKey = submission.imageUrl.split("/").pop();

    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.MINIO_BUCKET,
      Key: imageKey
    }));

    submission.imageUrl = null;
    submission.status = "PENDING"; // reset
    await submission.save();

    res.json({ message: "Photo removed, you can upload again" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};