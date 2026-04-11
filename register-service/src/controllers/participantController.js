const Participant = require("../models/participant");
const ClosedTarget = require("../models/ClosedTarget");
const { publishEvent } = require("../services/rabbitService");

exports.joinTarget = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { targetId } = req.body;

    if (!targetId) {
      return res.status(400).json({ error: "targetId required" });
    }

    // check if registration is closed for this target
    const closed = await ClosedTarget.findOne({ targetId });
    if (closed) {
      return res.status(400).json({ error: "Registration is closed for this target" });
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

exports.getMyParticipants = async (req, res) => {
  const userId = req.headers['x-user-id'];

  const data = await Participant.find({ userId });
  res.json(data);
};