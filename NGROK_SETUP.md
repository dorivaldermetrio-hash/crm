# Configuração do ngrok

Este guia explica como configurar o ngrok para expor seu projeto Next.js publicamente, necessário para configurar webhooks da API oficial do WhatsApp Business.

## 📋 Pré-requisitos

1. **Instalar o ngrok**

   **Windows (usando Chocolatey):**
   ```bash
   choco install ngrok
   ```

   **macOS (usando Homebrew):**
   ```bash
   brew install ngrok
   ```

   **Linux:**
   ```bash
   # Baixe o binário em: https://ngrok.com/download
   # Ou use snap:
   snap install ngrok
   ```

   **Ou baixe manualmente:**
   - Acesse: https://ngrok.com/download
   - Baixe o arquivo para seu sistema operacional
   - Extraia e adicione ao PATH do sistema

2. **Criar conta no ngrok (opcional, mas recomendado)**
   - Acesse: https://dashboard.ngrok.com/signup
   - Crie uma conta gratuita
   - Obtenha seu authtoken em: https://dashboard.ngrok.com/get-started/your-authtoken
   - Configure o token:
     ```bash
     ngrok config add-authtoken SEU_TOKEN_AQUI
     ```

## 🚀 Como usar

### Método 1: Usando os scripts npm (Recomendado)

1. **Inicie o servidor Next.js:**
   ```bash
   npm run dev
   ```

2. **Em outro terminal, inicie o ngrok:**
   ```bash
   npm run ngrok
   ```

3. **Para obter a URL pública:**
   ```bash
   npm run ngrok:url
   ```

### Método 2: Usando o ngrok diretamente

1. **Inicie o servidor Next.js:**
   ```bash
   npm run dev
   ```

2. **Em outro terminal, execute:**
   ```bash
   ngrok http 3000
   ```

## 📱 Acessando a URL pública

Após iniciar o ngrok, você verá algo como:

```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

A URL `https://abc123.ngrok-free.app` é sua URL pública que pode ser usada para configurar o webhook.

### Dashboard do ngrok

Você também pode acessar o dashboard do ngrok em:
- **http://localhost:4040** (quando o ngrok estiver rodando)

No dashboard você verá:
- Todas as requisições recebidas
- A URL pública atual
- Estatísticas de uso

## 🔧 Configuração do Webhook do WhatsApp

Quando for configurar o webhook da API oficial do WhatsApp Business, use:

```
https://SUA_URL_NGROK.ngrok-free.app/api/webhook
```

**Exemplo:**
```
https://abc123.ngrok-free.app/api/webhook
```

## ⚠️ Importante

1. **URL temporária**: A URL do ngrok muda a cada vez que você reinicia (no plano gratuito). Para ter uma URL fixa, você precisa do plano pago.

2. **Segurança**: O ngrok expõe seu servidor local publicamente. Use apenas em desenvolvimento.

3. **Limites do plano gratuito**: 
   - 1 túnel simultâneo
   - Limite de conexões
   - URLs que expiram

## 🐛 Solução de problemas

### Erro: "ngrok: command not found"
- Certifique-se de que o ngrok está instalado e no PATH do sistema
- Reinicie o terminal após instalar

### Erro: "O servidor Next.js não está rodando"
- Execute `npm run dev` primeiro
- Verifique se está rodando na porta 3000

### URL não está funcionando
- Verifique se o ngrok está rodando
- Verifique se o servidor Next.js está rodando
- Acesse o dashboard em http://localhost:4040 para ver o status

## 📚 Recursos

- [Documentação oficial do ngrok](https://ngrok.com/docs)
- [Dashboard do ngrok](https://dashboard.ngrok.com)
- [API do ngrok](https://ngrok.com/docs/api)

