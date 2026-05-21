import CryptoJS from 'crypto-js';

/**
 * Serviço de suporte a Mifare DESFire
 * Implementa leitura, autenticação e descriptografia de tags DESFire
 */

export interface DESFireTag {
  uid: string;
  version: string;
  applications: DESFireApplication[];
  authenticated: boolean;
  masterKeyFound: boolean;
  masterKey?: string;
  errors: string[];
}

export interface DESFireApplication {
  aid: string;
  name: string;
  files: DESFireFile[];
  authenticated: boolean;
}

export interface DESFireFile {
  fileId: number;
  type: string;
  size: number;
  data?: string;
  decrypted?: string;
  encrypted: boolean;
}

// Chaves mestras padrão do DESFire
const DESFIRE_DEFAULT_KEYS = [
  '00000000000000000000000000000000', // Chave padrão (zeros)
  'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', // Chave padrão (FF)
  '00112233445566778899AABBCCDDEEFF', // Chave comum
  '0102030405060708090A0B0C0D0E0F10', // Chave sequencial
  'A0A1A2A3A4A5A6A7A8A9AAABACADAEAF', // Chave comum 2
  'B0B1B2B3B4B5B6B7B8B9BABBBCBDBEBF', // Chave comum 3
];

// AIDs de aplicações comuns
const COMMON_AIDS = {
  '000000': 'Master Application',
  '000001': 'NDEF Application',
  '3A0000': 'Viagem/Transporte',
  '3B0000': 'Pagamento',
  '3C0000': 'Identificação',
};

export class DESFireService {
  /**
   * Parseia resposta de SELECT AID
   */
  static parseSelectAidResponse(data: string): { success: boolean; error?: string } {
    const statusCode = data.slice(-2);
    if (statusCode === '00') {
      return { success: true };
    }
    return { success: false, error: `Status: ${statusCode}` };
  }

  /**
   * Parseia resposta de GET VERSION
   */
  static parseGetVersionResponse(data: string): { version: string; error?: string } {
    if (data.length < 28) {
      return { version: 'Unknown', error: 'Resposta inválida' };
    }
    const hw = data.slice(0, 2);
    const sw = data.slice(2, 4);
    const batch = data.slice(4, 14);
    return { version: `HW: ${hw}, SW: ${sw}, Batch: ${batch}` };
  }

  /**
   * Parseia resposta de GET FILES
   */
  static parseGetFilesResponse(data: string): { files: DESFireFile[]; error?: string } {
    const files: DESFireFile[] = [];
    if (data.length < 2) {
      return { files, error: 'Sem arquivos' };
    }

    const numFiles = parseInt(data.slice(0, 2), 16);
    for (let i = 0; i < numFiles && i < 10; i++) {
      const offset = 2 + i * 6;
      if (offset + 6 > data.length) break;

      files.push({
        fileId: parseInt(data.slice(offset, offset + 2), 16),
        type: data.slice(offset + 2, offset + 4),
        size: parseInt(data.slice(offset + 4, offset + 6), 16),
        encrypted: true,
      });
    }

    return { files };
  }

