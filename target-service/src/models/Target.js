const mongoose = require("mongoose");

const targetSchema = new mongoose.Schema({
  ownerId: {
    type: String,
    required: true
  },

  title: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  locationName: {
    type: String
  },

  coordinates: {
    lat: Number,
    lng: Number
  },

  radius: {
    type: Number,
    default: 100
  },

  imageUrl: {
    type: String,
    required: true
  },

  deadline: {
    type: Date,
    required: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Target", targetSchema);