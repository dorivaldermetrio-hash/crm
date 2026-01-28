# 📨 Sistema de Mensagens - Documentação Completa

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Fluxo Completo de Processamento](#fluxo-completo-de-processamento)
3. [Estrutura de Dados](#estrutura-de-dados)
4. [Sistema de Prompts](#sistema-de-prompts)
5. [Variáveis de Prompt](#variáveis-de-prompt)
6. [Controle de Fluxo Conversacional](#controle-de-fluxo-conversacional)
7. [Armazenamento](#armazenamento)
8. [Debounce e Performance](#debounce-e-performance)

---

## 🎯 Visão Geral

O sistema processa mensagens recebidas via **WhatsApp Business API** e **Instagram Direct Messages**, armazena no MongoDB, e gera respostas automáticas usando **Ollama (IA local)**.

### Componentes Principais

1. **Webhooks** (`/api/webhook` e `/api/webhook-instagram`)
   - Recebem mensagens das plataformas
   - Validam e extraem dados

2. **Processamento** (`processMessage.ts` / `processMessageInstagram.ts`)
   - Salva mensagens no banco
   - Cria/atualiza contatos

3. **Sistema de IA** (`verificadorDeConversa.ts` + `ollama.ts`)
   - Determina qual prompt executar
   - Gera respostas contextuais

4. **Armazenamento** (MongoDB com Mongoose)
   - Contatos, Mensagens, Prompts

---

## 🔄 Fluxo Completo de Processamento

### 1. Recebimento da Mensagem

```
WhatsApp/Instagram → Webhook → Extração de Dados
```

**Arquivos:**
- `src/app/api/webhook/route.ts` (WhatsApp)
- `src/app/api/webhook-instagram/route.ts` (Instagram)
- `src/lib/utils/extractData.ts`
- `src/lib/utils/extractDataInstagram.ts`

**Processo:**
1. Webhook recebe POST do Meta
2. `extractData()` ou `extractDataInstagram()` extrai:
   - `wa_id` / `instagram_id` (identificador do contato)
   - `contatoNome` / `username` (nome do contato)
   - `messageId` (ID único da mensagem)
   - `mensagem` (texto ou placeholder para mídia)
   - `timestamp` (data/hora Unix)
   - `tipo` (texto, imagem, audio, video, documento, localização)
   - `mediaId` (se for mídia)

**Validação:**
- `validateMessage()` ou `validateMessageInstagram()`
- Verifica campos obrigatórios
- Valida tipos suportados

---

### 2. Processamento e Armazenamento

```
Extração → Validação → Processamento → Banco de Dados
```

**Arquivos:**
- `src/lib/utils/processMessage.ts`
- `src/lib/utils/processMessageInstagram.ts`

**Cenário 1: Contato Novo**
```typescript
1. Busca contato por wa_id/username → Não existe
2. Cria novo Contato:
   - contato: wa_id/username
   - contatoNome: nome extraído
   - ultimaMensagem: mensagem recebida
   - dataUltimaMensagem: timestamp
   - status: 'Novo Contato' (padrão)
   - saudacao: false (padrão)
   - Outras propriedades: false/vazio
3. Cria MensagemUnica:
   - mensagemWhatsAppId/mensagemInstagramId: messageId
   - mensagem: texto
   - dataHora: Date
   - tipo: tipo da mensagem
   - contatoID: ID do contato (não "1")
4. Cria documento Mensagem:
   - contatoID: ObjectId do contato
   - mensagens: [MensagemUnica]
```

**Cenário 2: Contato Existente**
```typescript
1. Busca contato → Existe
2. Atualiza Contato:
   - ultimaMensagem: nova mensagem
   - dataUltimaMensagem: novo timestamp
   - contatoNome: atualiza se mudou
3. Busca documento Mensagem do contato
4. Verifica duplicata:
   - Se mensagemWhatsAppId/mensagemInstagramId já existe → Ignora
5. Adiciona nova MensagemUnica ao array
6. Ordena mensagens por dataHora (mais antiga primeiro)
7. Salva no banco
```

**Processamento de Mídia (WhatsApp):**
- Se `tipo !== 'texto'` e `mediaId` existe:
  - `downloadMediaFromWhatsApp()` baixa a mídia
  - `saveFileToGridFS()` salva no MongoDB GridFS
  - Adiciona campos `midiaId`, `midiaUrl`, `midiaNome`, `midiaTamanho`, `midiaMimeType` à MensagemUnica

---

### 3. Emissão de Evento SSE

Após salvar mensagem do cliente:
```typescript
emitEvent({
  type: 'nova_mensagem',
  contatoId: result.contatoId,
  contato: wa_id/instagram_id,
  data: {
    mensagem: mensagem,
    contatoNome: nome,
    tipo: tipo,
  },
});
```

**Arquivo:** `src/app/api/events/route.ts`
- Frontend recebe atualização em tempo real via Server-Sent Events
- Atualiza interface sem refresh

---

### 4. Processamento de IA (com Debounce)

```
Mensagem Salva → Debounce (10s) → Verificação → Prompt → IA → Resposta
```

**Arquivo:** `src/lib/utils/messageDebouncer.ts`

**Sistema de Debounce:**
- **Delay padrão:** 10 segundos (configurável via `MESSAGE_DEBOUNCE_DELAY`)
- **Funcionamento:**
  1. Mensagem chega → Agenda processamento para 10s no futuro
  2. Nova mensagem chega antes de 10s → Cancela timer anterior, agenda novo
  3. Após 10s sem novas mensagens → Processa IA uma única vez

**Motivo:** Evita múltiplas respostas quando cliente envia várias mensagens rapidamente.

**Exemplo:**
```
t=0s:  Cliente: "Oi"
t=1s:  Cliente: "Preciso de ajuda"
t=2s:  Cliente: "É urgente"
t=10s: IA processa TODAS as 3 mensagens juntas → Responde uma vez
```

---

### 5. Verificação de Estado da Conversa

**Arquivo:** `src/lib/utils/verificadorDeConversa.ts`

**Função:** Determina qual prompt executar baseado nas propriedades booleanas do contato.

**Propriedades de Estado:**
- `saudacao`: Se já foi cumprimentado
- `pedidoResumo`: Se já pediu resumo do caso
- `confirmacaoResumo`: Se resumo foi confirmado
- `urgenciaDefinida`: Se urgência foi definida
- `selecionandoData`: Se está selecionando data
- `propostaAgendamento`: Se agendamento foi proposto
- `confirmaAgendamento`: Se agendamento foi confirmado

**Lógica de Decisão (ordem de verificação):**

```typescript
1. Se !saudacao
   → Prompt: "Novo Contato"
   → Atualiza: saudacao = true

2. Se saudacao && !pedidoResumo
   → Prompt: "Triagem em Andamento"
   → Atualiza: pedidoResumo = true

3. Se saudacao && pedidoResumo && !confirmacaoResumo
   → Prompt: "Verificador de Resumo"
   → Flag: precisaValidacao = true
   → Depois executa: "Validação de Resumo"
   → Atualiza: confirmacaoResumo = true

4. Se saudacao && pedidoResumo && confirmacaoResumo
   → Prompt: "Validação do Resumo e Incorporação"
   → Flag: precisaValidacaoResumoIncorporacao = true
   → Fluxo complexo com validações

5. Se todas anteriores + urgenciaDefinida
   → Prompt: "Validação de Urgência"
   → Flag: precisaValidacaoUrgenciaFinal = true
   → Depois executa: "Solicitação de Nome"
   → Atualiza: selecionandoData = true

6. Se todas anteriores + selecionandoData
   → Prompt: "Validação de Nome"
   → Flag: precisaValidacaoNome = true
   → Depois executa: "Oferecendo Agendamento"
   → Atualiza: propostaAgendamento = true

7. Se todas anteriores + propostaAgendamento
   → Prompt: "Validação de Agendamento"
   → Flag: precisaValidacaoAgendamento = true
   → Se aceito: Cria agendamento + "Agendamento Aceito"
   → Se não aceito: "Agendamento Não Aceito"
   → Atualiza: confirmaAgendamento = true
```

**Retorno:**
```typescript
interface VerificacaoConversa {
  promptNome: string;                    // Nome do prompt a executar
  propriedadeParaAtualizar?: string;     // Propriedade a atualizar após enviar
  precisaValidacao?: boolean;             // Flag para fluxos especiais
  precisaValidacaoResumoIncorporacao?: boolean;
  precisaValidacaoUrgenciaFinal?: boolean;
  precisaValidacaoNome?: boolean;
  precisaValidacaoAgendamento?: boolean;
}
```

---

### 6. Busca e Processamento de Prompt

**Arquivo:** `src/lib/utils/processPromptVariables.ts`

**Processo:**
1. Busca prompt do banco: `AtendimentoAI.findOne({ nome: promptNome })`
2. Processa variáveis no template do prompt
3. Substitui placeholders por valores reais

**Variáveis Disponíveis:**

| Variável | Descrição | Fonte |
|----------|-----------|-------|
| `{[PROMPT BASE]}` | Prompt base do sistema | `AtendimentoAI.findOne({ nome: 'Definição Base' })` |
| `{[HISTORICO DE MENSAGENS]}` | Últimas N mensagens formatadas | `getFormattedHistory(contatoId, numMsgHist)` |
| `{[ULTIMA MENSAGEM]}` | Última mensagem recebida | Parâmetro `mensagemRecebida` |
| `{[PRODUTO DE INTERESSE]}` | Informações do produto | `getProductByName(contato.produtoInteresse)` |
| `{[RESUMO CASO]}` | Resumo do caso do cliente | `contato.resumoCaso` |
| `{[HORARIOS DISPONIVEIS]}` | Lista de horários disponíveis | `obterDatasDisponiveisServer()` |
| `{[PRIMEIRO HORARIO DISPONIVEL]}` | Primeiro horário disponível | `obterDatasDisponiveisServer()[0]` |
| `{[PRIMEIRO NOME]}` | Primeiro nome do cliente | `contato.nomeCompleto.split(' ')[0]` |

**Formatação do Histórico:**
- Busca últimas N mensagens (padrão: 10, configurável via `Config.numMsgHist`)
- Ordena por data (mais antiga primeiro)
- Formato: `"Cliente: mensagem"` ou `"Assistente: mensagem"`
- Exclui última mensagem do cliente (para não duplicar com mensagem atual)

**Exemplo de Prompt Processado:**
```
{[PROMPT BASE]}

Histórico da conversa:
Cliente: Olá, preciso de ajuda
Assistente: Olá! Como posso ajudar?
Cliente: Tenho um problema jurídico

Mensagem atual do cliente:
"É urgente, preciso resolver hoje"

Produto de interesse:
Nome: Consulta Jurídica
Descrição: Consulta inicial para análise de caso
Valor: R$ 200,00

Resumo do caso:
Cliente precisa de ajuda urgente com problema jurídico

Horários disponíveis:
Segunda-feira, 15/01/2024 às 14:00, Segunda-feira, 15/01/2024 às 16:00
```

---

### 7. Geração de Resposta com IA

**Arquivos:**
- `src/lib/utils/ollama.ts`
- `src/lib/utils/generateOllamaCustomJSON.ts`

**Funções Disponíveis:**

#### `generateOllamaJSONResponse(prompt, modelName)`
- Gera resposta simples em JSON: `{ resposta: "texto" }`
- Usa JSON Schema para forçar formato
- Modelo padrão: `llama3.1:8b`

#### `generateOllamaCustomJSON(prompt, jsonSchema, modelName)`
- Gera resposta com schema JSON customizado
- Usado para validações complexas (ex: `{ agendamentoAceito: "true", motivo: "" }`)

**Processo:**
1. Monta requisição para Ollama (`/api/chat`)
2. Envia prompt processado
3. Recebe resposta JSON
4. Faz parse e validação
5. Extrai campos necessários

**Tratamento de Erros:**
- Tenta extrair JSON de markdown code blocks
- Fallback para texto puro se parsing falhar
- Valida campos obrigatórios

---

### 8. Fluxos Especiais de Validação

O sistema possui vários fluxos especiais que executam múltiplos prompts em sequência:

#### Fluxo: Validação de Agendamento
```typescript
1. Executa "Validação de Agendamento" (JSON customizado)
   → Retorna: { agendamentoAceito: "true"/"false", motivo: "" }

2. Se agendamentoAceito === "true":
   a. Busca primeiro horário disponível
   b. Cria agendamento na agenda
   c. Executa "Agendamento Aceito"
   d. Envia mensagem
   e. Atualiza: confirmaAgendamento = true

3. Se agendamentoAceito === "false":
   a. Executa "Agendamento Não Aceito"
   b. Envia mensagem
   c. Atualiza: confirmaAgendamento = true
```

#### Fluxo: Validação de Nome
```typescript
1. Executa "Validação de Nome" (JSON customizado)
   → Retorna: { nomeIdentificado: "true"/"false", nomeCompleto: "..." }

2. Se nomeIdentificado === "false":
   a. Executa "Solicitação de Nome" (novamente)
   b. Envia mensagem

3. Se nomeIdentificado === "true":
   a. Salva nomeCompleto no contato
   b. Executa "Oferecendo Agendamento"
   c. Envia mensagem
   d. Atualiza: propostaAgendamento = true
```

#### Fluxo: Validação do Resumo e Incorporação
```typescript
1. Executa "Validação do Resumo e Incorporação" (JSON customizado)
   → Retorna: { resumoCorreto: "true"/"false" }

2. Se resumoCorreto === "false":
   a. Reseta: confirmacaoResumo = false
   b. Executa "Verificador de Resumo" (novamente)
   c. Atualiza resumoCaso
   d. Executa "Validação de Resumo"
   e. Envia mensagem
   f. Atualiza: confirmacaoResumo = true

3. Se resumoCorreto === "true":
   a. Executa "Validação de Urgência" (JSON customizado)
   b. Se processoDefinido === "false": Executa "Urgência Não Definida"
   c. Se processoDefinido === "true": Executa "Solicitação de Nome"
   d. Atualiza: urgenciaDefinida = true
```

#### Fluxo: Verificador de Resumo
```typescript
1. Executa "Verificador de Resumo" (JSON customizado)
   → Retorna: { resumo: "resumo do caso" }

2. Atualiza: resumoCaso = resumo

3. Executa "Validação de Resumo"
   → Envia mensagem para cliente confirmar resumo

4. Atualiza: confirmacaoResumo = true
```

---

### 9. Envio de Mensagem

**Arquivo:** `src/lib/utils/sendWhatsAppMessage.ts`

**Processo:**
1. Formata número de telefone (remove caracteres não numéricos, adiciona código do país)
2. Faz requisição para WhatsApp Business API
3. Retorna `messageId` da mensagem enviada

**Endpoint:** `https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages`

**Variáveis de Ambiente:**
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`

---

### 10. Salvamento de Mensagem Enviada

**Arquivo:** `src/lib/utils/saveSystemMessage.ts`

**Processo:**
1. Busca ou cria documento `Mensagem` do contato
2. Cria nova `MensagemUnica`:
   - `mensagem`: texto enviado
   - `dataHora`: agora
   - `tipo`: "texto"
   - `contatoID`: **"1"** (indica mensagem do sistema)
   - `mensagemWhatsAppId`/`mensagemInstagramId`: messageId retornado
3. Adiciona ao array de mensagens
4. Ordena por dataHora
5. Atualiza `ultimaMensagem` e `dataUltimaMensagem` do contato

**Importante:** `contatoID === "1"` identifica mensagens enviadas pelo sistema.

---

### 11. Atualização de Propriedades

**Arquivos:**
- `src/lib/utils/gerenciadorDeConversa.ts` (atualiza para `true`)
- `src/lib/utils/setContactProperty.ts` (atualiza para `true` ou `false`)
- `src/lib/utils/updateResumoCaso.ts` (atualiza `resumoCaso`)
- `src/lib/utils/updateNomeCompleto.ts` (atualiza `nomeCompleto`)

**Propriedades Atualizáveis:**
- `saudacao`, `pedidoResumo`, `confirmacaoResumo`
- `urgenciaDefinida`, `selecionandoData`
- `propostaAgendamento`, `confirmaAgendamento`
- `resumoCaso` (string)
- `nomeCompleto` (string)

---

### 12. Emissão de Evento SSE Final

Após enviar mensagem da IA:
```typescript
emitEvent({
  type: 'mensagem_enviada',
  contatoId: contatoId,
  contato: numero/username,
  data: {
    mensagem: mensagemEnviada,
  },
});
```

Frontend atualiza interface em tempo real.

---

## 📊 Estrutura de Dados

### Modelo: Contato

**Coleção:** `contatos`

```typescript
{
  _id: ObjectId,
  contato: string,              // wa_id (único, indexado)
  contatoNome: string,          // Nome do contato
  ultimaMensagem: string,       // Última mensagem recebida
  dataUltimaMensagem: Date,      // Data da última mensagem
  status: string,                // Status do funil
  tags: string[],               // Tags do contato
  nota: string,                  // Notas internas
  favorito: boolean,            // Se é favorito
  arquivar: boolean,             // Se está arquivado
  
  // Propriedades de controle de fluxo
  saudacao: boolean,             // Se já foi cumprimentado
  pedidoResumo: boolean,         // Se já pediu resumo
  confirmacaoResumo: boolean,    // Se resumo foi confirmado
  urgenciaDefinida: boolean,     // Se urgência foi definida
  selecionandoData: boolean,     // Se está selecionando data
  propostaAgendamento: boolean,  // Se agendamento foi proposto
  confirmaAgendamento: boolean,  // Se agendamento foi confirmado
  
  // Dados coletados
  nomeCompleto: string,          // Nome completo do cliente
  resumoCaso: string,            // Resumo do caso
  produtoInteresse: string,      // Produto de interesse
  
  createdAt: Date,
  updatedAt: Date
}
```

### Modelo: ContatoDM (Instagram)

**Coleção:** `contatos-dm`

Estrutura idêntica ao `Contato`, mas:
- `contato`: username do Instagram (ex: `@usuario`)
- Usa `mensagemInstagramId` ao invés de `mensagemWhatsAppId`

### Modelo: Mensagem

**Coleção:** `mensagens`

```typescript
{
  _id: ObjectId,
  contatoID: ObjectId,          // Referência ao Contato
  mensagens: [MensagemUnica],   // Array de mensagens
  createdAt: Date,
  updatedAt: Date
}
```

### Modelo: MensagemUnica (Subdocumento)

```typescript
{
  _id: ObjectId,
  mensagemWhatsAppId: string,   // ID único do WhatsApp (ou mensagemInstagramId)
  mensagem: string,              // Texto da mensagem
  dataHora: Date,                // Data/hora da mensagem
  tipo: string,                  // texto, imagem, audio, video, documento, etc.
  contatoID: string,            // "1" = sistema, senão = ID do contato
  
  // Campos de mídia (opcionais)
  midiaId: string,
  midiaUrl: string,
  midiaNome: string,
  midiaTamanho: number,
  midiaMimeType: string
}
```

**Importante:** `contatoID === "1"` identifica mensagens enviadas pelo sistema.

### Modelo: AtendimentoAI

**Coleção:** `atendimento-ai`

```typescript
{
  _id: ObjectId,
  nome: string,                  // Nome único do prompt (ex: "Novo Contato")
  prompt: string,                 // Template do prompt com variáveis
  numMaxMsg: number,              // Número máximo de mensagens (não usado atualmente)
  createdAt: Date,
  updatedAt: Date
}
```

**Prompts Principais:**
- `"Definição Base"` - Prompt base do sistema
- `"Novo Contato"` - Saudação inicial
- `"Triagem em Andamento"` - Solicitação de informações
- `"Verificador de Resumo"` - Gera resumo do caso
- `"Validação de Resumo"` - Confirma resumo com cliente
- `"Validação do Resumo e Incorporação"` - Valida se resumo está correto
- `"Validação de Urgência"` - Define urgência do caso
- `"Urgência Não Definida"` - Quando urgência não foi definida
- `"Solicitação de Nome"` - Solicita nome completo
- `"Validação de Nome"` - Valida se nome foi identificado
- `"Oferecendo Agendamento"` - Oferece agendamento
- `"Validação de Agendamento"` - Valida se agendamento foi aceito
- `"Agendamento Aceito"` - Confirma agendamento aceito
- `"Agendamento Não Aceito"` - Trata agendamento recusado

### Modelo: Config

**Coleção:** `config`

```typescript
{
  _id: ObjectId,
  numMsgHist: number,            // Número de mensagens para histórico (padrão: 10)
  duracaoAgendamento: string,    // Duração padrão (ex: "2:00")
  pararAtendimento: string,      // Configuração de parada
  horarioInicio: string,         // Horário de início (ex: "08:00")
  horarioFim: string,            // Horário de fim (ex: "18:00")
  horarioInicioSab: string,      // Horário início sábado
  horarioFimSab: string,         // Horário fim sábado
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎨 Sistema de Prompts

### Armazenamento

Prompts são armazenados na coleção `atendimento-ai` com:
- `nome`: Identificador único (ex: "Novo Contato")
- `prompt`: Template com variáveis (ex: `"Olá {[PRIMEIRO NOME]}! {[PROMPT BASE]}"`)

### Busca

```typescript
const promptDoc = await AtendimentoAI.findOne({ nome: 'Novo Contato' }).lean();
const promptTemplate = promptDoc.prompt;
```

### Processamento de Variáveis

Todas as variáveis no formato `{[VARIAVEL]}` são substituídas por valores reais antes de enviar para a IA.

---

## 🔀 Controle de Fluxo Conversacional

### Máquina de Estados

O sistema usa uma máquina de estados baseada em propriedades booleanas do contato:

```
Estado Inicial (Novo Contato)
  ↓ saudacao = true
Triagem
  ↓ pedidoResumo = true
Verificação de Resumo
  ↓ confirmacaoResumo = true
Validação do Resumo
  ↓ urgenciaDefinida = true
Validação de Urgência
  ↓ selecionandoData = true
Validação de Nome
  ↓ propostaAgendamento = true
Validação de Agendamento
  ↓ confirmaAgendamento = true
Fim (Agendamento Confirmado)
```

### Decisões Condicionais

Alguns fluxos têm decisões condicionais baseadas na resposta da IA:

- **Validação de Agendamento:** Aceito ou Não Aceito
- **Validação de Nome:** Nome identificado ou não
- **Validação do Resumo:** Resumo correto ou incorreto
- **Validação de Urgência:** Processo definido ou não

---

## 💾 Armazenamento

### Estrutura de Mensagens

Mensagens são armazenadas em um array dentro do documento `Mensagem`:

```
Mensagem {
  contatoID: ObjectId,
  mensagens: [
    { mensagem: "Oi", contatoID: "contato123", ... },      // Cliente
    { mensagem: "Olá!", contatoID: "1", ... },              // Sistema
    { mensagem: "Preciso de ajuda", contatoID: "contato123", ... }, // Cliente
    ...
  ]
}
```

### Ordenação

Mensagens são sempre ordenadas por `dataHora` (mais antiga primeiro) após cada inserção.

### Prevenção de Duplicatas

Antes de adicionar mensagem, verifica se `mensagemWhatsAppId`/`mensagemInstagramId` já existe no array.

---

## ⚡ Debounce e Performance

### Sistema de Debounce

**Objetivo:** Evitar múltiplas respostas quando cliente envia várias mensagens rapidamente.

**Implementação:**
- Timer de 10 segundos (configurável)
- Se nova mensagem chega antes do timer expirar, cancela timer anterior
- Após 10s sem novas mensagens, processa IA uma única vez

**Exemplo:**
```
t=0s:  Mensagem 1 → Timer 10s iniciado
t=2s:  Mensagem 2 → Timer anterior cancelado, novo timer 10s
t=5s:  Mensagem 3 → Timer anterior cancelado, novo timer 10s
t=15s: Timer expira → Processa IA com TODAS as 3 mensagens
```

### Cache de Conexão MongoDB

`src/lib/db.ts` implementa cache global para reutilizar conexão MongoDB durante hot-reload do Next.js.

---

## 🔍 Pontos Importantes

### Identificação de Mensagens do Sistema

- `contatoID === "1"` → Mensagem enviada pelo sistema
- `contatoID !== "1"` → Mensagem recebida do cliente

### Ordem de Mensagens

- **Armazenamento:** Mais antiga primeiro
- **Histórico para IA:** Mais antiga primeiro (configurável)
- **Frontend:** Geralmente mostra mais recente primeiro

### Suporte a Mídia

- **WhatsApp:** Baixa mídia e salva no GridFS
- **Instagram:** Usa URL direta (não baixa)

### Tratamento de Erros

- Webhooks sempre retornam `200 OK` mesmo em caso de erro interno
- Erros são logados mas não quebram o fluxo
- Mensagens duplicadas são ignoradas silenciosamente

---

## 📝 Resumo do Fluxo Completo

```
1. Cliente envia mensagem via WhatsApp/Instagram
   ↓
2. Webhook recebe POST do Meta
   ↓
3. extractData() extrai dados
   ↓
4. validateMessage() valida dados
   ↓
5. processMessage() salva no banco
   - Cria/atualiza Contato
   - Adiciona MensagemUnica ao array
   ↓
6. emitEvent() → Frontend atualiza (SSE)
   ↓
7. scheduleAIProcessing() agenda processamento (debounce 10s)
   ↓
8. verificadorDeConversa() determina prompt
   ↓
9. AtendimentoAI.findOne() busca prompt do banco
   ↓
10. processPromptVariables() substitui variáveis
    ↓
11. generateOllamaJSONResponse() ou generateOllamaCustomJSON()
    - Envia prompt para Ollama
    - Recebe resposta JSON
    ↓
12. sendWhatsAppMessage() envia resposta
    ↓
13. saveSystemMessage() salva mensagem enviada
    - Adiciona MensagemUnica com contatoID = "1"
    ↓
14. gerenciadorDeConversa() ou setContactProperty() atualiza propriedades
    ↓
15. emitEvent() → Frontend atualiza (SSE)
```

---

**Documentação criada em:** ${new Date().toLocaleDateString('pt-BR')}
**Versão do Sistema:** 0.1.0
