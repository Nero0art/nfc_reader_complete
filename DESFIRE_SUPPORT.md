# NFCryptoBreak v11.0 - Suporte a Mifare DESFire

## 🎯 Funcionalidades Implementadas

### ✅ Leitura de Tags DESFire
- Detecção automática de tags DESFire
- Leitura de versão do chip
- Enumeração de aplicações
- Listagem de arquivos

### ✅ Autenticação
- Brute-force com 6 chaves mestras padrão
- Detecção automática de chave correta
- Suporte a múltiplas chaves por aplicação

### ✅ Descriptografia
- **3DES (Triple DES)** - Modo ECB
- **AES** - Modos ECB e CBC
- Detecção automática de algoritmo
- Fallback inteligente entre algoritmos

### ✅ Análise de Dados
- Parsing de estrutura DESFire
- Identificação de AIDs comuns
- Formatação legível de dados
- Exportação em JSON

## 📦 Arquivos Adicionados

```
src/services/desireService.ts
├── DESFireService (classe principal)
├── Descriptografia 3DES/AES
├── Autenticação com chaves padrão
└── Parsing de estrutura DESFire

src/hooks/useDESFire.ts
├── Hook para integração no React
├── Gerenciamento de estado
├── Progresso de leitura
└── Exportação de dados
```

## 🚀 Como Usar

### No App (React)

```tsx
import { useDESFire } from './hooks/useDESFire';

export function MyComponent() {
  const { tag, loading, error, progress, readDESFireTag, formatTag } = useDESFire();

  const handleReadTag = async () => {
    await readDESFireTag('A1B2C3D4E5F6');
  };

  return (
    <View>
      <Button onPress={handleReadTag} title="Ler DESFire" />
      {loading && <Text>Progresso: {progress}%</Text>}
      {error && <Text>Erro: {error}</Text>}
      {tag && <Text>{formatTag()}</Text>}
    </View>
  );
}
```

### Diretamente no Serviço

```typescript
import DESFireService from './services/desireService';

// Ler tag
const tag = await DESFireService.processDESFireTag('A1B2C3D4E5F6');

// Tentar autenticação
const auth = DESFireService.tryDefaultKeys('encryptedChallenge');

// Descriptografar
const decrypted = DESFireService.decrypt3DES('encryptedData', 'key');

// Formatar para exibição
const formatted = DESFireService.formatDESFireTag(tag);
```

## 🔐 Chaves Mestras Padrão

O app tenta as seguintes chaves automaticamente:

| Chave | Descrição |
|-------|-----------|
| `00000000000000000000000000000000` | Chave padrão (zeros) |
| `FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF` | Chave padrão (FF) |
| `00112233445566778899AABBCCDDEEFF` | Chave comum |
| `0102030405060708090A0B0C0D0E0F10` | Chave sequencial |
| `A0A1A2A3A4A5A6A7A8A9AAABACADAEAF` | Chave comum 2 |
| `B0B1B2B3B4B5B6B7B8B9BABBBCBDBEBF` | Chave comum 3 |

## 📊 Estrutura de Resposta

```typescript
interface DESFireTag {
  uid: string;                          // UID da tag
  version: string;                      // Versão do chip
  applications: DESFireApplication[];   // Lista de aplicações
  authenticated: boolean;               // Se autenticado
  masterKeyFound: boolean;              // Se chave foi encontrada
  masterKey?: string;                   // Chave mestra (hex)
  errors: string[];                     // Erros durante leitura
}

interface DESFireApplication {
  aid: string;                          // Application ID
  name: string;                         // Nome da aplicação
  files: DESFireFile[];                 // Arquivos da app
  authenticated: boolean;               // Se autenticado nesta app
}

interface DESFireFile {
  fileId: number;                       // ID do arquivo
  type: string;                         // Tipo de arquivo
  size: number;                         // Tamanho em bytes
  data?: string;                        // Dados brutos (hex)
  decrypted?: string;                   // Dados descriptografados
  encrypted: boolean;                   // Se está criptografado
}
```

## 🛠️ Próximas Melhorias

- [ ] Suporte a chaves customizadas
- [ ] Leitura de setores específicos
- [ ] Escrita em tags DESFire
- [ ] Suporte a autenticação com múltiplas chaves
- [ ] Análise de vulnerabilidades
- [ ] Geração de relatórios de segurança

## 📝 Notas Técnicas

### Algoritmos Suportados
- **3DES**: Modo ECB com padding PKCS7
- **AES**: Modos ECB e CBC com padding PKCS7
- **Tamanho de chave**: 128, 192, 256 bits

### Limitações Conhecidas
- Requer `react-native-nfc-manager` com suporte a APDU
- Algumas tags podem ter proteção adicional
- Descriptografia falha se chave não estiver nas padrões

### Compatibilidade
- ✅ Mifare DESFire EV1
- ✅ Mifare DESFire EV2
- ✅ Mifare DESFire Light
- ⚠️ Mifare DESFire (versão antiga) - parcial

## 🔗 Referências

- [NXP DESFire Datasheet](https://www.nxp.com/docs/en/data-sheet/MF3ICD40_41_SDS.pdf)
- [ISO/IEC 14443-4](https://en.wikipedia.org/wiki/ISO/IEC_14443)
- [APDU Commands](https://en.wikipedia.org/wiki/Smart_card_application_protocol_data_unit)

---

**Versão**: 11.0  
**Data**: 21/05/2026  
**Status**: ✅ Pronto para Produção
