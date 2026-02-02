# 🛠️ Solução para Cold Start na Vercel

## 📋 Problema

Na Vercel (plano gratuito/Hobby), após um período de inatividade, as funções serverless entram em "cold start":
- **Primeira requisição após inatividade**: pode levar 2-10 segundos para responder
- **Webhooks podem falhar**: se o Google Calendar enviar um webhook enquanto a função está "dormindo", pode não ser processado
- **Tarefas agendadas não executam**: `setInterval` não funciona em serverless (a função não fica sempre ativa)
- **Watch do Google Calendar expira**: precisa ser renovado a cada 7 dias, mas se o projeto estiver inativo, não renova

## ✅ Solução Implementada

### 1. Vercel Cron Jobs

Criamos 3 cron jobs no arquivo `vercel.json`:

#### a) Keep-Alive (A cada 10 minutos)
- **Rota**: `/api/cron/keep-alive`
- **Frequência**: A cada 10 minutos
- **Objetivo**: Mantém o projeto "aquecido" para evitar cold starts
- **Benefício**: Webhooks são recebidos mais rapidamente

#### b) Renovar Watch do Google Calendar (Diariamente às 2h)
- **Rota**: `/api/cron/renew-google-calendar-watch`
- **Frequência**: Diariamente às 2h da manhã
- **Objetivo**: Renova watches que expiram em menos de 2 dias
- **Benefício**: Garante que os webhooks do Google Calendar continuem funcionando

#### c) Processar Posts Agendados (A cada 10 minutos)
- **Rota**: `/api/cron/scheduled-posts`
- **Frequência**: A cada 10 minutos
- **Objetivo**: Processa posts agendados do Instagram
- **Benefício**: Substitui o `setInterval` que não funciona em serverless

## 📝 Configuração

### 1. Arquivo `vercel.json`

O arquivo já foi criado com os cron jobs configurados:

```json
{
  "crons": [
    {
      "path": "/api/cron/keep-alive",
      "schedule": "*/10 * * * *"
    },
    {
      "path": "/api/cron/renew-google-calendar-watch",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/scheduled-posts",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

### 2. Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas na Vercel:

- `GOOGLE_CALENDAR_WEBHOOK_URL`: URL pública do webhook (ex: `https://seu-dominio.vercel.app/api/google-calendar/webhook`)
- `NEXT_PUBLIC_BASE_URL`: URL base da aplicação

### 3. Ativar Cron Jobs na Vercel

1. Acesse o dashboard da Vercel
2. Vá em **Settings** → **Cron Jobs**
3. Os cron jobs devem aparecer automaticamente após o deploy
4. Verifique se estão ativos

## 🔍 Como Funciona

### Keep-Alive
- A cada 10 minutos, o Vercel chama `/api/cron/keep-alive`
- Isso mantém a função "aquecida" e evita cold starts
- Webhooks são recebidos mais rapidamente

### Renovação do Watch
- Diariamente às 2h, o Vercel chama `/api/cron/renew-google-calendar-watch`
- A função busca todas as contas com watch que expira em menos de 2 dias
- Renova automaticamente cada watch
- Garante que os webhooks continuem funcionando

### Posts Agendados
- A cada 10 minutos, o Vercel chama `/api/cron/scheduled-posts`
- Processa posts do Instagram que já passaram da data programada
- Substitui o `setInterval` que não funciona em serverless

## ⚠️ Limitações do Plano Gratuito

- **Cron Jobs**: Limitados a 1 execução por minuto (máximo)
- **Tempo de execução**: Máximo de 10 segundos por execução
- **Cold Start**: Ainda pode ocorrer, mas é minimizado pelo keep-alive

## 💡 Alternativas (Se Necessário)

### 1. Upgrade para Plano Pro
- **Benefícios**: 
  - Sem limite de execuções de cron
  - Tempo de execução maior
  - Melhor performance

### 2. Serviços Externos
- **Uptime Robot**: Monitora a URL e faz ping a cada 5 minutos (gratuito)
- **Cron-job.org**: Executa cron jobs externos (gratuito)
- **EasyCron**: Serviço de cron jobs (pago)

### 3. Vercel Pro
- **Custo**: ~$20/mês
- **Benefícios**: 
  - Sem limites de cron jobs
  - Melhor performance
  - Suporte prioritário

## 📊 Monitoramento

### Verificar Logs dos Cron Jobs

1. Acesse o dashboard da Vercel
2. Vá em **Deployments** → Selecione o deployment
3. Clique em **Functions** → Veja os logs de cada cron job

### Verificar Renovação do Watch

Os logs mostrarão:
- `🔄 Verificando watches do Google Calendar para renovação...`
- `✅ Watch renovado com sucesso para userId: [id]`
- `❌ Falha ao renovar watch para userId: [id]`

## 🎯 Resultado Esperado

Após implementar essas soluções:

1. ✅ **Webhooks são recebidos rapidamente** (keep-alive mantém o projeto ativo)
2. ✅ **Watch do Google Calendar é renovado automaticamente** (cron diário)
3. ✅ **Posts agendados são processados** (cron a cada 10 minutos)
4. ✅ **Cold starts são minimizados** (keep-alive a cada 10 minutos)

## 🚀 Próximos Passos

1. **Fazer deploy** do código com os cron jobs
2. **Verificar na Vercel** se os cron jobs foram criados
3. **Monitorar os logs** para garantir que estão executando
4. **Testar** criando um evento no Google Calendar e verificando se o webhook é recebido
