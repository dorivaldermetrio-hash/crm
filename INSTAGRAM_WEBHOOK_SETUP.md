# 📱 Guia de Configuração do Webhook do Instagram DM

## 🎯 Objetivo

Configurar o webhook para receber mensagens diretas (DM) do Instagram no seu servidor.

## 📋 Pré-requisitos

1. ✅ Acesso ao Meta Developers (https://developers.facebook.com)
2. ✅ App criado no Meta Developers
3. ✅ Instagram Business Account conectada ao app
4. ✅ Ngrok rodando (ou outra URL pública HTTPS)
5. ✅ Variáveis de ambiente configuradas no `.env.local`

## 🔧 Passo 1: Configurar Variáveis de Ambiente

Adicione no seu `.env.local`:

```env
INSTAGRAM_ACCESS_TOKEN=EAAdKGjnB93sBQFDlte15NHIbrdL7OksGRR8OZCxvmHjtvDNPKpHNtZCzbMe3VbB5uFslseWJ1tJWOmc0CxB3E4t1f9mRCu3KZC6gwoQnVCkDtUPv1ZBc8KJZAnOYUXTg1wzQRin9O54fNLhK4Pq8fieNOQszW6G8bSsDAwGnxxVux9A9adOQIuWLlv9jZA
INSTAGRAM_USER_ID=17841478988953094
INSTAGRAM_VERIFY_TOKEN=seu_token_secreto_aqui
```

**Importante:** 
- `INSTAGRAM_VERIFY_TOKEN` é uma senha secreta que VOCÊ cria
- Pode ser qualquer string, exemplo: `meu_token_instagram_2024`
- Use o MESMO valor no Meta Developers

## 🔧 Passo 2: Iniciar o Ngrok (se ainda não estiver rodando)

```bash
ngrok http 3000
```

Copie a URL HTTPS que aparece, exemplo:
```
https://abc123.ngrok-free.app
```

## 🔧 Passo 3: Configurar no Meta Developers

### 3.1 Acessar o Painel

1. Acesse: https://developers.facebook.com
2. Faça login com sua conta
3. Vá em **"My Apps"** (Meus Apps)
4. Selecione seu app

### 3.2 Navegar até Instagram Messaging

1. No menu lateral esquerdo, procure por **"Instagram"**
2. Clique em **"Messaging"** ou **"Basic Display"** → **"Messaging"**
3. Procure pela seção **"Webhooks"**

**Alternativa:**
- Se não encontrar "Instagram" diretamente:
  1. Vá em **"Add Product"** → Busque **"Instagram"**
  2. Adicione o produto **"Instagram Messaging"**
  3. Configure as permissões necessárias

### 3.3 Adicionar Webhook

1. Na seção **"Webhooks"**, clique em **"Add Webhook"** ou **"Subscribe to webhooks"**
2. Preencha os campos:

   **Callback URL:**
   ```
   https://SUA_URL_NGROK.ngrok-free.app/api/webhook-instagram
   ```
   *(Substitua SUA_URL_NGROK pela URL real do seu ngrok)*

   **Verify Token:**
   ```
   seu_token_secreto_aqui
   ```
   *(O mesmo valor que está no `.env.local` como `INSTAGRAM_VERIFY_TOKEN`)*

3. Clique em **"Verify and Save"** ou **"Verify"**

### 3.4 Verificar a Verificação

Quando clicar em "Verify", o Meta vai enviar uma requisição GET para sua URL:
- Se tudo estiver correto, você verá no terminal do seu servidor:
  ```
  ✅ Webhook do Instagram verificado com sucesso
  ```
- Se houver erro, verifique:
  - ✅ Ngrok está rodando
  - ✅ Servidor está rodando na porta correta
  - ✅ Token no `.env.local` é o mesmo do Meta Developers
  - ✅ URL está correta e acessível

### 3.5 Inscrever-se nos Eventos

Após verificar o webhook:

1. Procure por **"Subscribe to webhook fields"** ou **"Webhook Fields"**
2. Marque os eventos que deseja receber:
   - ✅ **`messages`** (obrigatório para receber mensagens)
   - ✅ **`messaging_postbacks`** (opcional, para botões)
   - ✅ **`messaging_account_linking`** (opcional)

3. Clique em **"Save"** ou **"Update"**

## 🔧 Passo 4: Testar

### 4.1 Enviar uma Mensagem de Teste

1. Envie uma mensagem direta para sua conta do Instagram Business
2. Verifique os logs do servidor - você deve ver:
   ```
   📨 ========================================
   📨 MENSAGEM RECEBIDA DO INSTAGRAM
   📨 ========================================
   ```

### 4.2 Verificar no Banco de Dados

1. Verifique se foi criado um contato na coleção `contatoDM`
2. Verifique se foi criada uma mensagem na coleção `mensagensDM`

## 🐛 Troubleshooting

### Erro: "Forbidden" ao verificar webhook

**Possíveis causas:**
- Token de verificação não corresponde
- URL não está acessível
- Servidor não está rodando

**Solução:**
1. Verifique se `INSTAGRAM_VERIFY_TOKEN` no `.env.local` é igual ao configurado no Meta
2. Certifique-se que o ngrok está rodando
3. Teste a URL manualmente no navegador (deve retornar 403, mas significa que está acessível)

### Erro: "Webhook verification failed"

**Solução:**
1. Verifique os logs do servidor para ver qual token está sendo esperado
2. Certifique-se que reiniciou o servidor após adicionar a variável no `.env.local`
3. Verifique se não há espaços extras no token

### Não recebe mensagens

**Possíveis causas:**
- Webhook não está inscrito nos eventos corretos
- Permissões do app não incluem `instagram_manage_messages`
- Conta do Instagram não está conectada corretamente

**Solução:**
1. Verifique se marcou `messages` nos eventos do webhook
2. Vá em **"App Review"** e solicite as permissões necessárias:
   - `instagram_basic`
   - `instagram_manage_messages`
   - `pages_manage_metadata` (se necessário)
3. Certifique-se que a conta do Instagram está conectada ao app

## 📝 URLs Importantes

- **URL do Webhook:** `https://SUA_URL_NGROK.ngrok-free.app/api/webhook-instagram`
- **Documentação Instagram API:** https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/messaging
- **Meta Developers:** https://developers.facebook.com

## ✅ Checklist Final

- [ ] Variáveis de ambiente configuradas no `.env.local`
- [ ] Ngrok rodando e URL copiada
- [ ] Webhook adicionado no Meta Developers
- [ ] Webhook verificado com sucesso
- [ ] Eventos `messages` inscritos
- [ ] Permissões do app configuradas
- [ ] Teste de mensagem funcionando

## 🎉 Pronto!

Após seguir todos os passos, o webhook do Instagram estará configurado e funcionando!

Todas as mensagens recebidas no Instagram DM serão:
- ✅ Processadas automaticamente
- ✅ Salvas no banco de dados (coleções `contatoDM` e `mensagensDM`)
- ✅ Respondidas automaticamente via Ollama (se configurado)
- ✅ Exibidas na página `/instagram-dm`

