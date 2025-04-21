# AppGeocaching

**cette app peut etre lancée via expo, pour ce faire :**

- lancer "nodemon index.js" dans ./serveur
- lancer "cloudflared tunnel --url http://localhost:5001" pour lier la DB locale à un serveur 
- copier l'url donnée à la place de celle présente dans le fichier ./geocaching/utils/config.js
- lancer "sudo npx expo start" dans ./geocaching

Toutes les fonctionnalitées furent implémentées par Laurent Ducros (seule membre de son groupe).

## Fonctionnalités implémentées

- **Inscription et connexion** à une db MongoDB
- **Carte interactive** avec géolocalisation de l'utilisateur en temps réel
- **Ajout de géocaches** personnalisées avec difficulté (1 à 5) et description
- **Marquage des géocaches comme trouvées**
  - Apparition d’un bouton lors du clic sur une cache
  - Confirmation avant validation
  - Sauvegarde persistante côté backend
- **Suppression d’une cache trouvée**
  - Apparition d’un bouton ❌ si la cache est déjà trouvée
  - Confirmation avant suppression
- **Affichage dynamique** des caches selon leur statut :
  - Vert : caches créées par l’utilisateur
  - Bleu : caches trouvées
  - Rouge : caches non trouvées par l’utilisateur
- **Système d'authentification JWT** :
  - Inscription / connexion avec email et mot de passe
  - Vérification et stockage sécurisé du token
  - Durée de chaque token de 24h
- **Suppression des géocaches** créées par l’utilisateur
  - Confirmation avant suppression
- **Modification des géocaches** personnelles
- **Classement des utilisateurs (leaderboard)**
  - Accessible depuis le menu
  - Trié par nombre de caches trouvées
- **Stockage MongoDB** côté serveur
  - Géocaches
  - Utilisateurs
  - Caches trouvées par utilisateur
- **Compatible mobile via Expo (React Native)**
