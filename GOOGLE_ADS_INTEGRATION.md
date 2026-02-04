# 🔗 Integração Google Ads API

## 📋 Resumo

Esta integração aproveita a infraestrutura OAuth já existente do Google Calendar para acessar a Google Ads API, reutilizando as mesmas credenciais e o mesmo `refresh_token`.

## ✅ O que foi implementado

### 1. Cliente Centralizado (`src/lib/googleAds.ts`)

Criado um módulo centralizado seguindo o padrão do Google Calendar:

- **`getGoogleAdsClient()`**: Inicializa o cliente Google Ads API (singleton)
- **`getGoogleAdsCustomer()`**: Obtém instância de Customer para uma conta específica
- **`cleanCustomerId()`**: Limpa e valida o customer_id (remove traços)
- **`isGoogleAdsReady()`**: Verifica se está pronto para usar (tem refresh_token e variáveis configuradas)

**Características:**
- ✅ Reutiliza `GOOGLE_CALENDAR_CLIENT_ID` e `GOOGLE_CALENDAR_CLIENT_SECRET`
- ✅ Reutiliza o `refresh_token` do Google Calendar (mesmo projeto OAuth)
- ✅ Usa `GOOGLE_ADS_DEVELOPER_TOKEN` do `.env.local`
- ✅ Usa `GOOGLE_ADS_CUSTOMER_ID` do `.env.local` (opcional, pode ser passado como parâmetro)
- ✅ Trata `customer_id` removendo traços automaticamente

### 2. API Route para Listar Campanhas (`src/app/api/google-ads/campaigns/route.ts`)

Rota GET que lista campanhas do Google Ads:

**Endpoint:** `GET /api/google-ads/campaigns`

**Query Params:**
- `customerId` (opcional): ID da conta (usa `GOOGLE_ADS_CUSTOMER_ID` do .env se não fornecido)
- `userId` (opcional): ID do usuário
- `status` (opcional): `ENABLED`, `PAUSED`, `REMOVED`
- `limit` (opcional): Número de resultados (padrão: 100, máximo: 10000)

**Exemplo de uso:**
```bash
GET /api/google-ads/campaigns
GET /api/google-ads/campaigns?customerId=1234567890
GET /api/google-ads/campaigns?customerId=123-456-7890&status=ENABLED&limit=50
```

**Resposta:**
```json
{
  "success": true,
  "total": 5,
  "customerId": "1234567890",
  "campaigns": [
    {
      "id": "12345678901",
      "name": "Campanha de Verão 2024",
      "status": "ENABLED",
      "advertisingChannelType": "SEARCH",
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    }
  ]
}
```

### 3. OAuth Atualizado (`src/app/api/google-calendar/auth/route.ts`)

O fluxo OAuth do Google Calendar agora inclui o escopo do Google Ads:

**Scopes solicitados:**
- `https://www.googleapis.com/auth/calendar` (Google Calendar)
- `https://www.googleapis.com/auth/adwords` (Google Ads)

**Importante:** 
- Quando o usuário autorizar o Google Calendar, automaticamente terá acesso ao Google Ads também
- O mesmo `refresh_token` funciona para ambas as APIs
- Não é necessário autorizar separadamente

### 4. Service Atualizado (`src/lib/services/googleAds.service.ts`)

O service existente foi atualizado para:

- ✅ Reutilizar credenciais do Google Calendar (`GOOGLE_CALENDAR_CLIENT_ID` e `GOOGLE_CALENDAR_CLIENT_SECRET`)
- ✅ Reutilizar `refresh_token` do Google Calendar (não precisa mais do modelo `GoogleAdsAccount`)
- ✅ Manter compatibilidade com código existente

## 🔧 Variáveis de Ambiente Necessárias

No seu `.env.local`, você precisa ter:

```env
# Credenciais OAuth (reutilizadas do Google Calendar)
GOOGLE_CALENDAR_CLIENT_ID=seu_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=seu_client_secret

# Google Ads (específicas)
GOOGLE_ADS_DEVELOPER_TOKEN=seu_developer_token
GOOGLE_ADS_CUSTOMER_ID=1234567890  # Opcional, pode ser passado via query param
```

