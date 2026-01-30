# 📊 Análise Completa do Projeto - WhatsApp CRM

## 🎯 Visão Geral

Este é um **sistema CRM completo** para gerenciamento de conversas e atendimento automatizado via **WhatsApp Business API** e **Instagram Direct Messages**, com integração de **IA local (Ollama)** para respostas automáticas inteligentes.

### Stack Tecnológica

- **Framework:** Next.js 16.1.6 (React 19.2.0)
- **Linguagem:** TypeScript
- **Banco de Dados:** MongoDB (Mongoose 9.0.0)
- **IA:** Ollama (modelo local) / OpenAI (configurável)
- **Estilização:** Tailwind CSS 4
- **Outras:** Cloudinary (imagens), Google Ads API, Nodemailer

---

## 📁 Estrutura do Projeto

### Arquitetura Principal

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # Rotas de API (Backend)
│   │   ├── webhook/       # Webhook WhatsApp
│   │   ├── webhook-instagram/ # Webhook Instagram
│   │   ├── contatos/      # CRUD de contatos
│   │   ├── dashboard/     # Dados do dashboard
│   │   ├── atendimento-ai/ # Gerenciamento de prompts
│   │   └── ...
│   ├── contatos/          # Página de contatos
│   ├── conversas/         # Página de conversas
│   ├── dashboard/         # Dashboard principal
│   └── ...
├── components/            # Componentes React
├── lib/
│   ├── models/           # Modelos Mongoose
│   ├── utils/            # Utilitários e helpers
│   └── config/           # Configurações (IA, etc)
└── contexts/             # Contextos React
```

---

## 🗄️ Modelos de Dados (MongoDB)

### 1. **Contato** (`contatos`)
Gerenciamento de contatos do WhatsApp

**Campos principais:**
- `contato`: Número do WhatsApp (único)
- `contatoNome`: Nome do contato
- `ultimaMensagem`: Última mensagem recebida
- `dataUltimaMensagem`: Timestamp da última mensagem
- `status`: Enum de status do funil
  - 'Novo Contato'
  - 'Triagem em Andamento'
  - 'Triagem Jurídica Concluída'
  - 'Caso Urgente'
  - 'Encaminhado para Atendimento Humano'
  - 'Não é caso Jurídico'
- `tags`: Array ['Urgente', 'Importante', 'Seguimento', 'Cliente', 'Prospecto']
- `favorito`: Boolean
- `arquivar`: Boolean
- `produtoInteresse`: String
- **Flags de controle de fluxo:**
  - `saudacao`: Boolean
  - `pedidoResumo`: Boolean
  - `confirmacaoResumo`: Boolean
  - `urgenciaDefinida`: Boolean
  - `selecionandoData`: Boolean
  - `propostaAgendamento`: Boolean
  - `confirmaAgendamento`: Boolean
- **Dados do caso:**
  - `nomeCompleto`: String
  - `resumoCaso`: String
  - `informacoesCaso`: String
  - `inicialConcluido`: Boolean

### 2. **ContatoDM** (`contatos-dm`)
Mesma estrutura do Contato, mas para Instagram Direct Messages

### 3. **Mensagem** (`mensagens`)
Histórico de mensagens do WhatsApp

**Estrutura:**
- `contatoID`: ObjectId referenciando Contato
- `mensagens`: Array de `MensagemUnica`

**MensagemUnica:**
- `mensagemWhatsAppId`: ID único da mensagem
- `mensagem`: Texto da mensagem
- `dataHora`: Date
- `tipo`: 'texto' | 'imagem' | 'audio' | 'video' | 'documento' | 'localizacao'
- `contatoID`: '1' (sistema) ou ID do contato
- `transcricao`: String (para áudio)
- `midiaId`, `midiaUrl`, `midiaNome`, etc. (para mídias)

### 4. **MensagemDM** (`mensagens-dm`)
Mesma estrutura do Mensagem, mas para Instagram

### 5. **AtendimentoAI** (`atendimento-ai`)
Configuração de prompts para IA

**Campos:**
- `nome`: String (único) - Nome do prompt
- `prompt`: String - Texto do prompt
- `numMaxMsg`: Number - Número máximo de mensagens

**Prompts principais identificados:**
- 'Novo Contato'
- 'Triagem em Andamento'
- 'Verificador de Resumo'
- 'Validação de Resumo'
- 'Validação do Resumo e Incorporação'
- 'Validação de Urgência'
- 'Urgência Não Definida'
- 'Solicitação de Nome'
- 'Validação de Nome'
- 'Oferecendo Agendamento'
- 'Validação de Agendamento'
- 'Agendamento Aceito'
- 'Agendamento Não Aceito'

### 6. **Agendamento** (`agendamentos`)
Agendamentos de consultas

**Campos:**
- `nome`: String
- `data`: String (YYYY-MM-DD)
- `horarioInicio`: String (HH:MM)
- `duracao`: String (HH:MM)
- `notas`: String
- `status`: String (padrão: 'agendado')

### 7. **Outros Modelos**
- `ContatoEmail`: Contatos de email
- `Produto`: Produtos/serviços
- `Profissional`: Profissionais
- `TemplateWS`: Templates de mensagens WhatsApp
- `TemplateCampanha`: Templates de campanhas
- `FeedPost`: Posts do Instagram
- `GoogleAdsAccount`: Contas do Google Ads
- `Config`: Configurações gerais

---

## 🔄 Fluxo de Processamento de Mensagens

### 1. Recebimento (Webhook)

**WhatsApp:** `/api/webhook`
- GET: Verificação do webhook (Meta)
- POST: Recebimento de mensagens

**Instagram:** `/api/webhook-instagram`
- GET: Verificação do webhook
- POST: Recebimento de mensagens

### 2. Extração de Dados

**Arquivos:**
- `extractData.ts` (WhatsApp)
- `extractDataInstagram.ts` (Instagram)

**Extrai:**
- Identificador do contato
- Nome do contato
- ID da mensagem
- Texto/mídia
- Timestamp
- Tipo de mensagem

### 3. Processamento e Armazenamento

**Arquivos:**
- `processMessage.ts` (WhatsApp)
- `processMessageInstagram.ts` (Instagram)

**Fluxo:**
1. Busca ou cria contato
2. Cria/atualiza mensagem no histórico
3. Processa mídia (se houver) → GridFS
4. Transcreve áudio (se houver) → Ollama Whisper
5. Emite evento SSE para frontend

### 4. Processamento de IA (com Debounce)

**Arquivo:** `messageDebouncer.ts`
- Debounce de 10 segundos para evitar múltiplas respostas

**Fluxo:**
1. `verificadorDeConversa()` determina qual prompt executar
2. Busca prompt no banco (`AtendimentoAI`)
3. Processa variáveis do prompt (`processPromptVariables.ts`)
4. Gera resposta via Ollama (`ollama.ts`)
5. Envia mensagem via WhatsApp/Instagram
6. Salva mensagem enviada
7. Atualiza propriedades do contato

---

## 🤖 Sistema de IA e Fluxo Conversacional

### Verificador de Conversa

**Arquivo:** `verificadorDeConversa.ts`

**Lógica de decisão baseada em flags do contato:**

1. **Se `saudacao === false`:**
   - Prompt: 'Novo Contato'
   - Atualiza: `saudacao = true`

2. **Se `saudacao === true` e `pedidoResumo === false`:**
   - Prompt: 'Triagem em Andamento'
   - Atualiza: `pedidoResumo = true`

3. **Se `pedidoResumo === true` e `confirmacaoResumo === false`:**
   - Prompt: 'Verificador de Resumo'
   - Depois: 'Validação de Resumo'
   - Atualiza: `confirmacaoResumo = true`

4. **Se `confirmacaoResumo === true`:**
   - Prompt: 'Validação do Resumo e Incorporação'
   - Se resumo incorreto: Reexecuta 'Verificador de Resumo'
   - Se resumo correto: 'Validação de Urgência'

5. **Se `urgenciaDefinida === true`:**
   - Prompt: 'Validação de Urgência' (fluxo final)
   - Depois: 'Solicitação de Nome'
   - Atualiza: `selecionandoData = true`

6. **Se `selecionandoData === true`:**
   - Prompt: 'Validação de Nome'
   - Se nome não identificado: Reexecuta 'Solicitação de Nome'
   - Se nome identificado: 'Oferecendo Agendamento'
   - Atualiza: `propostaAgendamento = true`

7. **Se `propostaAgendamento === true`:**
   - Prompt: 'Validação de Agendamento'
   - Se aceito: Cria agendamento → 'Agendamento Aceito'
   - Se não aceito: 'Agendamento Não Aceito'
   - Atualiza: `confirmaAgendamento = true`

### Processamento de Variáveis

**Arquivo:** `processPromptVariables.ts`

**Variáveis disponíveis nos prompts:**
- `{nome}`: Nome do contato
- `{ultimaMensagem}`: Última mensagem recebida
- `{resumoCaso}`: Resumo do caso
- `{nomeCompleto}`: Nome completo
- `{informacoesCaso}`: Informações do caso
- `{historico}`: Histórico de mensagens
- E outras...

### Geração de Respostas

**Arquivos:**
- `ollama.ts`: Integração com Ollama
- `generateOllamaJSONResponse.ts`: Respostas em JSON
- `generateOllamaCustomJSON.ts`: Respostas JSON customizadas

**Modelos suportados:**
- Ollama (local): `llama3.1:8b` (padrão)
- OpenAI: `gpt-4o-mini` (configurável)

**Configuração:** `src/lib/config/ai.ts`

---

## 🎨 Interface do Usuário

### Páginas Principais

1. **Dashboard** (`/`)
   - Métricas gerais
   - Gráficos de tendência
   - Atividades recentes
   - Contatos que precisam de follow-up
   - Top contatos
   - Resumo do funil
   - Status do sistema

2. **Contatos** (`/contatos`)
   - Lista de contatos WhatsApp
   - Filtros (status, tags, favoritos, arquivados)
   - Busca
   - CRUD de contatos

3. **Conversas** (`/conversas`)
   - Lista de conversas
   - Modal de chat
   - Envio de mensagens
   - Visualização de histórico

4. **Agenda** (`/agenda`)
   - Calendário de agendamentos
   - Visualização e criação de eventos

5. **Campanhas** (`/campanhas`)
   - Campanhas de WhatsApp e Email
   - Templates
   - Envio em massa

6. **Templates** (`/templates`)
   - Gerenciamento de templates

7. **Automações** (`/automacoes`)
   - Configuração de automações

8. **Instagram DM** (`/instagram-dm`)
   - Gerenciamento de mensagens do Instagram

9. **Google Ads** (`/google-ads`)
   - Integração com Google Ads

10. **Relatórios** (`/relatorios`)
    - Relatórios e análises

11. **Configurações** (`/configuracoes`)
    - Configurações gerais do sistema

### Componentes Principais

- `Sidebar.tsx`: Menu lateral responsivo
- `ChatModal.tsx`: Modal de conversa
- `ContatoCard.tsx`: Card de contato
- `CriarContatoModal.tsx`: Modal de criação
- `EditarContatoModal.tsx`: Modal de edição
- `OllamaResponseLogger.tsx`: Logger de respostas da IA

### Server-Sent Events (SSE)

**Arquivo:** `src/app/api/events/route.ts`
- Atualizações em tempo real
- Eventos: `nova_mensagem`, `mensagem_enviada`, `contato_atualizado`

**Hook:** `useServerEvents.ts`
- Conecta frontend ao SSE
- Callbacks para cada tipo de evento

---

## 🔧 Funcionalidades Principais

### 1. Webhooks
- ✅ WhatsApp Business API
- ✅ Instagram Direct Messages
- ✅ Verificação de webhook
- ✅ Processamento assíncrono

### 2. Processamento de Mídia
- ✅ Download de mídias (WhatsApp)
- ✅ Armazenamento em GridFS
- ✅ Upload para Cloudinary
- ✅ Transcrição de áudio (Ollama Whisper)

### 3. Sistema de IA
- ✅ Respostas automáticas contextuais
- ✅ Fluxo conversacional estruturado
- ✅ Suporte a múltiplos prompts
- ✅ Validações e verificações
- ✅ Geração de resumos
- ✅ Criação automática de agendamentos

### 4. Gerenciamento de Contatos
- ✅ CRUD completo
- ✅ Status e tags
- ✅ Favoritos e arquivamento
- ✅ Histórico de mensagens
- ✅ Notas e informações do caso

### 5. Campanhas
- ✅ Campanhas WhatsApp
- ✅ Campanhas Email
- ✅ Templates com variáveis
- ✅ Envio em massa

### 6. Agendamentos
- ✅ Calendário de agendamentos
- ✅ Criação automática via IA
- ✅ Integração com Google Calendar (possível)

### 7. Integrações
- ✅ Google Ads API
- ✅ Cloudinary (imagens)
- ✅ Nodemailer (email)
- ✅ Instagram Graph API

---

## 📝 Variáveis de Ambiente Necessárias

```env
# MongoDB
MONGODB_URL=mongodb://...

