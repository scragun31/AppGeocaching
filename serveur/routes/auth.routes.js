const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth.middleware');

const User = require('../models/user.model');

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRATION = '24h';

// Inscription
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email déjà utilisé' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ email, passwordHash: hashedPassword });

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRATION }
    );

    res.status(201).json({
      token,
      expiresIn: TOKEN_EXPIRATION
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Utilisateur non trouvé' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Mot de passe invalide' });

    console.log("➡️ user.email dans /login :", user.email);
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });

    res.json({ token, expiresIn: TOKEN_EXPIRATION });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

module.exports = router;

router.get('/check', auth, (req, res) => {
  res.json({ message: 'Token valide', userId: req.userId });
});