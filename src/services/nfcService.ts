/**
 * NFCryptoBreak v11.0 - NFC Service
 * Centralized NFC operations with proper error handling and lifecycle management
 */

import NfcManager, { NfcTech, NfcEvents, Ndef } from 'react-native-nfc-manager';
import { Platform } from 'react-native';

export interface NFCTag {
  id: string;
  type: string;
  technologies: string[];
  ndefMessage?: any[];
  ndefText?: string;
  ndefUri?: string;
  rawData: any;
  atqa?: string;
  sak?: string;
  ats?: string;
  timestamp: string;
}

export interface NFCResult {
  success: boolean;
  tag?: NFCTag;
  error?: string;
  timestamp: number;
}

class NFCService {
  private isInitialized = false;
  private isScanning = false;
  private tagListener: any = null;

  /**
   * Initializes NFC Manager
   */
  async initialize(): Promise<NFCResult> {
    const timestamp = Date.now();

    try {
      if (this.isInitialized) {
        return { success: true, timestamp };
      }

      await NfcManager.start();
      this.isInitialized = true;

      return { success: true, timestamp };
    } catch (error: any) {
      return {
        success: false,
        error: `NFC initialization failed: ${error.message}`,
        timestamp
      };
    }
  }

  /**
   * Starts scanning for NFC tags
   */
  async startScanning(): Promise<NFCResult> {
    const timestamp = Date.now();

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (this.isScanning) {
        return {
          success: false,
          error: 'Already scanning',
          timestamp
        };
      }

      this.isScanning = true;

      // Request technology
      await NfcManager.requestTechnology([NfcTech.NfcA, NfcTech.NfcB]);

      // Get tag
      const tag = await NfcManager.getTag();

      if (!tag) {
        return {
          success: false,
          error: 'No tag detected',
          timestamp
        };
      }

      const nfcTag = this.parseTag(tag);

      return {
        success: true,
        tag: nfcTag,
        timestamp
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Scanning failed: ${error.message}`,
        timestamp
      };
    } finally {
      this.isScanning = false;
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch (e) {
        console.warn('Error canceling NFC request:', e);
      }
    }
  }

  /**
   * Stops scanning
   */
  async stopScanning(): Promise<NFCResult> {
    const timestamp = Date.now();

    try {
      this.isScanning = false;
      await NfcManager.cancelTechnologyRequest();

      return { success: true, timestamp };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to stop scanning: ${error.message}`,
        timestamp
      };
    }
  }

  /**
   * Registers tag event listener
   */
  registerTagListener(callback: (tag: NFCTag) => void): void {
    if (Platform.OS === 'android') {
      this.tagListener = NfcManager.setEventListener(
        NfcEvents.DiscoverTag,
        (tag: any) => {
          const nfcTag = this.parseTag(tag);
          callback(nfcTag);
        }
      );
    }
  }

  /**
   * Unregisters tag event listener
   */
  unregisterTagListener(): void {
    if (this.tagListener) {
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      this.tagListener = null;
    }
  }

  /**
   * Parses raw NFC tag data
   */
  private parseTag(tag: any): NFCTag {
    const nfcTag: NFCTag = {
      id: this.bytesToHex(tag.nfcId || tag.id || []),
      type: tag.type || 'Unknown',
      technologies: tag.techTypes || [],
      rawData: tag,
      timestamp: new Date().toISOString()
    };

    // Parse NDEF message if available
    if (tag.ndefMessage && Array.isArray(tag.ndefMessage)) {
      nfcTag.ndefMessage = tag.ndefMessage;
      
      // Extract text and URI from NDEF
      for (const record of tag.ndefMessage) {
        if (record.type === 'T') {
          nfcTag.ndefText = this.parseNdefText(record);
        } else if (record.type === 'U') {
          nfcTag.ndefUri = this.parseNdefUri(record);
        }
      }
    }

    // Parse additional metadata
    if (tag.atqa) {
      nfcTag.atqa = this.bytesToHex(tag.atqa);
    }
    if (tag.sak) {
      nfcTag.sak = this.bytesToHex([tag.sak]);
    }
    if (tag.ats) {
      nfcTag.ats = this.bytesToHex(tag.ats);
    }

    return nfcTag;
  }

  /**
   * Parses NDEF text record
   */
  private parseNdefText(record: any): string {
    try {
      if (record.payload) {
        const payload = record.payload;
        const encoding = payload[0] === 0x02 ? 'utf-16' : 'utf-8';
        const languageLength = payload[1];
        const textBytes = payload.slice(2 + languageLength);
        
        if (encoding === 'utf-16') {
          return String.fromCharCode.apply(null, textBytes as any);
        } else {
          return new TextDecoder().decode(new Uint8Array(textBytes));
        }
      }
    } catch (error) {
      console.warn('Error parsing NDEF text:', error);
    }
    return '';
  }

  /**
   * Parses NDEF URI record
   */
  private parseNdefUri(record: any): string {
    try {
      if (record.payload) {
        const payload = record.payload;
        const prefix = this.getUriPrefix(payload[0]);
        const uri = new TextDecoder().decode(new Uint8Array(payload.slice(1)));
        return prefix + uri;
      }
    } catch (error) {
      console.warn('Error parsing NDEF URI:', error);
    }
    return '';
  }

  /**
   * Gets URI prefix from NDEF code
   */
  private getUriPrefix(code: number): string {
    const prefixes: { [key: number]: string } = {
      0x00: '',
      0x01: 'http://www.',
      0x02: 'https://www.',
      0x03: 'http://',
      0x04: 'https://',
      0x05: 'tel:',
      0x06: 'mailto:',
      0x07: 'ftp://anonymous:anonymous@',
      0x08: 'ftp://ftp.',
      0x09: 'ftps://',
      0x0A: 'sftp://',
      0x0B: 'smb://',
      0x0C: 'nfs://',
      0x0D: 'ftp://',
      0x0E: 'dav://',
      0x0F: 'news:',
      0x10: 'telnet://',
      0x11: 'imap:',
      0x12: 'rtsp://',
      0x13: 'urn:',
      0x14: 'pop:',
      0x15: 'sip:',
      0x16: 'sips:',
      0x17: 'tftp:',
      0x18: 'btspp://',
      0x19: 'btl2cap://',
      0x1A: 'btgoep://',
      0x1B: 'tcpobex://',
      0x1C: 'irdaobex://',
      0x1D: 'file://',
      0x1E: 'urn:epc:id:',
      0x1F: 'urn:epc:tag:',
      0x20: 'urn:epc:pat:',
      0x21: 'urn:epc:raw:',
      0x22: 'urn:epc:',
      0x23: 'urn:nfc:'
    };
    return prefixes[code] || '';
  }

  /**
   * Converts bytes to hex string
   */
  private bytesToHex(bytes: number[] | Uint8Array): string {
    return Array.from(bytes)
      .map(byte => ('0' + byte.toString(16)).slice(-2))
      .join('')
      .toUpperCase();
  }

  /**
   * Checks if NFC is available
   */
  async isNFCAvailable(): Promise<boolean> {
    try {
      const isSupported = await NfcManager.isSupported();
      return isSupported;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cleans up resources
   */
  async cleanup(): Promise<void> {
    try {
      this.unregisterTagListener();
      await this.stopScanning();
    } catch (error) {
      console.warn('Error during cleanup:', error);
    }
  }
}

export const nfcService = new NFCService();
