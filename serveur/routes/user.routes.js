const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Geocache = require('../models/geocache.model');
const auth = require('../middleware/auth.middleware');

// Marquer une cache comme trouvée
router.post('/me/found/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const cacheId = req.params.id;

    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    if (!user.foundCaches.includes(cacheId)) {
      user.foundCaches.push(cacheId);
      await user.save();
    }

    res.status(200).json({ message: 'Cache marquée comme trouvée' });
  } catch (err) {
    console.error("Erreur POST /me/found :", err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Supprimer une cache trouvée
router.delete('/me/found/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const cacheId = req.params.id;

    user.foundCaches = user.foundCaches.filter(id => id.toString() !== cacheId);
    await user.save();

    res.status(200).json({ message: 'Cache retirée des trouvées' });
  } catch (err) {
    console.error("Erreur DELETE /me/found:", err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});


// Récupérer les caches trouvées
router.get('/me/found', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('foundCaches');

    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    res.json(user.foundCaches);
  } catch (err) {
    console.error("Erreur GET /me/found :", err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Classement des utilisateurs par nombre de caches trouvées
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find({}, 'email foundCaches')
      .lean()
      .sort({})

    const leaderboard = users
      .map(user => ({
        email: user.email,
        count: (user.foundCaches || []).length
      }))
      .sort((a, b) => b.count - a.count);

    res.json(leaderboard);
  } catch (err) {
    console.error("Erreur leaderboard:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});


module.exports = router;