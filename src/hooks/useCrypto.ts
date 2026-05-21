/**
 * NFCryptoBreak v11.0 - useCrypto Hook
 * React hook for managing cryptographic operations
 */

import { useState, useCallback } from 'react';
import { cryptoService, CipherMode, KeyFormat, CryptoResult, CryptoOperation } from '../services/cryptoService';

export interface CryptoState {
  result: CryptoResult | null;
  isLoading: boolean;
  error: string | null;
  history: CryptoResult[];
}

export interface CryptoActions {
  encrypt: (text: string, key: string, iv?: string, mode?: CipherMode) => Promise<void>;
  decrypt: (cipherText: string, key: string, iv?: string, mode?: CipherMode) => Promise<void>;
  generateKey: (length?: 128 | 192 | 256) => string;
  generateIV: () => string;
  clearResult: () => void;
  clearHistory: () => void;
}

export const useCrypto = (): CryptoState & CryptoActions => {
  const [state, setState] = useState<CryptoState>({
    result: null,
    isLoading: false,
    error: null,
    history: []
  });

  const encrypt = useCallback(
    async (text: string, key: string, iv?: string, mode: CipherMode = CipherMode.CBC) => {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));

      try {
        const operation: CryptoOperation = {
          text,
          key,
          iv,
          mode,
          keyFormat: KeyFormat.HEX
        };

        const result = cryptoService.encrypt(operation);

        setState(prev => ({
          ...prev,
          result,
          isLoading: false,
          history: [result, ...prev.history.slice(0, 49)]
        }));
      } catch (error: any) {
        const errorResult: CryptoResult = {
          success: false,
          error: error.message,
          timestamp: Date.now()
        };

        setState(prev => ({
          ...prev,
          result: errorResult,
          error: error.message,
          isLoading: false
        }));
      }
    },
    []
  );

  const decrypt = useCallback(
    async (cipherText: string, key: string, iv?: string, mode: CipherMode = CipherMode.CBC) => {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));

      try {
        const operation: CryptoOperation = {
          text: cipherText,
          key,
          iv,
          mode,
          keyFormat: KeyFormat.HEX
        };

        const result = cryptoService.decrypt(operation);

        setState(prev => ({
          ...prev,
          result,
          isLoading: false,
          history: [result, ...prev.history.slice(0, 49)]
        }));
      } catch (error: any) {
        const errorResult: CryptoResult = {
          success: false,
          error: error.message,
          timestamp: Date.now()
        };

        setState(prev => ({
          ...prev,
          result: errorResult,
          error: error.message,
          isLoading: false
        }));
      }
    },
    []
  );

  const generateKey = useCallback((length: 128 | 192 | 256 = 256) => {
    return cryptoService.generateKey(length);
  }, []);

  const generateIV = useCallback(() => {
    return cryptoService.generateIV();
  }, []);

  const clearResult = useCallback(() => {
    setState(prev => ({
      ...prev,
      result: null,
      error: null
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      history: [],
      result: null
    }));
  }, []);

  return {
    ...state,
    encrypt,
    decrypt,
    generateKey,
    generateIV,
    clearResult,
    clearHistory
  };
};
