const Target = require("../models/Target");

exports.createTarget = async (req, res) => {
  try {

    const { title, description, locationName, lat, lng, radius, deadline } = req.body;

    const app_url = process.env.APP_URL
    const imageUrl = `${app_url}/uploads/${req.file.filename}`;
    const target = new Target({
      ownerId: req.user.userId,
      title,
      description,
      locationName,
      coordinates: {
        lat,
        lng
      },
      radius,
      deadline,
      imageUrl
    });

    await target.save();

    res.status(201).json(target);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTargets = async (req, res) => {
  try {

    const targets = await Target.find();

    res.json(targets);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.deleteTarget = async (req, res) => {
  try {

    const target = await Target.findById(req.params.id);

    if (!target) {
      return res.status(404).json({ error: "Target not found" });
    }

    if (target.ownerId !== req.user.userId) {
      return res.status(403).json({ error: "Not allowed" });
    }

    await Target.findByIdAndDelete(req.params.id);

    res.json({ message: "Target deleted" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};