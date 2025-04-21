require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import des routes 
const authRoutes = require('./routes/auth.routes');
const geocacheRoutes = require('./routes/geocache.routes');
const userRoutes = require('./routes/user.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('Connexion à MongoDB réussie');
  app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error('Erreur de connexion à MongoDB :', err.message);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/geocaches', geocacheRoutes);
app.use('/api/users', userRoutes);

// Route racine
app.get('/', (req, res) => {
  res.send('Bienvenue sur l\'API Geocaching');
});

