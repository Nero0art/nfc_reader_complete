/**
 * NFCryptoBreak v11.0 - Crypto Service
 * Centralized cryptography operations with robust error handling
 */

import CryptoJS from 'crypto-js';

export enum CipherMode {
  CBC = 'CBC',
  ECB = 'ECB',
  CTR = 'CTR',
  GCM = 'GCM',
  OFB = 'OFB',
  CFB = 'CFB'
}

export enum KeyFormat {
  HEX = 'hex',
  UTF8 = 'utf8',
  BASE64 = 'base64'
}

export interface CryptoResult {
  success: boolean;
  data?: string;
  error?: string;
  timestamp: number;
}

export interface CryptoOperation {
  text: string;
  key: string;
  iv?: string;
  mode: CipherMode;
  keyFormat: KeyFormat;
}

class CryptoService {
  /**
   * Validates input parameters for crypto operations
   */
  private validateInput(operation: CryptoOperation): { valid: boolean; error?: string } {
    if (!operation.text || operation.text.trim().length === 0) {
      return { valid: false, error: 'Text cannot be empty' };
    }

    if (!operation.key || operation.key.trim().length === 0) {
      return { valid: false, error: 'Key cannot be empty' };
    }

    const keyLength = operation.key.length;
    const validLengths = [16, 24, 32]; // 128, 192, 256 bits in hex
    
    if (operation.keyFormat === KeyFormat.HEX && !validLengths.includes(keyLength)) {
      return { 
        valid: false, 
        error: `Key must be 16, 24, or 32 hex characters (got ${keyLength})` 
      };
    }

    if (operation.mode !== CipherMode.ECB && !operation.iv) {
      return { valid: false, error: `IV is required for ${operation.mode} mode` };
    }

    return { valid: true };
  }

  /**
   * Converts key to CryptoJS WordArray
   */
  private parseKey(key: string, format: KeyFormat): CryptoJS.lib.WordArray {
    try {
      switch (format) {
        case KeyFormat.HEX:
          return CryptoJS.enc.Hex.parse(key);
        case KeyFormat.BASE64:
          return CryptoJS.enc.Base64.parse(key);
        case KeyFormat.UTF8:
        default:
          return CryptoJS.enc.Utf8.parse(key);
      }
    } catch (error) {
      throw new Error(`Failed to parse key with format ${format}`);
    }
  }

  /**
   * Encrypts data using AES
   */
  encrypt(operation: CryptoOperation): CryptoResult {
    const timestamp = Date.now();

    try {
      const validation = this.validateInput(operation);
      if (!validation.valid) {
        return { success: false, error: validation.error, timestamp };
      }

      const keyWords = this.parseKey(operation.key, operation.keyFormat);
      
      let ivWords: CryptoJS.lib.WordArray | undefined;
      if (operation.iv && operation.mode !== CipherMode.ECB) {
        ivWords = this.parseKey(operation.iv, operation.keyFormat);
      }

      const modeObj = this.getModeObject(operation.mode);

      const encrypted = CryptoJS.AES.encrypt(operation.text, keyWords, {
        iv: ivWords,
        mode: modeObj,
        padding: CryptoJS.pad.Pkcs7
      });

      return {
        success: true,
        data: encrypted.toString(),
        timestamp
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Encryption failed: ${error.message}`,
        timestamp
      };
    }
  }

  /**
   * Decrypts data using AES
   */
  decrypt(operation: CryptoOperation): CryptoResult {
    const timestamp = Date.now();

    try {
      const validation = this.validateInput(operation);
      if (!validation.valid) {
        return { success: false, error: validation.error, timestamp };
      }

      const keyWords = this.parseKey(operation.key, operation.keyFormat);
      
      let ivWords: CryptoJS.lib.WordArray | undefined;
      if (operation.iv && operation.mode !== CipherMode.ECB) {
        ivWords = this.parseKey(operation.iv, operation.keyFormat);
      }

      const modeObj = this.getModeObject(operation.mode);

      // Try to parse ciphertext as different formats
      let cipherWords: CryptoJS.lib.WordArray;
      try {
        cipherWords = CryptoJS.enc.Base64.parse(operation.text);
      } catch {
        cipherWords = CryptoJS.enc.Hex.parse(operation.text);
      }

      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: cipherWords } as CryptoJS.lib.CipherParams,
        keyWords,
        {
          iv: ivWords,
          mode: modeObj,
          padding: CryptoJS.pad.Pkcs7
        }
      );

      let plaintext = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!plaintext || plaintext.length === 0) {
        plaintext = decrypted.toString(CryptoJS.enc.Hex);
      }

      if (!plaintext || plaintext.length === 0) {
        return {
          success: false,
          error: 'Decryption failed: Invalid key or corrupted data',
          timestamp
        };
      }

      return {
        success: true,
        data: plaintext,
        timestamp
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Decryption failed: ${error.message}`,
        timestamp
      };
    }
  }

  /**
   * Generates a random key
   */
  generateKey(length: 128 | 192 | 256 = 256): string {
    const keyLength = length / 8; // Convert bits to bytes
    const randomArray = new Uint8Array(keyLength);
    
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(randomArray);
    } else {
      // Fallback for React Native
      for (let i = 0; i < keyLength; i++) {
        randomArray[i] = Math.floor(Math.random() * 256);
      }
    }

    return Array.from(randomArray)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  /**
   * Generates a random IV
   */
  generateIV(length: 128 = 128): string {
    return this.generateKey(length);
  }

  /**
   * Gets CryptoJS mode object
   */
  private getModeObject(mode: CipherMode): any {
    switch (mode) {
      case CipherMode.CBC:
        return CryptoJS.mode.CBC;
      case CipherMode.CTR:
        return CryptoJS.mode.CTR;
      case CipherMode.OFB:
        return CryptoJS.mode.OFB;
      case CipherMode.CFB:
        return CryptoJS.mode.CFB;
      case CipherMode.ECB:
      default:
        return CryptoJS.mode.ECB;
    }
  }

  /**
   * Hashes data using SHA-256
   */
  hashSHA256(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * Hashes data using MD5 (for compatibility)
   */
  hashMD5(data: string): string {
    return CryptoJS.MD5(data).toString();
  }

  /**
   * Derives a key from password using PBKDF2
   */
  deriveKey(password: string, salt: string, iterations: number = 1000): string {
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations
    });
    return key.toString();
  }
}

export const cryptoService = new CryptoService();
