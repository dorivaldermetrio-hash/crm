# 📅 Configuração do Google Calendar

Este documento explica como configurar a integração com Google Calendar para sincronizar automaticamente os agendamentos.

## 📋 Pré-requisitos

1. Conta Google (Gmail)
2. Acesso ao [Google Cloud Console](https://console.cloud.google.com/)

## 🔧 Passo a Passo

### 1. Criar/Selecionar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Selecione um projeto existente ou crie um novo
3. Anote o **Project ID**

### 2. Habilitar Google Calendar API

1. No menu lateral, vá em **APIs & Services** > **Library**
2. Procure por "Google Calendar API"
3. Clique em **Enable** (Habilitar)

### 3. Configurar OAuth Consent Screen

1. Vá em **APIs & Services** > **OAuth consent screen**
2. Escolha **External** (para desenvolvimento) ou **Internal** (para Workspace)
3. Preencha os campos obrigatórios:
   - **App name**: WhatsApp CRM (ou o nome que preferir)
   - **User support email**: Seu email
   - **Developer contact information**: Seu email
4. Clique em **Save and Continue**
5. Na tela de **Scopes**, clique em **Add or Remove Scopes**
6. Adicione o scope: `https://www.googleapis.com/auth/calendar`
7. Clique em **Save and Continue**
8. Adicione usuários de teste (se necessário)
9. Clique em **Save and Continue** até finalizar

### 4. Criar Credenciais OAuth 2.0

1. Vá em **APIs & Services** > **Credentials**
2. Clique em **Create Credentials** > **OAuth client ID**
3. Selecione **Web application**
4. Configure:
   - **Name**: Google Calendar Integration (ou o nome que preferir)
   - **Authorized redirect URIs**: 
     - Para desenvolvimento: `http://localhost:3000/api/google-calendar/callback`
     - Para produção: `https://seu-dominio.com/api/google-calendar/callback`
5. Clique em **Create**
6. **IMPORTANTE**: Copie o **Client ID** e **Client Secret** (você só verá o secret uma vez!)

### 5. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env.local`:

```env
# Google Calendar (pode reutilizar as mesmas credenciais do Google Ads se preferir)
GOOGLE_CALENDAR_CLIENT_ID=seu_client_id_aqui
GOOGLE_CALENDAR_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback

# Ou se preferir usar as mesmas credenciais do Google Ads:
# GOOGLE_CALENDAR_CLIENT_ID=${GOOGLE_ADS_CLIENT_ID}
# GOOGLE_CALENDAR_CLIENT_SECRET=${GOOGLE_ADS_CLIENT_SECRET}

# URL base da aplicação (para produção)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 6. Reiniciar o Servidor

Após adicionar as variáveis de ambiente, reinicie o servidor:

```bash
npm run dev
```

## 🚀 Como Usar

### Conectar Google Calendar

1. Acesse a página **Agenda** (`/agenda`)
2. Clique no botão **"Conectar Google Calendar"**
3. Você será redirecionado para o Google para autorizar
4. Selecione a conta Google desejada
5. Autorize o acesso ao Google Calendar
6. Você será redirecionado de volta para a agenda
7. O botão mudará para **"Conectado"** com o email da conta

### Sincronização Automática

Após conectar, todos os agendamentos serão automaticamente sincronizados:

- ✅ **Criar agendamento**: Cria no MongoDB e no Google Calendar
- ✅ **Atualizar agendamento**: Atualiza em ambos os lugares
- ✅ **Deletar agendamento**: Remove de ambos os lugares

### Desconectar

Para desconectar, você precisaria deletar o registro do MongoDB manualmente ou criar uma funcionalidade de desconexão (não implementada ainda).

## 🔍 Verificação

### Verificar se está conectado

1. Acesse `/agenda`
2. Se o botão mostrar "Conectado (seu-email@gmail.com)", está funcionando!

### Verificar no MongoDB

```javascript
// No MongoDB
db.getCollection('google-calendar-accounts').find({})
```

### Verificar no Google Calendar

1. Acesse [Google Calendar](https://calendar.google.com)
2. Os eventos criados na agenda devem aparecer lá automaticamente

## ⚠️ Troubleshooting

### Erro: "GOOGLE_CALENDAR_CLIENT_ID não está configurado"

- Verifique se as variáveis de ambiente estão no `.env.local`
- Reinicie o servidor após adicionar as variáveis

### Erro: "redirect_uri_mismatch"

- Verifique se o `GOOGLE_CALENDAR_REDIRECT_URI` no `.env.local` está **exatamente** igual ao configurado no Google Cloud Console
- URLs devem ser idênticas (incluindo http/https, porta, etc.)

### Erro: "invalid_grant"

- O código de autorização expirou (válido por alguns minutos)
- Tente conectar novamente

### Eventos não aparecem no Google Calendar

- Verifique os logs do servidor para erros
- Confirme que o refresh_token foi salvo no MongoDB
- Verifique se o scope `calendar` foi adicionado no OAuth consent screen

### Refresh token não é retornado

- Certifique-se de usar `access_type: 'offline'` e `prompt: 'consent'` (já configurado no código)
- Se já autorizou antes, pode precisar revogar e autorizar novamente

## 📝 Notas Importantes

1. **Segurança**: Os tokens são armazenados no MongoDB. Em produção, considere criptografá-los.

2. **Múltiplos Usuários**: Atualmente, o sistema usa `getUserId()` que retorna 'default-user'. Para múltiplos usuários, você precisará implementar autenticação real.

3. **Timezone**: Os eventos são criados com timezone `America/Sao_Paulo`. Você pode modificar isso em `src/lib/google-calendar/sync.ts`.

4. **Calendário**: Por padrão, usa o calendário "primary". Você pode modificar isso no modelo `GoogleCalendarAccount`.

5. **Sincronização Bidirecional**: Atualmente, apenas sincroniza do sistema para o Google Calendar. Eventos criados diretamente no Google Calendar não aparecem no sistema.

## 🔐 Segurança

- ⚠️ **NUNCA** commite o `.env.local` no Git
- ⚠️ Os tokens são sensíveis - mantenha-os seguros
- ⚠️ Em produção, use HTTPS obrigatoriamente
- ⚠️ Considere criptografar os refresh_tokens no banco de dados

## 📚 Referências

- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
- [OAuth 2.0 for Web Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [googleapis npm package](https://www.npmjs.com/package/googleapis)
