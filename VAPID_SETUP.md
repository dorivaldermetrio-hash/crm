# Configuração VAPID Keys

## Chaves Geradas

As seguintes VAPID keys foram geradas para Push Notifications:

**Public Key:**
```
BJKlKdf1z38qmuBjrkAtgkZoD1RgyM3ySN7Xuu0MQwNZbeAYnPftuO0C0gO-soBYLvPgyUm8wrWysFqkrjOF8ig
```

**Private Key:**
```
0ywkBZzvu5Fsey_e2U8PN5iRyHulyK0Zegwy6rOdwXM
```

## Como Configurar

1. Crie um arquivo `.env.local` na raiz do projeto (se não existir)

2. Adicione as seguintes variáveis:

```env
# VAPID Keys para Push Notifications
VAPID_PUBLIC_KEY=BJKlKdf1z38qmuBjrkAtgkZoD1RgyM3ySN7Xuu0MQwNZbeAYnPftuO0C0gO-soBYLvPgyUm8wrWysFqkrjOF8ig
VAPID_PRIVATE_KEY=0ywkBZzvu5Fsey_e2U8PN5iRyHulyK0Zegwy6rOdwXM
VAPID_SUBJECT=mailto:seu-email@exemplo.com
```

3. **IMPORTANTE:** Substitua `seu-email@exemplo.com` pelo seu email real no `VAPID_SUBJECT`

## Gerar Novas Chaves

Se precisar gerar novas chaves no futuro:

```bash
npx web-push generate-vapid-keys
```

## Segurança

- ⚠️ **NUNCA** compartilhe a `VAPID_PRIVATE_KEY` publicamente
- ⚠️ O arquivo `.env.local` já está no `.gitignore` (não será commitado)
- ✅ A `VAPID_PUBLIC_KEY` pode ser usada no frontend (é pública)
