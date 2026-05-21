import { useState, useCallback } from 'react';
import DESFireService, { DESFireTag } from '../services/desireService';

/**
 * Hook para gerenciar leitura e descriptografia de tags DESFire
 */
export function useDESFire() {
  const [tag, setTag] = useState<DESFireTag | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const readDESFireTag = useCallback(async (uid: string, ndefData?: string) => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Passo 1: Processar tag (20%)
      setProgress(20);
      const processedTag = await DESFireService.processDESFireTag(uid, ndefData);

      // Passo 2: Tentar autenticação (50%)
      setProgress(50);
      if (!processedTag.authenticated) {
        const authResult = DESFireService.tryDefaultKeys('1234567890ABCDEF');
        if (authResult.found) {
          processedTag.authenticated = true;
          processedTag.masterKeyFound = true;
          processedTag.masterKey = authResult.key;
        }
      }

      // Passo 3: Descriptografar dados (80%)
      setProgress(80);
      if (processedTag.masterKey) {
        for (const app of processedTag.applications) {
          for (const file of app.files) {
            if (file.encrypted && file.data) {
              try {
                file.decrypted = DESFireService.decrypt3DES(file.data, processedTag.masterKey);
                if (!file.decrypted) {
                  file.decrypted = DESFireService.decryptAES(file.data, processedTag.masterKey);
                }
              } catch (e) {
                // Ignorar erro de descriptografia
              }
            }
          }
        }
      }

      // Passo 4: Concluído (100%)
      setProgress(100);
      setTag(processedTag);
      return processedTag;
    } catch (err: any) {
      setError(err.message || 'Erro ao ler tag DESFire');
      setTag(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const formatTag = useCallback(() => {
    if (!tag) return '';
    return DESFireService.formatDESFireTag(tag);
  }, [tag]);

  const exportTagData = useCallback(() => {
    if (!tag) return '';
    return JSON.stringify(tag, null, 2);
  }, [tag]);

  const clearTag = useCallback(() => {
    setTag(null);
    setError(null);
    setProgress(0);
  }, []);

  return {
    tag,
    loading,
    error,
    progress,
    readDESFireTag,
    formatTag,
    exportTagData,
    clearTag,
  };
}

export default useDESFire;
