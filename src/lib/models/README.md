# Modelos do Banco de Dados

Esta pasta contém os modelos Mongoose para as coleções do banco de dados.

## ✅ Modelos Implementados

### 1. Contato (`Contato.ts`)
**Coleção:** `contatos`

Campos:
- `contato`: String (único, indexado) - Número do WhatsApp (wa_id)
- `contatoNome`: String - Nome do contato
- `ultimaMensagem`: String - Última mensagem recebida
- `dataUltimaMensagem`: Date - Data/hora da última mensagem
- `createdAt`: Date (automático)
- `updatedAt`: Date (automático)

### 2. Mensagem (`Mensagem.ts`)
**Coleção:** `mensagens`

Campos:
- `contatoID`: ObjectId (referência ao Contato)
- `mensagens`: Array de MensagemUnica
- `createdAt`: Date (automático)
- `updatedAt`: Date (automático)

### 3. MensagemUnica (`MensagemUnica.ts`)
**Tipo:** Subdocumento (não é uma coleção separada)

Campos:
- `mensagemWhatsAppId`: String - ID único da mensagem do WhatsApp
- `mensagem`: String - Conteúdo da mensagem
- `dataHora`: Date - Data/hora da mensagem
- `tipo`: String (enum) - Tipo da mensagem (texto, imagem, audio, etc.)

## 📝 Exemplo de Uso

```typescript
import Contato from '@/lib/models/Contato';
import Mensagem from '@/lib/models/Mensagem';
import connectDB from '@/lib/db';

// Conectar ao banco
await connectDB();

// Buscar contato
const contato = await Contato.findOne({ contato: '5511999999999' });

// Buscar mensagens do contato
const mensagens = await Mensagem.findOne({ contatoID: contato._id });
```

## 🔄 Fluxo de Processamento

1. Mensagem recebida → `extractData()` extrai dados
2. Dados validados → `validateMessage()` valida
3. Processamento → `processMessage()` salva no banco
   - Se contato novo: cria Contato + Mensagem
   - Se contato existe: atualiza Contato + adiciona ao array de mensagens

