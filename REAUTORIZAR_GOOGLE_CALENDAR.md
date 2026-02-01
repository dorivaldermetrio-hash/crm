# 🔄 Guia de Re-autorização do Google Calendar

## ⚠️ IMPORTANTE

Após alterar o **escopo OAuth** ou as **credenciais** (Client ID/Secret), você **DEVE** re-autorizar o Google Calendar para obter novos tokens com as permissões corretas.

## 📋 Passo a Passo Completo

### 1. Verificar Configuração do .env.local

Certifique-se de que seu `.env.local` está configurado corretamente:

```env
# IMPORTANTE: Substitua pelos valores reais do seu Google Cloud Console
GOOGLE_CALENDAR_CLIENT_ID=SEU_CLIENT_ID_AQUI.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=SEU_CLIENT_SECRET_AQUI
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 2. Reiniciar o Servidor Next.js

**CRÍTICO**: O servidor precisa ser reiniciado para carregar as novas variáveis de ambiente.

```bash
# Pare o servidor (Ctrl+C no terminal)
# Depois inicie novamente:
npm run dev
```

### 3. Desconectar Google Calendar (se já estiver conectado)

1. Acesse: `http://localhost:3000/agenda`
2. Se você ver "Conectado (email)", clique no botão **"X"** ao lado
3. Confirme a desconexão
4. Aguarde a mensagem de sucesso

### 4. Conectar Google Calendar Novamente

1. Na mesma página (`/agenda`), clique em **"Conectar Google Calendar"**
2. Você será redirecionado para o Google
3. Selecione a conta Google desejada
4. **Revise as permissões solicitadas** - deve aparecer algo como:
   - "Ver, editar, compartilhar e excluir permanentemente todos os calendários que você pode acessar usando o Google Agenda"
5. Clique em **"Permitir"** ou **"Conceder acesso"**
6. Você será redirecionado de volta para `/agenda?connected=true`

### 5. Verificar se Funcionou

#### Opção A: Teste via Interface
- Acesse `/agenda`
- Deve aparecer "Conectado (seu-email@gmail.com)"
- Crie um agendamento
- Verifique se aparece no Google Calendar

#### Opção B: Teste via API
- Acesse: `http://localhost:3000/api/google-calendar/test`
- Deve retornar:
  ```json
  {
    "success": true,
    "connected": true,
    "test": {
      "canAccessAPI": true,
      "calendarsFound": 1
    }
  }
  ```

## 🔍 Verificações Adicionais

### Verificar Logs do Servidor

Ao conectar, você deve ver nos logs:

```
🔐 Redirecionando para autorização Google Calendar OAuth...
📍 Scope solicitado: https://www.googleapis.com/auth/calendar
📍 Client ID: SEU_CLIENT_ID_AQUI...
📍 Redirect URI: http://localhost:3000/api/google-calendar/callback
```

E após autorizar:

```
✅ Tokens obtidos com sucesso!
👤 User ID: default-user
📧 Email: seu-email@gmail.com
🔑 Scope do token: https://www.googleapis.com/auth/calendar
✅ Refresh token salvo no MongoDB com sucesso!
```

### Verificar no MongoDB (Opcional)

Se quiser verificar se o token foi salvo:

```javascript
// No MongoDB Compass ou shell
db.getCollection('google-calendar-accounts').find({})
```

Deve mostrar um documento com:
- `userId`: "default-user"
- `refreshToken`: (string longa)
- `email`: seu email
- `calendarId`: "primary"

## ❌ Problemas Comuns

### Erro: "redirect_uri_mismatch"
- Verifique se o `GOOGLE_CALENDAR_REDIRECT_URI` no `.env.local` está **exatamente** igual ao configurado no Google Cloud Console
- URLs devem ser idênticas (incluindo http/https, porta, etc.)

### Erro: "invalid_client"
- Verifique se `GOOGLE_CALENDAR_CLIENT_ID` e `GOOGLE_CALENDAR_CLIENT_SECRET` estão corretos
- Certifique-se de que copiou sem espaços extras

### Erro: "access_denied"
- O usuário negou as permissões
- Tente novamente e clique em "Permitir"

### Token ainda não funciona após re-autorizar
- Verifique os logs do servidor para ver qual escopo foi retornado
- Certifique-se de que o escopo inclui `calendar` completo
- Tente desconectar e reconectar novamente

## ✅ Checklist Final

- [ ] `.env.local` configurado com Client ID e Secret corretos
- [ ] Servidor Next.js reiniciado após alterar `.env.local`
- [ ] Google Calendar desconectado (se estava conectado)
- [ ] Google Calendar reconectado com novo fluxo OAuth
- [ ] Permissões concedidas no Google
- [ ] Teste `/api/google-calendar/test` retorna sucesso
- [ ] Criação de agendamento sincroniza com Google Calendar

## 🎯 Escopo Correto

O escopo que deve ser solicitado e concedido é:
```
https://www.googleapis.com/auth/calendar
```

Este escopo inclui:
- ✅ Criar, atualizar e deletar eventos
- ✅ Listar calendários
- ✅ Todas as operações do Google Calendar

---

**Última atualização**: Após correção do escopo de `calendar.events` para `calendar`