# WhatsApp
WHATSAPP_VERIFY_TOKEN=seu_token
WHATSAPP_ACCESS_TOKEN=seu_token
WHATSAPP_PHONE_NUMBER_ID=seu_id

# Instagram
INSTAGRAM_VERIFY_TOKEN=seu_token
INSTAGRAM_ACCESS_TOKEN=seu_token

# IA
AI_PROVIDER=ollama  # ou 'openai'
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
OLLAMA_AUTO_REPLY_ENABLED=true
OPENAI_API_KEY=seu_key (se usar OpenAI)
OPENAI_MODEL=gpt-4o-mini

# Cloudinary
CLOUDINARY_CLOUD_NAME=seu_cloud
CLOUDINARY_API_KEY=seu_key
CLOUDINARY_API_SECRET=seu_secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email
EMAIL_PASS=sua_senha

# Google Ads
GOOGLE_ADS_CLIENT_ID=seu_id
GOOGLE_ADS_CLIENT_SECRET=seu_secret
GOOGLE_ADS_REFRESH_TOKEN=seu_token
```

---

## 🚀 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run start        # Produção
npm run ngrok        # Inicia ngrok
npm run ngrok:url    # Obtém URL do ngrok
```

---

## 🔍 Pontos de Atenção e Melhorias Possíveis

