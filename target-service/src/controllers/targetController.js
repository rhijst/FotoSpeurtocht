// src/controllers/target.controller.js
const Target = require("../models/Target");
const s3 = require("../config/minio");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const { publishEvent } = require("../services/rabbitService");


const bucketName = process.env.MINIO_BUCKET || "targets";

// ========================
// CREATE TARGET
// ========================
exports.createTarget = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // Only allow image files
    if (!file.mimetype.startsWith("image/")) {
      return res.status(400).json({ error: "Invalid file type" });
    }

    // Generate unique key for MinIO
    const key = `${uuidv4()}-${file.originalname}`;

    // Upload to MinIO
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    }));

    // Build public URL for the frontend
    const host = process.env.MINIO_HOST || "localhost:9000";
    const imageUrl = `http://${host}/${bucketName}/${key}`;

    // Save target to MongoDB
    const target = new Target({
      ownerId: req.headers['x-user-id'],
      title: req.body.title,
      description: req.body.description,
      locationName: req.body.locationName,
      coordinates: {
        lat: req.body.lat,
        lng: req.body.lng
      },
      radius: req.body.radius,
      deadline: req.body.deadline,
      imageUrl,
      imageKey: key // store key to delete the image later
    });

    await target.save();

    // Publish the event
    await publishEvent('events', 'target.created', {
      targetId: target._id,
      ownerId: req.headers['x-user-id'],
      deadline: target.deadline,
      imageURL: imageUrl
    });

    res.status(201).json(target);

  } catch (err) {
    console.error("Error creating target:", err);
    res.status(500).json({ error: err.message });
  }
};

// ========================
// GET ALL TARGETS
// ========================
exports.getTargets = async (req, res) => {
  try {
    const targets = await Target.find();

    const targetsForFrontend = targets.map(target => ({
      id: target._id,
      ownerId: target.ownerId,
      title: target.title,
      description: target.description,
      locationName: target.locationName,
      coordinates: target.coordinates,
      radius: target.radius,
      imageUrl: target.imageUrl,
      deadline: target.deadline,
      createdAt: target.createdAt,
      updatedAt: target.updatedAt
    }));

    res.json(targetsForFrontend);
  } catch (err) {
    console.error("Error fetching targets:", err);
    res.status(500).json({ error: err.message });
  }
};

// ========================
// DELETE TARGET
// ========================
exports.deleteTarget = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json({ error: "Target ID is required" });

    // Ensure id is a valid Mongo ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid Target ID format" });
    }

    const target = await Target.findById(id);
    if (!target) return res.status(404).json({ error: "Target not found" });

    // Check ownership
    if (target.ownerId.toString() !== req.headers['x-user-id']) {
      return res.status(403).json({ error: "Not allowed" });
    }

    // Delete image from MinIO
    if (target.imageKey) {
      await s3.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: target.imageKey
      }));
    }

    // Delete target from MongoDB
    await Target.findByIdAndDelete(id);

    res.json({ message: "Target and associated image deleted" });
  } catch (error) {
    console.error("Error deleting target:", error);
    res.status(500).json({ error: error.message });
  }
};