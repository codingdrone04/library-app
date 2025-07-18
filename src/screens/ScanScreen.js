import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Camera, CameraView } from 'expo-camera';

function ScanScreen() {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      console.log('Permission status:', status);
    } catch (error) {
      console.error('Permission error:', error);
      setHasPermission(false);
    }
  };

  const handleBarcodeScanned = async ({ type, data }) => {
    setScanned(true);
    console.log('📱 Code scanné:', data, 'Type:', type);
    
    try {
      const cleanISBN = data.replace(/[-\s]/g, '');
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}`);
      const result = await response.json();
      
      if (result.items && result.items.length > 0) {
        const book = result.items[0].volumeInfo;
        Alert.alert(
          '📚 Livre trouvé !',
          `Titre: ${book.title || 'Non disponible'}\nAuteur: ${(book.authors || ['Inconnu']).join(', ')}\nISBN: ${cleanISBN}`,
          [
            { text: 'Scanner encore', onPress: () => setScanned(false) },
            { text: 'Retour', onPress: () => navigation.goBack() }
          ]
        );
      } else {
        Alert.alert(
          '🔍 Livre non trouvé',
          `Aucun livre trouvé pour: ${cleanISBN}`,
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
      }
    } catch (error) {
      console.error('API Error:', error);
      Alert.alert(
        '📱 Code détecté',
        `Code: ${data}\nType: ${type}`,
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    }
  };

  // Affichage pendant la demande de permission
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Ionicons name="camera-outline" size={100} color="#5A9FD4" />
          <Text style={styles.title}>Scanner de codes-barres</Text>
          <Text style={styles.subtitle}>Demande de permission caméra...</Text>
        </View>
      </View>
    );
  }

  // Affichage si permission refusée
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Ionicons name="camera-off-outline" size={100} color="#FF6B35" />
          <Text style={styles.title}>Permission refusée</Text>
          <Text style={styles.subtitle}>Veuillez autoriser l'accès à la caméra</Text>
          
          <TouchableOpacity style={styles.testButton} onPress={getCameraPermissions}>
            <Text style={styles.testButtonText}>🔄 Redemander la permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Affichage avec caméra active
  return (
    <View style={styles.container}>
      {/* Header flottant */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.floatingBackButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
          <Text style={styles.floatingBackButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>

      {/* Caméra */}
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'],
        }}
      />

      {/* Overlay avec cadre de scan */}
      <View style={styles.overlay}>
        <View style={styles.scanFrame} />
        <Text style={styles.instruction}>📚 Scannez le code-barres d'un livre</Text>
        <Text style={styles.subInstruction}>L'app cherchera automatiquement le livre</Text>
        
        {scanned && (
          <View style={styles.scannedContainer}>
            <Text style={styles.scannedText}>🔍 Recherche en cours...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2A2A2A',
  },
  // Styles pour les écrans de permission
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 40,
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: '#5A9FD4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
    minWidth: 200,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Styles pour la caméra
  camera: {
    flex: 1,
  },
  floatingHeader: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  floatingBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  floatingBackButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#FF6B35',
    borderRadius: 20,
    backgroundColor: 'transparent',
    marginBottom: 30,
  },
  instruction: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    textAlign: 'center',
    marginBottom: 10,
  },
  subInstruction: {
    fontSize: 14,
    color: '#CCCCCC',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    textAlign: 'center',
  },
  scannedContainer: {
    position: 'absolute',
    bottom: 100,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 20,
  },
  scannedText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ScanScreen;