### 1. **Estrutura de Dados**
- ✅ Bem organizada com Mongoose
- ✅ Índices adequados
- ⚠️ Alguns campos podem ser otimizados

### 2. **Fluxo de IA**
- ✅ Sistema robusto de verificação de conversa
- ✅ Múltiplos fluxos condicionais
- ⚠️ Complexidade alta - pode ser refatorado em módulos menores

### 3. **Performance**
- ✅ Debounce implementado
- ✅ Cache de conexão MongoDB
- ⚠️ Algumas queries podem ser otimizadas

### 4. **Tratamento de Erros**
- ✅ Try-catch em pontos críticos
- ⚠️ Pode ser melhorado com logging estruturado

### 5. **Testes**
- ⚠️ Não há testes automatizados
- 💡 Sugestão: Adicionar testes unitários e de integração

### 6. **Documentação**
- ✅ Boa documentação em arquivos .md
- ✅ Código comentado
- 💡 Sugestão: Documentação de API (Swagger/OpenAPI)

---

## 📊 Métricas e Monitoramento

### Dashboard
- Total de contatos
- Contatos ativos (7 dias)
- Mensagens hoje
- Variação de mensagens
- Oportunidades quentes
- Novos contatos hoje
- Gráfico de tendência (7 dias)
- Resumo do funil
- Status do sistema

