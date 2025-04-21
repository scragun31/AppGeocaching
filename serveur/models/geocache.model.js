const mongoose = require('mongoose');

const geocacheSchema = new mongoose.Schema({
  coordinates: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  difficulty: { type: Number, required: true },
  description: String,
  photos: [String],
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

geocacheSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Geocache', geocacheSchema);
