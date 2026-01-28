# Configuração do MongoDB

Este projeto está configurado para usar MongoDB com Mongoose.

## 📋 Configuração

### 1. Variáveis de Ambiente

Certifique-se de que o arquivo `.env.local` existe na raiz do projeto com:

```env
MONGODB_URL=mongodb+srv://usuario:senha@cluster0.xxxxx.mongodb.net/?appName=Cluster0
```

**Importante:** O banco de dados configurado é `crm-db`. A conexão já está configurada para usar esse banco automaticamente.

### 2. Estrutura do Projeto

```
src/
  lib/
    db.ts              # Configuração de conexão com MongoDB
    models/            # Modelos Mongoose (coleções)
      README.md        # Documentação dos modelos
  app/
    api/
      test-db/        # Rota de teste da conexão
```

## 🚀 Como Usar

### Conectar ao Banco de Dados

Em qualquer arquivo que precise acessar o banco, importe a função `connectDB`:

```typescript
import connectDB from '@/lib/db';

// Em uma API Route
export async function GET() {
  await connectDB();
  // Seu código aqui
}
```

### Criar um Modelo

Quando for criar modelos para as coleções, use esta estrutura:

```typescript
// src/lib/models/Contato.ts
import mongoose, { Schema } from 'mongoose';
import connectDB from '@/lib/db';

// Conectar ao banco
await connectDB();

const ContatoSchema = new Schema({
  contato: { 
    type: String, 
    required: true, 
    unique: true 
  },
  contatoNome: { 
    type: String, 
    default: '' 
  },
}, {
  timestamps: true, // Adiciona createdAt e updatedAt automaticamente
});

// Evita redefinir o modelo durante hot-reload
export const Contato = mongoose.models.Contato || 
  mongoose.model('Contato', ContatoSchema);
```

### Usar o Modelo

```typescript
import { Contato } from '@/lib/models/Contato';
import connectDB from '@/lib/db';

export async function POST() {
  await connectDB();
  
  const novoContato = await Contato.create({
    contato: '5511999999999',
    contatoNome: 'João Silva',
  });
  
  return Response.json(novoContato);
}
```

## 🧪 Testar a Conexão

Para testar se a conexão está funcionando:

1. Inicie o servidor: `npm run dev`
2. Acesse: `http://localhost:3000/api/test-db`

Você deve ver uma resposta JSON confirmando a conexão.

## 📚 Coleções Futuras

Baseado no arquivo `objetosIdealizados.ts`, as coleções planejadas são:

1. **contatos** - Armazena informações dos contatos
2. **mensagens** - Armazena as conversas agrupadas por contato

## ⚠️ Importante

- A conexão é cacheada globalmente para evitar múltiplas conexões durante o desenvolvimento
- Sempre use `await connectDB()` antes de acessar os modelos
- Os modelos devem ser criados na pasta `src/lib/models/`
- Use `mongoose.models.ModelName` para evitar redefinição durante hot-reload

## 🔗 Recursos

- [Documentação do Mongoose](https://mongoosejs.com/docs/)
- [Documentação do MongoDB](https://www.mongodb.com/docs/)

