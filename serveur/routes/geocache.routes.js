const express = require('express');
const router = express.Router();
const Geocache = require('../models/geocache.model');
const auth = require('../middleware/auth.middleware');

// Ajouter une géocache
router.post('/', auth, async (req, res) => {
  const { coordinates, difficulty, description, photos } = req.body;

  if (!coordinates || !difficulty) {
    return res.status(400).json({ message: 'Champs requis manquants' });
  }

  try {
    const newCache = await Geocache.create({
      coordinates,
      difficulty,
      description,
      photos,
      creator: req.userId
    });

    res.status(201).json(newCache);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la création', error: err.message });
  }
});

// Récupérer toutes les géocaches
router.get('/', async (req, res) => {
  try {
    const caches = await Geocache.find().populate('creator', 'email');
    res.json(caches);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération', error: err.message });
  }
});

// Modifier une géocache (seulement par son créateur)
router.put('/:id', auth, async (req, res) => {
  try {
    const cache = await Geocache.findById(req.params.id);
    if (!cache) return res.status(404).json({ message: 'Géocache non trouvée' });

    if (cache.creator.toString() !== req.userId)
      return res.status(403).json({ message: 'Non autorisé' });

    Object.assign(cache, req.body);
    await cache.save();

    res.json(cache);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour', error: err.message });
  }
});

// Supprimer une géocache (par son créateur uniquement)
router.delete('/:id', auth, async (req, res) => {
  try {
    const cache = await Geocache.findById(req.params.id).populate('creator', 'email');

    if (!cache) return res.status(404).json({ message: 'Géocache non trouvée' });

    if (cache.creator?.email !== req.email) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await Geocache.findByIdAndDelete(req.params.id); // ✅ ici la vraie suppression
    res.json({ message: 'Géocache supprimée' });
  } catch (err) {
    console.error("💥 Erreur serveur DELETE:", err);
    res.status(500).json({ message: 'Erreur lors de la suppression', error: err.message });
  }
});

module.exports = router;
