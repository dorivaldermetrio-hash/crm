# 🔍 Diagnóstico do Webhook do Instagram

## Problema: Nenhum log aparece quando recebe mensagem

Se você enviou uma mensagem mas não viu nenhum log no console, siga estes passos:

## ✅ Checklist de Verificação

### 1. Verificar se o servidor está rodando
```bash
# O servidor deve estar rodando na porta 3000
npm run dev
```

### 2. Verificar se o Ngrok está rodando
```bash
# Em outro terminal, verifique se o ngrok está ativo
# Você deve ver uma URL HTTPS como: https://abc123.ngrok-free.app
```

### 3. Verificar a URL do Webhook no Meta Developers

1. Acesse: https://developers.facebook.com
2. Vá em **My Apps** → Seu App → **Instagram** → **Messaging**
3. Verifique se a URL do webhook está correta:
   ```
   https://SUA_URL_NGROK.ngrok-free.app/api/webhook-instagram
   ```
   ⚠️ **IMPORTANTE:** A URL deve terminar com `/api/webhook-instagram`

### 4. Verificar se o Webhook está INSCRITO nos eventos

No Meta Developers, na seção de Webhooks:
- ✅ Deve estar marcado o campo **`messages`**
- ✅ O webhook deve estar com status **"Subscribed"** ou **"Active"**

### 5. Testar se o Webhook está acessível

Abra no navegador (deve retornar 403, mas significa que está acessível):
```
https://SUA_URL_NGROK.ngrok-free.app/api/webhook-instagram
```

### 6. Verificar logs do Ngrok

No terminal do ngrok, você deve ver requisições quando:
- O Meta tenta verificar o webhook
- Uma mensagem é recebida

Se não aparecer NADA no ngrok, o problema é que o Meta não está chamando seu webhook.

## 🐛 Problemas Comuns

### Problema 1: Webhook não está sendo chamado

**Sintomas:**
- Nenhum log aparece no console
- Nenhuma requisição aparece no ngrok

**Soluções:**
1. Verifique se o webhook está **verificado** no Meta Developers
2. Verifique se está **inscrito** no campo `messages`
3. Verifique se a URL está correta (sem espaços, com `/api/webhook-instagram`)
4. Tente **remover e adicionar** o webhook novamente no Meta Developers

### Problema 2: Webhook retorna erro 403

**Sintomas:**
- Logs mostram "Forbidden" ou erro 403

**Soluções:**
1. Verifique se `INSTAGRAM_VERIFY_TOKEN` está configurado no `.env.local`
2. Verifique se o token no `.env.local` é igual ao configurado no Meta Developers
3. Reinicie o servidor após alterar o `.env.local`

### Problema 3: Webhook recebe requisição mas não processa

**Sintomas:**
- Logs mostram "🔔 REQUISIÇÃO POST RECEBIDA" mas não processa a mensagem

**Soluções:**
1. Verifique os logs para ver qual formato está sendo recebido
2. O objeto pode não ser `instagram` - verifique o log "Tipo recebido:"
3. Pode ser que o formato do webhook mudou - verifique a documentação do Instagram

### Problema 4: Permissões não configuradas

**Sintomas:**
- Webhook verificado mas não recebe mensagens

**Soluções:**
1. Vá em **App Review** no Meta Developers
2. Solicite as permissões:
   - `instagram_basic`
   - `instagram_manage_messages`
   - `pages_manage_metadata`
3. Aguarde aprovação (pode levar alguns dias)

## 🧪 Teste Manual

### Teste 1: Verificar se o endpoint está acessível

```bash
# No terminal, teste se o endpoint responde:
curl https://SUA_URL_NGROK.ngrok-free.app/api/webhook-instagram
# Deve retornar 403 (isso é normal, significa que está acessível)
```

### Teste 2: Simular uma requisição do Instagram

```bash
# Envie uma requisição POST simulando o formato do Instagram:
curl -X POST https://SUA_URL_NGROK.ngrok-free.app/api/webhook-instagram \
  -H "Content-Type: application/json" \
  -d '{
    "object": "instagram",
    "entry": [{
      "changes": [{
        "field": "messages",
        "value": {
          "from": {
            "id": "123456789",
            "username": "@teste"
          },
          "message": {
            "id": "test_123",
            "text": "Mensagem de teste"
          },
          "timestamp": 1234567890
        }
      }]
    }]
  }'
```

Você deve ver logs no console do servidor.

## 📊 O que os logs devem mostrar

Quando uma mensagem é recebida, você deve ver:

```
🔔 ========================================
🔔 REQUISIÇÃO POST RECEBIDA NO WEBHOOK INSTAGRAM
🔔 ========================================
Timestamp: 2024-01-01T12:00:00.000Z
URL: https://...
Method: POST

📨 ========================================
📨 MENSAGEM RECEBIDA DO INSTAGRAM
📨 ========================================
...
```

Se você NÃO vê nem o primeiro log (`🔔 REQUISIÇÃO POST RECEBIDA`), significa que o webhook não está sendo chamado pelo Meta.

## 🔧 Próximos Passos

1. ✅ Verifique todos os itens do checklist acima
2. ✅ Teste manualmente com curl
3. ✅ Verifique os logs do ngrok
4. ✅ Tente remover e reconfigurar o webhook no Meta Developers
5. ✅ Verifique se a conta do Instagram está conectada ao app

## 📞 Se ainda não funcionar

1. Capture os logs completos do servidor
2. Capture os logs do ngrok
3. Verifique a documentação oficial: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/messaging

