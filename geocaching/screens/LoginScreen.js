import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/config';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Vérifie s'il y a déjà un token pour auto-rediriger
  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/check`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          navigation.navigate('Map'); // Redirige vers MapScreen
        }
      } catch (err) {
        console.error("Erreur token :", err);
      }
    };
    checkToken();
  }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        await AsyncStorage.setItem('token', data.token);
        navigation.navigate('Map');
      } else {
        Alert.alert("Erreur", data.message || "Échec de connexion");
      }
    } catch (err) {
      console.error("Erreur réseau :", err);
      Alert.alert("Erreur", "Problème de connexion au serveur");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Se connecter" onPress={handleLogin} />
      <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
        Créer un compte
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'lightblue',
  },
  title: {
    fontSize: 26,
    marginBottom: 20,
    textAlign: 'center'
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 10,
    borderRadius: 5
  },
  link: {
    marginTop: 15,
    color: 'blue',
    textAlign: 'center'
  }
});
