# NFCryptoBreak v11.0 - Pocket Proxmark

**Advanced NFC Security Research Tool** built with React Native and Expo

![Version](https://img.shields.io/badge/version-11.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Android-brightgreen)

## 🎯 Overview

NFCryptoBreak v11.0 is a professional-grade NFC security research tool for Android devices. It combines NFC tag reading, AES encryption/decryption, and advanced cryptographic analysis in a single mobile application.

### Key Features

✅ **NFC Tag Reading**
- Real-time NFC tag detection and parsing
- Support for multiple NFC technologies (NFC-A, NFC-B, etc.)
- NDEF message parsing with text and URI extraction
- Tag history with up to 100 entries

✅ **AES Encryption/Decryption**
- Multiple cipher modes: ECB, CBC, CTR, OFB, CFB
- Support for 128, 192, and 256-bit keys
- Automatic format detection (HEX, Base64, UTF-8)
- Real-time encryption/decryption with error handling

✅ **Cryptographic Operations**
- Key generation (128, 192, 256-bit)
- IV generation for block cipher modes
- SHA-256 and MD5 hashing
- PBKDF2 key derivation

✅ **User Interface**
- Dark theme optimized for security research
- Real-time operation history
- Haptic feedback for all interactions
- Responsive design for all screen sizes

## 📋 Requirements

### System Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **Android SDK**: API level 21+
- **Android Device**: With NFC hardware

### Development Tools
```bash
npm install -g expo-cli
npm install -g eas-cli
```

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/Nero0art/NFCryptoBreak.git
cd NFCryptoBreak
npm install
# or
pnpm install
```

### 2. Install Dev Client

```bash
npx expo install expo-dev-client
```

### 3. Run Development Server

```bash
npm start
# or
pnpm start
```

### 4. Build for Android

**Option A: Using EAS (Recommended)**
```bash
eas build --platform android --profile preview
```

**Option B: Local Build**
```bash
npm run prebuild
npm run android
```

## 📱 Installation on Device

### Via EAS Build
1. Build the app: `eas build --platform android --profile preview`
2. Download the APK from EAS dashboard
3. Transfer to your Android device
4. Install: `adb install app.apk`

### Via Local Build
```bash
npm run android
```

## 🔧 Configuration

### app.json
Main configuration file with Expo and native settings:

```json
{
  "expo": {
    "name": "NFCryptoBreak",
    "version": "11.0.0",
    "android": {
      "package": "com.nfcryptobreak.app",
      "permissions": [
        "android.permission.NFC",
        "android.permission.INTERNET",
        "android.permission.USB_PERMISSION"
      ]
    }
  }
}
```

### Permissions
The app requires these Android permissions:
- `NFC` - For reading NFC tags
- `INTERNET` - For cloud operations
- `USB_PERMISSION` - For Proxmark3 support
- `VIBRATE` - For haptic feedback

## 💻 Development

### Project Structure

```
src/
├── App.tsx                 # Main application component
├── services/
│   ├── cryptoService.ts   # Cryptographic operations
│   └── nfcService.ts      # NFC operations
├── hooks/
│   ├── useNFC.ts          # NFC hook
│   └── useCrypto.ts       # Crypto hook
├── components/            # UI components
├── screens/              # Screen components
├── contexts/             # React contexts
├── utils/                # Utility functions
└── types/                # TypeScript types
```

### Services

#### CryptoService
Centralized cryptography operations:

```typescript
import { cryptoService, CipherMode } from './services/cryptoService';

// Encrypt
const result = cryptoService.encrypt({
  text: 'Hello World',
  key: 'your-hex-key-here',
  mode: CipherMode.CBC,
  keyFormat: KeyFormat.HEX
});

// Decrypt
const result = cryptoService.decrypt({
  text: 'cipher-text-here',
  key: 'your-hex-key-here',
  mode: CipherMode.CBC,
  keyFormat: KeyFormat.HEX
});

// Generate key
const key = cryptoService.generateKey(256); // 256-bit key
```

#### NFCService
NFC tag reading and parsing:

```typescript
import { nfcService } from './services/nfcService';

// Initialize
await nfcService.initialize();

// Start scanning
const result = await nfcService.startScanning();
if (result.success && result.tag) {
  console.log('Tag detected:', result.tag.id);
}

// Stop scanning
await nfcService.stopScanning();
```

### Hooks

#### useNFC
React hook for NFC operations:

```typescript
import { useNFC } from './hooks/useNFC';

const MyComponent = () => {
  const { isScanning, lastTag, error, startScanning } = useNFC();

  return (
    <View>
      <Button title="Scan" onPress={startScanning} />
      {lastTag && <Text>Tag: {lastTag.id}</Text>}
    </View>
  );
};
```

#### useCrypto
React hook for cryptographic operations:

```typescript
import { useCrypto } from './hooks/useCrypto';

const MyComponent = () => {
  const { encrypt, decrypt, result, isLoading } = useCrypto();

  return (
    <View>
      <Button 
        title="Encrypt" 
        onPress={() => encrypt('text', 'key')}
        disabled={isLoading}
      />
      {result?.success && <Text>{result.data}</Text>}
    </View>
  );
};
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## 🔐 Security Considerations

⚠️ **Important**: This tool is for authorized security research only.

- Only test NFC tags you own or have explicit permission to test
- Keep encryption keys secure
- Use VPN when connecting to cloud services
- Review all operation logs
- Do not use for unauthorized access

## 📚 API Reference

### CryptoService

#### encrypt(operation: CryptoOperation): CryptoResult
Encrypts data using AES.

**Parameters:**
- `text` (string): Plain text to encrypt
- `key` (string): Encryption key in hex format
- `iv` (string, optional): Initialization vector
- `mode` (CipherMode): Cipher mode (default: CBC)
- `keyFormat` (KeyFormat): Key format (default: HEX)

**Returns:** `CryptoResult` with success status and encrypted data

#### decrypt(operation: CryptoOperation): CryptoResult
Decrypts data using AES.

**Parameters:** Same as encrypt

**Returns:** `CryptoResult` with success status and decrypted data

#### generateKey(length: 128 | 192 | 256): string
Generates a random key.

**Parameters:**
- `length` (number): Key length in bits (default: 256)

**Returns:** Hex string of random key

### NFCService

#### initialize(): Promise<NFCResult>
Initializes NFC manager.

**Returns:** `NFCResult` with success status

#### startScanning(): Promise<NFCResult>
Starts scanning for NFC tags.

**Returns:** `NFCResult` with detected tag data

#### stopScanning(): Promise<NFCResult>
Stops NFC scanning.

**Returns:** `NFCResult` with success status

#### registerTagListener(callback): void
Registers a listener for tag detection events.

**Parameters:**
- `callback` (function): Called when tag is detected

## 🐛 Troubleshooting

### NFC Not Working
1. Ensure NFC is enabled in device settings
2. Check Android version (requires 4.4+)
3. Verify app permissions in Settings
4. Restart the app

### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Or with pnpm
pnpm install --force
```

### EAS Build Fails
```bash
# Clear EAS cache
eas build --platform android --profile preview --clear-cache

# Check credentials
eas auth:whoami
```

## 📖 Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [NFC Manager Library](https://github.com/revtel/react-native-nfc-manager)
- [CryptoJS Documentation](https://cryptojs.gitbook.io/docs/)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This software is provided for authorized security research and educational purposes only. Users are responsible for ensuring they have proper authorization before testing any NFC systems. The authors are not liable for misuse or unauthorized access.

## 👨‍💻 Author

**NFCryptoBreak Team**
- GitHub: [@Nero0art](https://github.com/Nero0art)

## 🙏 Acknowledgments

- React Native and Expo communities
- NFC Manager library maintainers
- CryptoJS library developers

---

**Version:** 11.0.0  
**Last Updated:** May 2026  
**Status:** Production Ready ✅
