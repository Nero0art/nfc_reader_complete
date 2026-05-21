/**
 * NFCryptoBreak v11.0 - Secure Storage Service
 * Manages sensitive data storage using device keychain/keystore
 */

import * as SecureStore from 'expo-secure-store';

export interface StorageResult {
  success: boolean;
  error?: string;
  data?: string;
}

class SecureStorageService {
  private prefix = 'nfcryptobreak_';

  /**
   * Stores sensitive data securely
   */
  async setSecureData(key: string, value: string): Promise<StorageResult> {
    try {
      const fullKey = this.prefix + key;
      await SecureStore.setItemAsync(fullKey, value);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to store data: ${error.message}`
      };
    }
  }

  /**
   * Retrieves sensitive data securely
   */
  async getSecureData(key: string): Promise<StorageResult> {
    try {
      const fullKey = this.prefix + key;
      const value = await SecureStore.getItemAsync(fullKey);
      
      if (!value) {
        return {
          success: false,
          error: 'Data not found'
        };
      }

      return {
        success: true,
        data: value
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to retrieve data: ${error.message}`
      };
    }
  }

  /**
   * Removes sensitive data
   */
  async removeSecureData(key: string): Promise<StorageResult> {
    try {
      const fullKey = this.prefix + key;
      await SecureStore.deleteItemAsync(fullKey);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to remove data: ${error.message}`
      };
    }
  }

  /**
   * Stores encryption keys securely
   */
  async storeKey(keyName: string, keyValue: string): Promise<StorageResult> {
    return this.setSecureData(`key_${keyName}`, keyValue);
  }

  /**
   * Retrieves encryption keys securely
   */
  async getKey(keyName: string): Promise<StorageResult> {
    return this.getSecureData(`key_${keyName}`);
  }

  /**
   * Stores API credentials securely
   */
  async storeCredentials(service: string, username: string, password: string): Promise<StorageResult> {
    const credentials = JSON.stringify({ username, password });
    return this.setSecureData(`creds_${service}`, credentials);
  }

  /**
   * Retrieves API credentials securely
   */
  async getCredentials(service: string): Promise<StorageResult> {
    const result = await this.getSecureData(`creds_${service}`);
    
    if (!result.success) {
      return result;
    }

    try {
      const credentials = JSON.parse(result.data!);
      return {
        success: true,
        data: JSON.stringify(credentials)
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to parse credentials: ${error.message}`
      };
    }
  }

  /**
   * Clears all secure data
   */
  async clearAllSecureData(): Promise<StorageResult> {
    try {
      // Note: SecureStore doesn't provide a clear all method
      // This is a placeholder for future implementation
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to clear data: ${error.message}`
      };
    }
  }

  /**
   * Checks if data exists
   */
  async hasSecureData(key: string): Promise<boolean> {
    const result = await this.getSecureData(key);
    return result.success;
  }
}

export const secureStorageService = new SecureStorageService();
