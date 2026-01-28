# 📋 Plano de Implementação - Processamento de Mensagens WhatsApp

## 🎯 Objetivo
Processar mensagens recebidas do WhatsApp Business API e armazenar no MongoDB usando Mongoose, seguindo a estrutura definida em `objetosIdealizados.ts`.

## 📊 Estrutura de Dados

### 1. Modelo: Contato (Coleção: `contatos`)
```typescript
{
  contato: String (único, indexado) // wa_id do WhatsApp
  contatoNome: String (opcional)
  ultimaMensagem: String
  dataUltimaMensagem: Date
  dataContato: Date (automático com timestamps)
}
```

### 2. Modelo: MensagemUnica (Subdocumento)
```typescript
{
  mensagemWhatsAppId: String (único) // ID da mensagem do WhatsApp
  mensagem: String
  dataHora: Date
  tipo: String (enum: 'texto', 'imagem', 'audio', etc.)
}
```

### 3. Modelo: Mensagem (Coleção: `mensagens`)
```typescript
{
  contatoID: ObjectId (referência ao Contato)
  mensagens: [MensagemUnica] // Array de mensagens
}
```

## 🔄 Fluxo de Processamento

### Cenário 1: Contato Novo
1. ✅ Receber webhook do WhatsApp
2. ✅ Extrair dados: `wa_id`, `nome`, `mensagem`, `timestamp`, `message_id`
3. ✅ Verificar se contato existe (buscar por `contato === wa_id`)
4. ❌ Contato NÃO existe:
   - Criar novo Contato
   - Criar MensagemUnica
   - Criar novo objeto Mensagem com array contendo a primeira mensagem
   - Salvar tudo no banco

### Cenário 2: Contato Existente
1. ✅ Receber webhook do WhatsApp
2. ✅ Extrair dados
3. ✅ Verificar se contato existe
4. ✅ Contato EXISTE:
   - Atualizar `ultimaMensagem` e `dataUltimaMensagem` do Contato
   - Verificar se mensagem já existe (evitar duplicatas)
   - Se mensagem é nova: criar MensagemUnica e adicionar ao array de mensagens
   - Atualizar objeto Mensagem no banco

## 🛡️ Validações e Segurança

### 1. Prevenção de Duplicatas
- **Estratégia:** Usar `mensagemWhatsAppId` (ID único do WhatsApp) como chave
- **Implementação:** Antes de adicionar mensagem, verificar se `mensagemWhatsAppId` já existe no array

### 2. Validação de Dados
- Validar que `wa_id` existe
- Validar que `message.id` existe
- Validar que `timestamp` é válido
- Validar tipo de mensagem (inicialmente só 'texto')

### 3. Tratamento de Erros
- Try/catch em todas as operações de banco
- Logs detalhados de erros
- Retornar 200 OK mesmo em caso de erro (para não quebrar webhook do WhatsApp)

## 📁 Estrutura de Arquivos

```
src/
  lib/
    models/
      Contato.ts          # Modelo Mongoose do Contato
      Mensagem.ts         # Modelo Mongoose da Mensagem
      MensagemUnica.ts    # Schema do subdocumento
    utils/
      processMessage.ts   # Função principal de processamento
      extractData.ts      # Função para extrair dados do webhook
      validateMessage.ts  # Função para validar mensagem
  app/
    api/
      webhook/
        route.ts          # Atualizar para chamar processMessage
```

## 🔧 Decisões Técnicas

### 1. Índices do MongoDB
- `contato` (no modelo Contato): índice único para busca rápida
- `mensagemWhatsAppId` (no subdocumento): verificação de duplicatas
- `contatoID` (no modelo Mensagem): índice para busca por contato

### 2. Timestamps
- Usar `timestamps: true` no Mongoose para `createdAt` e `updatedAt`
- Converter timestamp do WhatsApp (Unix) para Date do MongoDB

### 3. Tipos de Mensagem
- Inicialmente: apenas 'texto'
- Preparar estrutura para futuros tipos (imagem, audio, etc.)

### 4. Performance
- Usar `findOneAndUpdate` com `upsert` quando possível
- Usar `$addToSet` para adicionar mensagens (evita duplicatas automaticamente)
- Considerar paginação futura para arrays grandes de mensagens

## 📝 Ordem de Implementação

1. ✅ Criar modelos Mongoose (Contato, MensagemUnica, Mensagem)
2. ✅ Criar função `extractData` para extrair dados do webhook
3. ✅ Criar função `validateMessage` para validar dados
4. ✅ Criar função `processMessage` com lógica principal
5. ✅ Integrar `processMessage` no webhook route
6. ✅ Testar com mensagem real
7. ✅ Adicionar logs e tratamento de erros

## ⚠️ Pontos de Atenção

1. **Mensagens Duplicadas:** WhatsApp pode enviar a mesma mensagem múltiplas vezes
2. **Ordem das Mensagens:** Garantir que mensagens sejam adicionadas em ordem cronológica
3. **Performance:** Arrays de mensagens podem crescer muito - considerar paginação futura
4. **Transações:** Considerar usar transações MongoDB para garantir consistência (contato + mensagem)

## 🧪 Testes Necessários

1. Mensagem de contato novo
2. Mensagem de contato existente
3. Mensagem duplicada (mesmo message.id)
4. Mensagem sem nome de contato
5. Erro de conexão com banco
6. Mensagem com tipo diferente de 'texto' (deve ser ignorada inicialmente)

## 📚 Próximos Passos (Futuro)

- Suporte a outros tipos de mensagem (imagem, audio, etc.)
- Mensagens enviadas (não apenas recebidas)
- Paginação de mensagens
- Busca e filtros
- Estatísticas e relatórios

