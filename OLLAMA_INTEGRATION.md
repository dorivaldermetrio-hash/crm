# Integração com Ollama - Respostas Automáticas

Esta funcionalidade permite que o sistema responda automaticamente às mensagens recebidas no WhatsApp usando um modelo de IA rodando localmente via Ollama.

## 📋 Pré-requisitos

1. ✅ Ollama instalado e rodando no seu computador
2. ✅ Modelo `llama3.1:8b` (ou outro) baixado e disponível
3. ✅ Servidor Ollama rodando (padrão: `http://localhost:11434`)

## 🚀 Como Instalar o Ollama

### Windows/Mac/Linux

1. Baixe o Ollama em: https://ollama.ai
2. Instale seguindo as instruções do site
3. Baixe o modelo que deseja usar:
   ```bash
   ollama pull llama3.1:8b
   ```
4. Verifique se está rodando:
   ```bash
   ollama list
   ```

## ⚙️ Configuração

Adicione as seguintes variáveis no arquivo `.env.local`:

```env
# Integração Ollama (Respostas Automáticas)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
OLLAMA_AUTO_REPLY_ENABLED=true
```

### Variáveis de Ambiente

- **OLLAMA_URL** (opcional): URL do servidor Ollama. Padrão: `http://localhost:11434`
- **OLLAMA_MODEL** (opcional): Nome do modelo a ser usado. Padrão: `llama3.1:8b`
- **OLLAMA_AUTO_REPLY_ENABLED** (opcional): Habilita/desabilita respostas automáticas. Padrão: `true` (habilitado)

### Desabilitar Respostas Automáticas

Para desabilitar temporariamente, adicione no `.env.local`:

```env
OLLAMA_AUTO_REPLY_ENABLED=false
```

## 🔄 Como Funciona

1. **Mensagem Recebida**: Quando uma mensagem de texto é recebida via webhook
2. **Histórico Buscado**: O sistema busca as últimas 10 mensagens da conversa
3. **Resposta Gerada**: O Ollama gera uma resposta baseada no histórico e na mensagem atual
4. **Resposta Enviada**: A resposta é enviada automaticamente via WhatsApp

### Contexto da Conversa

O sistema mantém o contexto da conversa incluindo:
- Últimas 10 mensagens trocadas
- Nome do contato (quando disponível)
- Mensagens anteriores para manter coerência

## 🧪 Testando

1. Certifique-se de que o Ollama está rodando:
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. Envie uma mensagem de teste para o número conectado ao WhatsApp Business

3. Verifique os logs no console do servidor para ver:
   - Busca do histórico
   - Geração da resposta
   - Envio da mensagem

## ⚠️ Limitações

- **Apenas mensagens de texto**: Respostas automáticas só funcionam para mensagens de texto
- **Mensagens com mídia**: Imagens, áudios e outros tipos não geram respostas automáticas
- **Modelo local**: Requer que o Ollama esteja rodando no mesmo computador ou acessível via rede

## 🔧 Troubleshooting

### Erro: "Não foi possível conectar ao Ollama"

**Solução**: Verifique se o Ollama está rodando:
```bash
# Windows (PowerShell)
Test-NetConnection -ComputerName localhost -Port 11434

# Linux/Mac
curl http://localhost:11434/api/tags
```

### Respostas não estão sendo enviadas

**Verifique**:
1. `OLLAMA_AUTO_REPLY_ENABLED=true` no `.env.local`
2. O modelo especificado existe (`ollama list`)
3. Os logs do console para erros específicos

### Modelo não encontrado

**Solução**: Baixe o modelo novamente:
```bash
ollama pull llama3.1:8b
```

Ou use outro modelo disponível e atualize `OLLAMA_MODEL` no `.env.local`

## 📝 Exemplo Completo de .env.local

```env
# MongoDB
MONGODB_URL=mongodb+srv://...

# Webhook
WHATSAPP_VERIFY_TOKEN=seu_token_secreto

# WhatsApp API - Envio
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=seu_access_token

# Ollama - Respostas Automáticas
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
OLLAMA_AUTO_REPLY_ENABLED=true
```

