/**
 * NFCryptoBreak v11.0 - useNFC Hook
 * React hook for managing NFC scanning lifecycle
 */

import { useState, useEffect, useCallback } from 'react';
import { nfcService, NFCTag, NFCResult } from '../services/nfcService';

export interface UseNFCState {
  isScanning: boolean;
  lastTag: NFCTag | null;
  error: string | null;
  isAvailable: boolean;
  history: NFCTag[];
}

export interface UseNFCActions {
  startScanning: () => Promise<void>;
  stopScanning: () => Promise<void>;
  clearHistory: () => void;
  clearError: () => void;
}

export const useNFC = (): UseNFCState & UseNFCActions => {
  const [state, setState] = useState<UseNFCState>({
    isScanning: false,
    lastTag: null,
    error: null,
    isAvailable: false,
    history: []
  });

  // Initialize NFC on mount
  useEffect(() => {
    const initNFC = async () => {
      try {
        const isAvailable = await nfcService.isNFCAvailable();
        setState(prev => ({ ...prev, isAvailable }));

        if (!isAvailable) {
          setState(prev => ({
            ...prev,
            error: 'NFC is not available on this device'
          }));
        }

        const result = await nfcService.initialize();
        if (!result.success) {
          setState(prev => ({
            ...prev,
            error: result.error || 'Failed to initialize NFC'
          }));
        }
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          error: `Initialization error: ${error.message}`
        }));
      }
    };

    initNFC();

    // Cleanup on unmount
    return () => {
      nfcService.cleanup();
    };
  }, []);

  // Start scanning
  const startScanning = useCallback(async () => {
    if (state.isScanning) return;

    setState(prev => ({
      ...prev,
      isScanning: true,
      error: null
    }));

    try {
      const result: NFCResult = await nfcService.startScanning();

      if (result.success && result.tag) {
        setState(prev => ({
          ...prev,
          lastTag: result.tag!,
          history: [result.tag!, ...prev.history.slice(0, 99)],
          isScanning: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || 'Failed to scan tag',
          isScanning: false
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: `Scanning error: ${error.message}`,
        isScanning: false
      }));
    }
  }, [state.isScanning]);

  // Stop scanning
  const stopScanning = useCallback(async () => {
    try {
      await nfcService.stopScanning();
      setState(prev => ({
        ...prev,
        isScanning: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: `Stop scanning error: ${error.message}`
      }));
    }
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      history: [],
      lastTag: null
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  return {
    ...state,
    startScanning,
    stopScanning,
    clearHistory,
    clearError
  };
};
