const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  foundCaches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Geocache' }],
  avatarUrl: { type: String } // optionnel pour l’extension avatar
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
