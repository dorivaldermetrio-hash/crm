# Configuração para Envio de Mensagens WhatsApp

Para enviar mensagens via WhatsApp Business API, você precisa configurar as seguintes variáveis de ambiente:

## 📋 Variáveis Necessárias

Adicione no arquivo `.env.local`:

```env
# WhatsApp Business API - Envio de Mensagens
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id_aqui
WHATSAPP_ACCESS_TOKEN=seu_access_token_aqui
```

## 🔑 Como Obter as Credenciais

### 1. Phone Number ID

1. Acesse: https://developers.facebook.com/
2. Selecione seu aplicativo WhatsApp Business
3. Vá em **Configurações** → **WhatsApp** → **Configuração**
4. Procure por **Phone number ID** (ou **ID do número de telefone**)
5. Copie o ID (exemplo: `123456789012345`)

### 2. Access Token

1. No mesmo painel, vá em **Configurações** → **Básico**
2. Role até **Tokens de acesso do aplicativo**
3. Clique em **Gerar token de acesso**
4. Selecione as permissões necessárias:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Copie o token gerado

**OU**

1. Vá em **Ferramentas** → **Explorador de API do Graph**
2. Selecione seu aplicativo
3. Em **Token de acesso**, você verá o token atual
4. Clique em **Gerar token de acesso** se necessário

## 📝 Exemplo de .env.local

```env
# MongoDB
MONGODB_URL=mongodb+srv://...

# Webhook
WHATSAPP_VERIFY_TOKEN=seu_token_secreto

# WhatsApp API - Envio
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAARZBodDW5AoBQNKVUmAvnKj88tlUiaRbI6pPBNcd41c3Otb15jWsMiLcKQyR1MYUhB0Teq6Iulu9MbTT4ZAmwaAVYgv3hjd3BlB0lUVMafvKR6Ux1WVXVu9nNa1yPBsAZCoknoIwMdem9240Jp66waPKKllZBR29mHOzQMAx5YVtZAZBSuIreWlS3AHa6qMOT
```

## ⚠️ Importante

1. **Segurança**: Nunca commite o `.env.local` no Git
2. **Token temporário**: Tokens de acesso podem expirar. Se parar de funcionar, gere um novo
3. **Permissões**: Certifique-se de que o token tem as permissões corretas
4. **Formato do número**: O sistema formata automaticamente o número para o formato internacional

## 🧪 Testar

Após configurar, envie uma mensagem pelo chatbot. Você verá no console:

```
📤 Enviando mensagem via WhatsApp API:
   Para: 5511999999999
   Mensagem: Sua mensagem aqui
✅ Mensagem enviada com sucesso!
   Message ID: wamid.xxx
```

## 🐛 Solução de Problemas

### Erro: "Configuração do WhatsApp não encontrada"
- Verifique se as variáveis estão no `.env.local`
- Reinicie o servidor após adicionar as variáveis

### Erro: "Invalid OAuth access token"
- O token expirou ou está inválido
- Gere um novo token no Meta Developers

### Erro: "Phone number ID not found"
- Verifique se o Phone Number ID está correto
- Certifique-se de que o número está ativo no WhatsApp Business

## 📚 Documentação

- [WhatsApp Business API - Send Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

