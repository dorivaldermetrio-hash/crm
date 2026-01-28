# Explicação dos Webhooks do Meta Developers

## 📌 Dois Tipos de Webhooks

No Meta for Developers, existem **dois tipos diferentes de webhooks**:

### 1. ✅ WhatsApp Business Account (O que você precisa)

- **Para quê:** Receber mensagens do WhatsApp Business
- **Onde configurar:** No produto "WhatsApp" do seu app
- **URL:** `https://SUA_URL_NGROK.ngrok-free.app/api/webhook`
- **Eventos:** `messages`, `message_status`

**Este é o webhook que você JÁ configurou e está funcionando!** ✅

### 2. ❌ User (NÃO precisa para WhatsApp)

- **Para quê:** Receber notificações sobre mudanças no perfil do usuário do Facebook/Instagram
- **Onde aparece:** No produto "User" do seu app
- **Eventos:** `name`, `email`, `profile_pic`, etc.

**Você NÃO precisa configurar este webhook para receber mensagens do WhatsApp!**

## 🔍 O que você viu no console

Quando o Meta verificou seu webhook, você viu:

```
Token: EAARZBodDW5AoBQNKVUmAvnKj88tlUiaRbI6pPBNcd41c3Otb15jWsMiLcKQyR1MYUhB0Teq6Iulu9MbTT4ZAmwaAVYgv3hjd3BlB0lUVMafvKR6Ux1WVXVu9nNa1yPBsAZCoknoIwMdem9240Jp66waPKKllZBR29mHOzQMAx5YVtZAZBSuIreWlS3AHa6qMOT
```

**Isso NÃO é o token de verificação!** Isso parece ser um Access Token do Facebook que foi enviado por engano.

## ✅ O que fazer agora

### 1. Crie e configure o token de verificação

**O token de verificação é algo que VOCÊ MESMO CRIA**, como uma senha secreta!

**Como fazer:**

1. **Invente um token simples** (exemplos):
   - `meu_token_secreto_123`
   - `webhook_whatsapp_2024`
   - `minha_senha_secreta_xyz`

2. **Adicione no `.env.local`:**
   ```env
   WHATSAPP_VERIFY_TOKEN=meu_token_secreto_123
   ```
   (Use o token que você criou!)

3. **Use o MESMO token no Meta Developers** quando configurar o webhook

**⚠️ Lembre-se:**
- NÃO é o Access Token do Facebook
- NÃO precisa ser gerado por nenhuma ferramenta
- É simplesmente uma senha que você inventa
- Deve ser o MESMO no `.env.local` e no Meta Developers

### 2. Ignore o webhook "User"

Você pode simplesmente **ignorar** a tela do webhook "User". Ele não é necessário para receber mensagens do WhatsApp.

### 3. Verifique se o webhook do WhatsApp está funcionando

1. Vá em **Configurações** → **Webhooks**
2. Procure pelo webhook do **WhatsApp Business Account**
3. Verifique se está marcado como **Verificado** ✅
4. Clique em **Gerenciar** e certifique-se de que o evento **messages** está assinado

### 4. Teste enviando uma mensagem

Envie uma mensagem para o número do WhatsApp Business e veja se aparece no console do Next.js.

## 🎯 Resumo

- ✅ **Webhook WhatsApp Business Account:** JÁ configurado e funcionando
- ❌ **Webhook User:** NÃO precisa configurar (é para Facebook/Instagram)
- 🔧 **Próximo passo:** Assinar o evento "messages" no webhook do WhatsApp

## 📚 Onde encontrar o webhook do WhatsApp

1. Acesse: https://developers.facebook.com/
2. Selecione seu app
3. No menu lateral: **WhatsApp** → **Configuração**
4. Ou: **Configurações** → **Webhooks** → Procure por "WhatsApp Business Account"

