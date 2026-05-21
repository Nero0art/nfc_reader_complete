/**
 * NFCryptoBreak v11.0 - Main Application
 * Pocket Proxmark: Advanced NFC Security Research Tool
 */

import React, { useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  Text,
  Pressable,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNFC } from './hooks/useNFC';
import { useCrypto } from './hooks/useCrypto';
import { CipherMode } from './services/cryptoService';

const App = () => {
  const nfc = useNFC();
  const crypto = useCrypto();

  const [cipherText, setCipherText] = React.useState('');
  const [key, setKey] = React.useState('');
  const [iv, setIv] = React.useState('');
  const [mode, setMode] = React.useState<CipherMode>(CipherMode.CBC);

  useEffect(() => {
    if (!nfc.isAvailable) {
      Alert.alert('NFC Not Available', 'This device does not support NFC');
    }
  }, [nfc.isAvailable]);

  const handleStartScanning = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await nfc.startScanning();
  };

  const handleDecrypt = async () => {
    if (!cipherText.trim() || !key.trim()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Please enter cipher text and key');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await crypto.decrypt(cipherText, key, iv, mode);

    if (crypto.result?.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Decryption completed');
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', crypto.result?.error || 'Decryption failed');
    }
  };

  const handleEncrypt = async () => {
    if (!cipherText.trim() || !key.trim()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Please enter text and key');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await crypto.encrypt(cipherText, key, iv, mode);

    if (crypto.result?.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Encryption completed');
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', crypto.result?.error || 'Encryption failed');
    }
  };

  const handleGenerateKey = () => {
    const newKey = crypto.generateKey(256);
    setKey(newKey);
    Alert.alert('Key Generated', 'A new 256-bit key has been generated');
  };

  const handleGenerateIV = () => {
    const newIV = crypto.generateIV();
    setIv(newIV);
    Alert.alert('IV Generated', 'A new IV has been generated');
  };

  const handleCopyResult = () => {
    if (crypto.result?.data) {
      // In a real app, use react-native-clipboard
      Alert.alert('Copied', crypto.result.data);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🔐 NFCryptoBreak</Text>
          <Text style={styles.subtitle}>v11.0 - Pocket Proxmark</Text>
        </View>

        {/* NFC Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📡 NFC Scanner</Text>
          
          {!nfc.isAvailable && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ NFC not available on this device</Text>
            </View>
          )}

          {nfc.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {nfc.error}</Text>
            </View>
          )}

          {nfc.isScanning && (
            <View style={styles.scanningBox}>
              <ActivityIndicator color="#4caf50" size="large" />
              <Text style={styles.scanningText}>Scanning for NFC tags...</Text>
            </View>
          )}

          {nfc.lastTag && (
            <View style={styles.tagBox}>
              <Text style={styles.tagLabel}>Last Tag Detected:</Text>
              <Text style={styles.tagValue}>{nfc.lastTag.id}</Text>
              <Text style={styles.tagType}>Type: {nfc.lastTag.type}</Text>
              <Text style={styles.tagTime}>{new Date(nfc.lastTag.timestamp).toLocaleTimeString()}</Text>
            </View>
          )}

          <Pressable
            onPress={handleStartScanning}
            disabled={nfc.isScanning || !nfc.isAvailable}
            style={[styles.button, !nfc.isAvailable && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>
              {nfc.isScanning ? 'Scanning...' : 'Start NFC Scan'}
            </Text>
          </Pressable>

          {nfc.history.length > 0 && (
            <Pressable
              onPress={nfc.clearHistory}
              style={[styles.button, styles.buttonSecondary]}
            >
              <Text style={styles.buttonText}>Clear History ({nfc.history.length})</Text>
            </Pressable>
          )}
        </View>

        {/* Encryption/Decryption Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔓 AES Encryption/Decryption</Text>

          <TextInput
            placeholder="Enter text or cipher (hex)"
            multiline
            value={cipherText}
            onChangeText={setCipherText}
            editable={!crypto.isLoading}
            style={[styles.input, { minHeight: 80 }]}
            placeholderTextColor="#666"
          />

          <TextInput
            placeholder="Enter key (hex)"
            value={key}
            onChangeText={setKey}
            editable={!crypto.isLoading}
            style={styles.input}
            placeholderTextColor="#666"
          />

          <View style={styles.keyButtonRow}>
            <Pressable onPress={handleGenerateKey} style={[styles.button, styles.smallButton]}>
              <Text style={styles.buttonText}>Gen Key</Text>
            </Pressable>
            <TextInput
              placeholder="IV (optional, hex)"
              value={iv}
              onChangeText={setIv}
              editable={!crypto.isLoading}
              style={[styles.input, styles.ivInput]}
              placeholderTextColor="#666"
            />
            <Pressable onPress={handleGenerateIV} style={[styles.button, styles.smallButton]}>
              <Text style={styles.buttonText}>Gen IV</Text>
            </Pressable>
          </View>

          {/* Mode Selector */}
          <View style={styles.modeSelector}>
            <Text style={styles.modeLabel}>Cipher Mode:</Text>
            <View style={styles.modeButtons}>
              {[CipherMode.ECB, CipherMode.CBC, CipherMode.CTR].map(m => (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  style={[
                    styles.modeButton,
                    mode === m && styles.modeButtonActive
                  ]}
                >
                  <Text style={[
                    styles.modeButtonText,
                    mode === m && styles.modeButtonTextActive
                  ]}>
                    {m}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonRow}>
            <Pressable
              onPress={handleEncrypt}
              disabled={crypto.isLoading}
              style={[styles.button, styles.encryptButton, crypto.isLoading && styles.buttonDisabled]}
            >
              {crypto.isLoading && <ActivityIndicator color="white" style={{ marginRight: 8 }} />}
              <Text style={styles.buttonText}>Encrypt</Text>
            </Pressable>

            <Pressable
              onPress={handleDecrypt}
              disabled={crypto.isLoading}
              style={[styles.button, styles.decryptButton, crypto.isLoading && styles.buttonDisabled]}
            >
              {crypto.isLoading && <ActivityIndicator color="white" style={{ marginRight: 8 }} />}
              <Text style={styles.buttonText}>Decrypt</Text>
            </Pressable>
          </View>

          {/* Result Display */}
          {crypto.result && (
            <View style={[
              styles.resultBox,
              crypto.result.success ? styles.resultSuccess : styles.resultError
            ]}>
              <Text style={styles.resultLabel}>
                {crypto.result.success ? '✅ Result:' : '❌ Error:'}
              </Text>
              <Text style={styles.resultValue}>{crypto.result.data || crypto.result.error}</Text>
              {crypto.result.success && (
                <Pressable onPress={handleCopyResult} style={styles.copyButton}>
                  <Text style={styles.copyButtonText}>Copy Result</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* History Card */}
        {crypto.history.length > 0 && (
          <View style={styles.card}>
            <View style={styles.historyHeader}>
              <Text style={styles.cardTitle}>📋 Operation History</Text>
              <Pressable onPress={crypto.clearHistory}>
                <Text style={styles.clearButton}>Clear</Text>
              </Pressable>
            </View>

            {crypto.history.slice(0, 5).map((item, idx) => (
              <View key={idx} style={styles.historyItem}>
                <Text style={styles.historyStatus}>
                  {item.success ? '✅' : '❌'} {item.success ? 'Success' : 'Failed'}
                </Text>
                <Text style={styles.historyTime}>
                  {new Date(item.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32
  },
  header: {
    marginBottom: 24,
    alignItems: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#999'
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12
  },
  errorBox: {
    backgroundColor: '#c62828',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12
  },
  errorText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12
  },
  scanningBox: {
    backgroundColor: '#1b5e20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center'
  },
  scanningText: {
    color: '#4caf50',
    fontWeight: 'bold',
    marginTop: 8
  },
  tagBox: {
    backgroundColor: '#1a237e',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12
  },
  tagLabel: {
    color: '#64b5f6',
    fontWeight: 'bold',
    fontSize: 11,
    marginBottom: 4
  },
  tagValue: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4
  },
  tagType: {
    color: '#90caf9',
    fontSize: 11,
    marginBottom: 2
  },
  tagTime: {
    color: '#666',
    fontSize: 10
  },
  button: {
    backgroundColor: '#1976d2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8
  },
  buttonSecondary: {
    backgroundColor: '#ff6b6b'
  },
  smallButton: {
    flex: 0.2,
    paddingHorizontal: 8,
    marginBottom: 0
  },
  encryptButton: {
    backgroundColor: '#1976d2',
    flex: 1,
    marginRight: 8,
    marginBottom: 0
  },
  decryptButton: {
    backgroundColor: '#388e3c',
    flex: 1,
    marginBottom: 0
  },
  buttonDisabled: {
    opacity: 0.5
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    marginBottom: 10,
    fontFamily: 'monospace',
    fontSize: 12
  },
  ivInput: {
    flex: 1,
    marginHorizontal: 8,
    marginBottom: 0
  },
  keyButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  modeSelector: {
    marginBottom: 12
  },
  modeLabel: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 6,
    fontSize: 12
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 8
  },
  modeButton: {
    flex: 1,
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center'
  },
  modeButtonActive: {
    backgroundColor: '#1976d2'
  },
  modeButtonText: {
    color: '#999',
    fontWeight: 'bold',
    fontSize: 12
  },
  modeButtonTextActive: {
    color: '#fff'
  },
  resultBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12
  },
  resultSuccess: {
    backgroundColor: '#1b5e20'
  },
  resultError: {
    backgroundColor: '#b71c1c'
  },
  resultLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
    marginBottom: 6
  },
  resultValue: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 11,
    marginBottom: 8
  },
  copyButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 6,
    borderRadius: 4,
    alignItems: 'center'
  },
  copyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  clearButton: {
    color: '#ff6b6b',
    fontWeight: 'bold',
    fontSize: 12
  },
  historyItem: {
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1976d2',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  historyStatus: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12
  },
  historyTime: {
    color: '#999',
    fontSize: 10
  }
});

export default App;
