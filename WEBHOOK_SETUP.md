# Configuração do Webhook do WhatsApp Business API

Este guia explica como configurar o webhook para receber mensagens do WhatsApp Business API.

## 📋 Pré-requisitos

1. ✅ Projeto Next.js rodando
2. ✅ ngrok configurado e rodando
3. ✅ Conta no Meta for Developers
4. ✅ Aplicativo WhatsApp Business configurado

## 🔧 Passo 1: Criar e Configurar o Token de Verificação

### O que é o Token de Verificação?

O token de verificação é uma **senha secreta que VOCÊ mesmo cria**. É como uma chave que você inventa para provar que é você quem está configurando o webhook.

**⚠️ IMPORTANTE:** 
- NÃO é o Access Token do Facebook
- NÃO é um token gerado automaticamente
- É um token simples que VOCÊ cria na sua cabeça

### Como criar o token:

1. **Invente um token simples e seguro**, por exemplo:
   - `meu_token_secreto_123`
   - `webhook_whatsapp_2024`
   - `minha_senha_secreta_xyz`

2. **Adicione no arquivo `.env.local`:**
   ```env
   MONGODB_URL=mongodb+srv://...
   WHATSAPP_VERIFY_TOKEN=meu_token_secreto_123
   ```
   (Use o token que você criou, não copie este exemplo!)

3. **Use o MESMO token no Meta Developers** (no passo 3 abaixo)

**Dica:** Escolha algo que você consiga lembrar, mas que seja único e seguro.

## 🚀 Passo 2: Obter URL Pública do ngrok

1. Inicie o servidor Next.js:
   ```bash
   npm run dev
   ```

2. Em outro terminal, inicie o ngrok:
   ```bash
   npm run ngrok
   ```

3. Obtenha a URL pública:
   ```bash
   npm run ngrok:url
   ```

   Você verá algo como: `https://abc123.ngrok-free.app`

4. A URL completa do webhook será:
   ```
   https://abc123.ngrok-free.app/api/webhook
   ```

## 🔗 Passo 3: Configurar no Meta for Developers

### 3.1 Acessar o Painel

1. Acesse: https://developers.facebook.com/
2. Faça login com sua conta
3. Selecione seu aplicativo WhatsApp Business

### 3.2 Configurar o Webhook

1. No menu lateral, vá em **Configurações** → **Webhooks**
2. Clique em **Configurar Webhooks**
3. Selecione **WhatsApp Business Account**
4. Preencha os campos:
   - **URL de retorno de chamada (Callback URL):**
     ```
     https://SUA_URL_NGROK.ngrok-free.app/api/webhook
     ```
   - **Token de verificação:**
     ```
     meu_token_secreto_123
     ```
     ⚠️ **Use o MESMO token que você colocou no `.env.local`!**
     (Este é o token que você criou no Passo 1)

5. Clique em **Verificar e Salvar**

### 3.3 Assinar Eventos

Após verificar o webhook, você precisa assinar os eventos que deseja receber:

1. Na seção **Webhooks**, encontre o webhook configurado
2. Clique em **Gerenciar**
3. Marque os eventos que deseja receber:
   - ✅ **messages** - Para receber mensagens
   - ✅ **message_status** - Para receber status das mensagens (opcional)

4. Clique em **Salvar**

## ✅ Passo 4: Testar

1. **Verificar o webhook:**
   - Após configurar, o Meta tentará verificar o webhook
   - Você verá no console do Next.js:
     ```
     🔔 Webhook Verification Request:
     ✅ Webhook verificado com sucesso!
     ```

2. **Enviar uma mensagem de teste:**
   - Envie uma mensagem para o número do WhatsApp Business configurado
   - Você verá no console do Next.js todas as informações da mensagem:
     ```
     📨 ========================================
     📨 MENSAGEM RECEBIDA DO WHATSAPP
     📨 ========================================
     👤 Contato: ...
     💬 Mensagem: ...
     ```

## 📱 Estrutura da Mensagem Recebida

O webhook recebe um objeto JSON com a seguinte estrutura:

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "...",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "...",
              "phone_number_id": "..."
            },
            "contacts": [
              {
                "profile": {
                  "name": "Nome do Contato"
                },
                "wa_id": "5511999999999"
              }
            ],
            "messages": [
              {
                "from": "5511999999999",
                "id": "wamid.xxx",
                "timestamp": "1234567890",
                "type": "text",
                "text": {
                  "body": "Texto da mensagem"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

## 🐛 Solução de Problemas

### Webhook não está sendo verificado

- ✅ Verifique se o token no `.env.local` é exatamente o mesmo do Meta Developers
- ✅ Verifique se o servidor Next.js está rodando
- ✅ Verifique se o ngrok está rodando
- ✅ Verifique se a URL está correta (deve terminar com `/api/webhook`)

### Mensagens não estão chegando

- ✅ Verifique se o webhook foi verificado com sucesso
- ✅ Verifique se os eventos estão assinados (messages, message_status)
- ✅ Verifique o console do Next.js para ver erros
- ✅ Verifique o dashboard do ngrok (http://localhost:4040) para ver as requisições

### Erro 403 Forbidden

- O token de verificação não está correto
- Verifique se o `WHATSAPP_VERIFY_TOKEN` no `.env.local` corresponde ao token no Meta Developers

## 📚 Recursos

- [Documentação do WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Guia de Webhooks do WhatsApp](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- [Meta for Developers](https://developers.facebook.com/)

## ⚠️ Importante

1. **URL temporária**: A URL do ngrok muda a cada reinício (plano gratuito). Você precisará atualizar no Meta Developers sempre que reiniciar o ngrok.

2. **Segurança**: Em produção, use HTTPS real e valide todas as requisições.

3. **Token secreto**: Nunca compartilhe ou commite o token de verificação no Git.