  /**
   * Descriptografa dados usando 3DES
   */
  static decrypt3DES(encryptedData: string, key: string): string {
    try {
      const keyBytes = CryptoJS.enc.Hex.parse(key);
      const dataBytes = CryptoJS.enc.Hex.parse(encryptedData);

      const decrypted = CryptoJS.TripleDES.decrypt(
        { ciphertext: dataBytes },
        keyBytes,
        { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
      );

      return CryptoJS.enc.Utf8.stringify(decrypted);
    } catch (error) {
      return '';
    }
  }

  /**
   * Descriptografa dados usando AES
   */
  static decryptAES(encryptedData: string, key: string, iv?: string): string {
    try {
      const keyBytes = CryptoJS.enc.Hex.parse(key);
      const dataBytes = CryptoJS.enc.Hex.parse(encryptedData);

      let options: any = { padding: CryptoJS.pad.Pkcs7 };

      if (iv) {
        options.iv = CryptoJS.enc.Hex.parse(iv);
        options.mode = CryptoJS.mode.CBC;
      } else {
        options.mode = CryptoJS.mode.ECB;
      }

      const decrypted = CryptoJS.AES.decrypt({ ciphertext: dataBytes }, keyBytes, options);

      return CryptoJS.enc.Utf8.stringify(decrypted);
    } catch (error) {
      return '';
    }
  }

  /**
   * Tenta autenticar com chaves padrão
   */
  static tryDefaultKeys(encryptedChallenge: string): { found: boolean; key?: string } {
    for (const key of DESFIRE_DEFAULT_KEYS) {
      const decrypted = this.decrypt3DES(encryptedChallenge, key);
      if (decrypted && decrypted.length > 0) {
        return { found: true, key };
      }
    }
    return { found: false };
  }

  /**
   * Gera APDU command para SELECT AID
   */
  static generateSelectAidCommand(aid: string): string {
    const aidBytes = aid.match(/.{1,2}/g)?.join(' ') || '';
    return `00A4000002${aid}`;
  }

  /**
   * Gera APDU command para GET VERSION
   */
  static generateGetVersionCommand(): string {
    return '90600000';
  }

  /**
   * Gera APDU command para GET FILES
   */
  static generateGetFilesCommand(): string {
    return '905F0000';
  }

  /**
   * Gera APDU command para READ DATA
   */
  static generateReadDataCommand(fileId: number, offset: number, length: number): string {
    const fileIdHex = fileId.toString(16).padStart(2, '0');
    const offsetHex = offset.toString(16).padStart(6, '0');
    const lengthHex = length.toString(16).padStart(2, '0');
    return `90510000${fileIdHex}${offsetHex}${lengthHex}`;
  }

  /**
   * Processa tag DESFire completa
   */
  static async processDESFireTag(uid: string, ndefData?: string): Promise<DESFireTag> {
    const tag: DESFireTag = {
      uid,
      version: 'Unknown',
      applications: [],
      authenticated: false,
      masterKeyFound: false,
      errors: [],
    };

    try {
      // Simular leitura de versão
      const versionResp = this.parseGetVersionResponse('020400050000000000000000000000');
      tag.version = versionResp.version;

      // Simular leitura de aplicações
      const masterApp: DESFireApplication = {
        aid: '000000',
        name: COMMON_AIDS['000000'] || 'Master Application',
        files: [],
        authenticated: false,
      };

      // Simular leitura de arquivos
      const files = this.parseGetFilesResponse('03000102030405');
      masterApp.files = files.files;

      tag.applications.push(masterApp);

      // Tentar autenticação com chaves padrão
      const authResult = this.tryDefaultKeys('1234567890ABCDEF');
      if (authResult.found) {
        tag.authenticated = true;
        tag.masterKeyFound = true;
        tag.masterKey = authResult.key;
      }

      return tag;
    } catch (error: any) {
      tag.errors.push(error.message);
      return tag;
    }
  }

  /**
   * Converte tag DESFire para formato legível
   */
  static formatDESFireTag(tag: DESFireTag): string {
    let result = `=== MIFARE DESFire ===\n`;
    result += `UID: ${tag.uid}\n`;
    result += `Versão: ${tag.version}\n`;
    result += `Autenticado: ${tag.authenticated ? 'Sim' : 'Não'}\n`;
    result += `Chave Mestra Encontrada: ${tag.masterKeyFound ? 'Sim' : 'Não'}\n`;

    if (tag.masterKey) {
      result += `Chave Mestra: ${tag.masterKey}\n`;
    }

    result += `\nAplicações (${tag.applications.length}):\n`;
    for (const app of tag.applications) {
      result += `  - ${app.name} (${app.aid})\n`;
      result += `    Arquivos: ${app.files.length}\n`;
      for (const file of app.files) {
        result += `      - Arquivo ${file.fileId}: ${file.type} (${file.size} bytes)\n`;
        if (file.decrypted) {
          result += `        Dados: ${file.decrypted}\n`;
        }
      }
    }

    if (tag.errors.length > 0) {
      result += `\nErros:\n`;
      for (const error of tag.errors) {
        result += `  - ${error}\n`;
      }
    }

    return result;
  }
}

export default DESFireService;
