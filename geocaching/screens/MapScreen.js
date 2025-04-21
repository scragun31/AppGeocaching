import React, { useEffect, useState, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import jwtDecode from 'jwt-decode';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  Button
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/config';

export default function MapScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [userMarker, setUserMarker] = useState(null);
  const [geocaches, setGeocaches] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [difficulty, setDifficulty] = useState('');
  const [description, setDescription] = useState('');
  const mapRef = useRef();
  const [editingCacheId, setEditingCacheId] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [selectedCache, setSelectedCache] = useState(null);
  const [foundCaches, setFoundCaches] = useState([]);
  const justSelectedRef = useRef(false);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/users/me/found`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const ids = data.map(cache => cache._id); // on stocke juste les IDs trouvés
        setFoundCaches(ids);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
  
        if (token) {
          const decoded = decodeJWT(token);
          setUserEmail(decoded.email);
        }
      } catch (err) {
        console.error("❌ Erreur lors du décodage du token :", err.message);
      } finally {
        setUserLoaded(true);
      }
    })();
  }, []);  


  // Initialiser la localisation
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Erreur", "Permission de localisation refusée");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      fetchGeocaches();
    })();
  }, []);

  // Suivre la position en temps réel
  useEffect(() => {
    const watch = Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 1 },
      (loc) => setLocation(loc.coords)
    );
    return () => watch.then(sub => sub.remove());
  }, []);

  const fetchGeocaches = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/geocaches`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      const data = await res.json();
      setGeocaches(data);
    } catch (err) {
      console.error("Erreur chargement caches :", err);
    }
  };

  const decodeJWT = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (err) {
      console.error("❌ Erreur de décodage JWT maison :", err.message);
      return null;
    }
  };

  const handleSubmitCache = async () => {
    const token = await AsyncStorage.getItem('token');
  
    try {
      let res;
  
      if (editingCacheId) {
        // ✏️ Mode modification
        res = await fetch(`${API_BASE_URL}/api/geocaches/${editingCacheId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ difficulty, description })
        });
      } else {
        // ➕ Mode création
        const center = await mapRef.current.getCamera();
  
        res = await fetch(`${API_BASE_URL}/api/geocaches`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            coordinates: {
              type: "Point",
              coordinates: [center.center.longitude, center.center.latitude]
            },
            difficulty,
            description,
            photos: []
          })
        });
      }
  
      const data = await res.json();
  
      if (res.ok) {
        Alert.alert("Succès", editingCacheId ? "Cache modifiée !" : "Cache ajoutée !");
        fetchGeocaches();
        setPopupVisible(false);
        setDifficulty('');
        setDescription('');
        setAddMode(false);
        setEditingCacheId(null); // reset après modif
      } else {
        Alert.alert("Erreur", data.message);
      }
    } catch (err) {
      Alert.alert("Erreur", "Erreur réseau");
      console.error("Erreur soumission cache :", err);
    }
  };  

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear(); 
      setUserEmail(null);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }]
      });
    } catch (err) {
      console.error("Erreur logout :", err);
      Alert.alert("Erreur", "Impossible de se déconnecter correctement.");
    }
  };
  

  const handleCacheOptions = (cache) => {
    if (cache.creator?.email !== userEmail) return;
  
    Alert.alert(
      "Modifier ou supprimer cette cache ?",
      `Difficulté : ${cache.difficulty}`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            // ✅ Deuxième confirmation ici
            Alert.alert(
              "Confirmer la suppression",
              "Voulez-vous vraiment supprimer cette géocache ?",
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Supprimer",
                  style: "destructive",
                  onPress: () => deleteCache(cache._id)
                }
              ]
            );
          }
        },
        {
          text: "Modifier",
          onPress: () => openEditPopup(cache)
        }
      ]
    );
  };  
  
  const deleteCache = async (id) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/geocaches/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      const data = await res.json(); // même si res.ok === false, tu peux le lire

      if (res.ok) {
        Alert.alert("Supprimée", "Géocache supprimée.");
        fetchGeocaches(); // recharge
      } else {
        console.log("🔴 Réponse erreur DELETE :", data);
        Alert.alert("Erreur", data.message || "Impossible de supprimer cette cache.");
      }
    } catch (err) {
      console.error("Erreur suppression :", err);
    }
  };
  
  const openEditPopup = (cache) => {
    setEditingCacheId(cache._id);
    setDifficulty(String(cache.difficulty));
    setDescription(cache.description || '');
    setPopupVisible(true);
  };  

    const [menuVisible, setMenuVisible] = useState(false);
    const menuAnim = useRef(new Animated.Value(-150)).current;
    const toggleMenu = () => {
        setMenuVisible(!menuVisible);
        Animated.timing(menuAnim, {
          toValue: menuVisible ? -150 : 0, // cache ou affiche
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false
        }).start();
    };
      
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/leaderboard`);
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data);
        } else {
          Alert.alert("Erreur", "Impossible de charger le classement");
        }
      } catch (err) {
        console.error("Erreur leaderboard:", err);
      }
    };    

  if (!location) return <View style={styles.container}><Text>Chargement de la carte...</Text></View>;

  if (!location || !userLoaded) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }
  const isFound = selectedCache && foundCaches.includes(selectedCache._id);
  const isMine = selectedCache?.creator?.email === userEmail;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        onPress={() => {
          if (justSelectedRef.current) {
            // Ignore ce clic (il venait du marker)
            justSelectedRef.current = false;
            return;
          }
          setSelectedCache(null); // Vrai clic sur la map
        }}
        showsUserLocation
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {geocaches.map((cache, index) => {
          const [lng, lat] = cache.coordinates.coordinates;
          return (
            <Marker
              key={index}
              coordinate={{ latitude: lat, longitude: lng }}
              pinColor={
                foundCaches.includes(cache._id)
                  ? 'blue'
                  : cache.creator?.email === userEmail
                    ? 'green'
                    : 'red'
              }
              onPress={() => {  
                  justSelectedRef.current = true;
                  handleCacheOptions(cache);
                  setSelectedCache(cache);
                }
              }
              title={`Difficulté : ${cache.difficulty}`}
              description={cache.description}
            />
          );
        })}
      </MapView>

      {/* + au centre */}
      {addMode && (
        <View style={styles.centerMarker}>
          <Text style={{ fontSize: 32 }}>+</Text>
        </View>
      )}

      {/* Bouton + */}
        <TouchableOpacity style={styles.addButton} onPress={() => setAddMode(!addMode)}>
        <Text style={{ fontSize: 32 }}>+</Text>
        </TouchableOpacity>

      {addMode && (
        <TouchableOpacity style={styles.validateButton} onPress={() => setPopupVisible(true)}>
          <Text style={{ color: 'white' }}>Valider la géocache</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
        <Text style={{ fontSize: 20 }}>☰</Text>
      </TouchableOpacity>

      {selectedCache && !isMine && (
        !isFound ? (
          <TouchableOpacity
            style={styles.foundButton}
            onPress={() => {
              Alert.alert(
                "Ajouter cette cache ?",
                "Souhaitez-vous marquer cette cache comme trouvée ?",
                [
                  { text: "Annuler", style: "cancel" },
                  {
                    text: "Confirmer",
                    onPress: async () => {
                      const token = await AsyncStorage.getItem('token');
                      const res = await fetch(`${API_BASE_URL}/api/users/me/found/${selectedCache._id}`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` }
                      });
            
                      if (res.ok) {
                        setFoundCaches(prev => [...prev, selectedCache._id]);
                        Alert.alert("✅", "Cache marquée comme trouvée !");
                      }
                    }
                  }
                ]
              );
            }}            
          >
            <Text style={{ fontSize: 24, color: 'white' }}>✔️</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.foundButton, { backgroundColor: 'red' }]}
            onPress={() => {
              Alert.alert(
                "Retirer cette cache ?",
                "Voulez-vous vraiment retirer cette cache de vos trouvées ?",
                [
                  { text: "Annuler", style: "cancel" },
                  {
                    text: "Confirmer",
                    style: "destructive",
                    onPress: async () => {
                      const token = await AsyncStorage.getItem('token');
                      const res = await fetch(`${API_BASE_URL}/api/users/me/found/${selectedCache._id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` }
                      });
            
                      if (res.ok) {
                        setFoundCaches(prev => prev.filter(id => id !== selectedCache._id));
                        Alert.alert("❌", "Cache retirée des trouvées.");
                      }
                    }
                  }
                ]
              );
            }}            
          >
            <Text style={{ fontSize: 30, color: 'white' }}>X</Text>
          </TouchableOpacity>
        )
      )}

      <Animated.View style={[styles.menuContainer, { top: menuAnim }]}>
      <TouchableOpacity onPress={() => { toggleMenu(); handleLogout(); }}>
          <Text style={styles.menuItem}>Se déconnecter</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={async () => {
          toggleMenu();
          await fetchLeaderboard();
          setLeaderboardVisible(true);
        }}>
          <Text style={styles.menuItem}>Classement</Text>
      </TouchableOpacity>
      </Animated.View>

      {/* Popup ajout cache */}
      <Modal visible={popupVisible} animationType="slide" transparent>
        <View style={styles.popup}>
          <TouchableOpacity style={styles.close} onPress={() => setPopupVisible(false)}>
            <Text style={{ fontSize: 20 }}>×</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Ajouter une géocache</Text>

          {/* Label difficulté */}
          <Text style={styles.label}>Difficulté (1 à 5) :</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex : 3"
            keyboardType="numeric"
            maxLength={1}
            value={difficulty}
            onChangeText={(text) => {
              const numeric = text.replace(/[^1-5]/g, '');
              setDifficulty(numeric);
            }}
          />

          {/* Label description */}
          <Text style={styles.label}>Description :</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            multiline
            placeholder="Ex : sous le banc près de l'arbre..."
            value={description}
            onChangeText={setDescription}
          />

          <Button title="Valider" onPress={handleSubmitCache} />
        </View>
      </Modal>
      
      <Modal visible={leaderboardVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.leaderboardModal}>
            <TouchableOpacity style={styles.close} onPress={() => setLeaderboardVisible(false)}>
              <Text style={{ fontSize: 20 }}>×</Text>
            </TouchableOpacity>
            <Text style={styles.title}>🏆 Classement des utilisateurs</Text>
            {leaderboard.map((user, index) => (
              <Text key={index} style={{ fontSize: 16, marginVertical: 4 }}>
                {index + 1}. {user.email} – {user.count} caches
              </Text>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: 'lightgreen',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,  // important pour le 2e point
    borderColor: 'black',
    borderWidth: 2,  // <-- ✅ bordure noire
  },
  menuButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'lightgray',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, // <-- ✅ plus haut que tout
    elevation: 10,
    borderColor: 'black',
    borderWidth: 2
  },
  validateButton: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    transform: [{ translateX: -80 }],
    backgroundColor: 'blue',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    zIndex: 10,
  },
  centerMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -10,
    marginTop: -20,
    zIndex: 10,
  },
  popup: {
    marginTop: '40%',
    marginHorizontal: '10%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 10,
    shadowColor: '#000',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 10,
  },  
  close: {
    position: 'absolute',
    top: 10,
    right: 15,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#eee',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    zIndex: 5,  // moins élevé
    elevation: 5,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  
  menuItem: {
    fontSize: 18,
    marginBottom: 15,
  },
  foundButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    backgroundColor: 'lightblue',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,  // important pour le 2e point
    borderColor: 'black',
    borderWidth: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  leaderboardModal: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
    elevation: 10,
  },  
});
