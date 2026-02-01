# 📡 Configuração de Webhooks do Google Calendar

## O que são Webhooks?

Webhooks são notificações em tempo real que o Google Calendar envia para seu servidor quando eventos são criados, atualizados ou deletados no calendário do usuário.

## ✅ O que já está implementado

1. **Endpoint de Webhook**: `/api/google-calendar/webhook`
   - Recebe notificações do Google Calendar
   - Sincroniza eventos automaticamente

2. **Configuração Automática**: 
   - O watch é configurado automaticamente quando você conecta o Google Calendar
   - O `watchResourceId` é salvo no MongoDB

3. **Sincronização Bidirecional**:
   - ✅ CRM → Google Calendar (já funcionando)
   - ✅ Google Calendar → CRM (implementado via webhook)

## 🔧 Como Funciona

### 1. Quando você conecta o Google Calendar

1. O sistema configura automaticamente um "watch" (webhook)
2. O Google Calendar começa a enviar notificações para: `https://seu-dominio.com/api/google-calendar/webhook`
3. O `watchResourceId` é salvo no MongoDB

### 2. Quando um evento muda no Google Calendar

1. Google Calendar envia uma notificação POST para o webhook
2. O webhook processa a notificação
3. Busca os eventos atualizados do Google Calendar
4. Sincroniza com o banco de dados local:
   - **Cria** novos agendamentos se o evento não existir
   - **Atualiza** agendamentos existentes
   - **Deleta** agendamentos se o evento foi removido do Google Calendar

## ⚙️ Configuração Necessária

### Variável de Ambiente

Adicione no `.env.local` (e na Vercel):

```env
# URL do webhook (deve ser acessível publicamente)
GOOGLE_CALENDAR_WEBHOOK_URL=https://seu-dominio.vercel.app/api/google-calendar/webhook
```

**Importante**: 
- Em desenvolvimento local, você precisará usar um túnel (ngrok, Cloudflare Tunnel, etc.)
- Em produção (Vercel), use a URL do seu domínio

### Para Desenvolvimento Local

1. **Instale o ngrok** (ou similar):
   ```bash
   npm install -g ngrok
   ```

2. **Inicie o túnel**:
   ```bash
   ngrok http 3000
   ```

3. **Use a URL do ngrok** no `.env.local`:
   ```env
   GOOGLE_CALENDAR_WEBHOOK_URL=https://seu-ngrok-url.ngrok-free.app/api/google-calendar/webhook
   ```

## 🔄 Renovação do Watch

Os watches do Google Calendar expiram após um período (geralmente 7 dias). O sistema precisa renovar o watch periodicamente.

### Renovação Automática (Recomendado)

Você pode criar um job/cron que renova o watch antes de expirar:

```typescript
// Exemplo de job para renovar watch
import { configurarWatchGoogleCalendar } from '@/lib/google-calendar/watch';
import GoogleCalendarAccount from '@/lib/models/GoogleCalendarAccount';

// Executa diariamente
async function renovarWatchesExpirados() {
  const accounts = await GoogleCalendarAccount.find({
    watchExpiration: { $lt: new Date() }, // Expira em menos de 1 dia
  });

  for (const account of accounts) {
    await configurarWatchGoogleCalendar(account.userId);
  }
}
```

## 🧪 Testando o Webhook

### 1. Verificar se o watch está configurado

Após conectar o Google Calendar, verifique no MongoDB se o `watchResourceId` foi salvo:

```javascript
db['google-calendar-accounts'].findOne({ userId: 'default-user' })
```

### 2. Testar manualmente

1. Crie um evento no Google Calendar (pelo site/app do Google)
2. Aguarde alguns segundos
3. Verifique se o evento aparece no seu CRM
4. Edite o evento no Google Calendar
5. Verifique se a edição aparece no CRM
6. Delete o evento no Google Calendar
7. Verifique se foi removido do CRM

### 3. Verificar logs

Os logs mostrarão:
- `📬 Webhook recebido do Google Calendar`
- `🔄 Processando mudança no Google Calendar`
- `✅ Novo agendamento criado do Google Calendar`
- `✅ Agendamento atualizado`
- `🗑️ Agendamento deletado`

## ⚠️ Limitações e Considerações

1. **Watches expiram**: Precisam ser renovados periodicamente
2. **URL pública**: O webhook precisa ser acessível publicamente
3. **HTTPS obrigatório**: Em produção, o Google requer HTTPS
4. **Rate limiting**: O Google pode limitar o número de notificações

## 🔍 Troubleshooting

### Webhook não está recebendo notificações

1. Verifique se o `watchResourceId` está salvo no MongoDB
2. Verifique se a URL do webhook está correta e acessível
3. Verifique os logs do servidor para ver se há erros
4. Tente reconectar o Google Calendar para reconfigurar o watch

### Eventos não estão sincronizando

1. Verifique se o webhook está recebendo notificações (logs)
2. Verifique se o token de acesso está válido
3. Verifique se os escopos estão corretos
4. Verifique os logs de erro no console

## 📝 Próximos Passos

1. Implementar renovação automática de watches
2. Adicionar tratamento de erros mais robusto
3. Adicionar retry logic para falhas temporárias
4. Implementar sincronização incremental (apenas eventos modificados)