## 🔄 Fluxo de Autorização

1. **Usuário autoriza Google Calendar:**
   - Acessa `/api/google-calendar/auth`
   - Google solicita permissões para Calendar E Ads (ambos os escopos)
   - Usuário autoriza
   - `refresh_token` é salvo no MongoDB (modelo `GoogleCalendarAccount`)

2. **Usar Google Ads API:**
   - O sistema busca automaticamente o `refresh_token` do Google Calendar
   - Usa o mesmo token para acessar a Google Ads API
   - Não precisa de autorização separada

## 📝 Tratamento de Customer ID

O sistema trata automaticamente o `customer_id`:

- ✅ Remove traços: `123-456-7890` → `1234567890`
- ✅ Remove espaços
- ✅ Valida formato (deve ter 10 dígitos)
- ✅ Pode ser passado via query param ou usar `GOOGLE_ADS_CUSTOMER_ID` do `.env`

## 🎯 Como Usar

### 1. Autorizar (uma vez só)

```bash
# Autoriza Google Calendar (inclui Google Ads automaticamente)
GET /api/google-calendar/auth
```

### 2. Listar Campanhas

```bash
# Usa GOOGLE_ADS_CUSTOMER_ID do .env
GET /api/google-ads/campaigns

# Ou passa customerId via query param
GET /api/google-ads/campaigns?customerId=1234567890

# Com filtros
GET /api/google-ads/campaigns?customerId=1234567890&status=ENABLED&limit=50
```

### 3. Usar no Código

```typescript
import { getGoogleAdsCustomer, cleanCustomerId } from '@/lib/googleAds';

// Obtém instância de Customer
const customer = await getGoogleAdsCustomer(userId, '1234567890');

// Lista campanhas
const campaigns = await customer.report({
  entity: 'campaign',
  attributes: ['campaign.id', 'campaign.name', 'campaign.status'],
  limit: 100,
});
```

## ⚠️ Importante

1. **Reautorização Necessária:**
   - Se você já tinha Google Calendar autorizado ANTES desta atualização, precisa reautorizar
   - O escopo antigo não incluía Google Ads
   - Acesse `/api/google-calendar/auth` novamente para obter o novo escopo

2. **Mesmo Projeto OAuth:**
   - Google Calendar e Google Ads usam o mesmo projeto no Google Cloud
   - Por isso podemos reutilizar as credenciais
   - O `refresh_token` funciona para ambas as APIs

3. **Customer ID:**
   - O `customer_id` é específico do Google Ads (não tem relação com Calendar)
   - Pode ser configurado no `.env.local` ou passado via query param
   - Deve ter 10 dígitos (formato: `1234567890`)

## 🔍 Estrutura de Arquivos

```
src/
├── lib/
│   ├── googleAds.ts                    # ✅ NOVO: Cliente centralizado
│   └── services/
│       └── googleAds.service.ts        # ✅ ATUALIZADO: Reutiliza Calendar
├── app/
│   └── api/
│       ├── google-calendar/
│       │   └── auth/
│       │       └── route.ts            # ✅ ATUALIZADO: Inclui escopo Ads
│       └── google-ads/
│           └── campaigns/
│               └── route.ts            # ✅ NOVO: Lista campanhas
```

## 📚 Próximos Passos

Agora você pode:

1. ✅ Listar campanhas existentes
2. ⏳ Criar novas campanhas (a implementar)
3. ⏳ Editar campanhas (a implementar)
4. ⏳ Deletar campanhas (a implementar)
5. ⏳ Gerenciar grupos de anúncios (a implementar)
6. ⏳ Gerenciar palavras-chave (a implementar)
7. ⏳ Gerenciar anúncios (a implementar)

## 🧪 Testando

1. **Autorize o Google Calendar** (com novo escopo):
   ```bash
   GET http://localhost:3000/api/google-calendar/auth
   ```

2. **Liste as campanhas**:
   ```bash
   GET http://localhost:3000/api/google-ads/campaigns?customerId=1234567890
   ```

3. **Verifique os logs** no terminal para ver o fluxo completo