### Eventos SSE
- Atualizações em tempo real
- Notificações de novas mensagens
- Sincronização de estado

---

## 🎯 Casos de Uso Principais

1. **Atendimento Automatizado**
   - Cliente envia mensagem → IA responde automaticamente
   - Fluxo conversacional guiado
   - Criação automática de agendamentos

2. **Gerenciamento de Contatos**
   - Organização por status e tags
   - Histórico completo de conversas
   - Notas e informações do caso

3. **Campanhas de Marketing**
   - Envio em massa via WhatsApp/Email
   - Templates personalizados
   - Segmentação de contatos

4. **Agendamentos**
   - Calendário visual
   - Criação automática via IA
   - Gerenciamento de horários

5. **Relatórios e Análises**
   - Métricas de performance
   - Análise de conversas
   - Funil de vendas

---

## 🔐 Segurança

### Implementado
- ✅ Validação de webhook tokens
- ✅ Validação de dados de entrada
- ✅ Sanitização de inputs

### Sugestões
- 💡 Autenticação de usuários
- 💡 Rate limiting
- 💡 Criptografia de dados sensíveis
- 💡 Logs de auditoria

---

## 📈 Escalabilidade

### Pontos Fortes
- ✅ Arquitetura modular
- ✅ Separação de concerns
- ✅ Uso de cache (MongoDB)
- ✅ Processamento assíncrono

### Sugestões
- 💡 Queue system (Bull/BullMQ) para processamento pesado
- 💡 Redis para cache distribuído
- 💡 Load balancing
- 💡 CDN para assets estáticos

---

## 🎓 Conclusão

Este é um **sistema CRM completo e robusto** com:

✅ **Funcionalidades avançadas:**
- Atendimento automatizado com IA
- Gerenciamento completo de contatos
- Campanhas e templates
- Agendamentos automáticos
- Integrações múltiplas

✅ **Arquitetura sólida:**
- Next.js App Router
- TypeScript
- MongoDB com Mongoose
- Componentes React bem estruturados

✅ **Sistema de IA sofisticado:**
- Fluxo conversacional complexo
- Múltiplos prompts contextuais
- Validações e verificações
- Suporte a múltiplos providers

O projeto está **bem estruturado** e pronto para evoluções e melhorias contínuas.

---

**Data da Análise:** 2024
**Versão do Projeto:** 0.1.0
