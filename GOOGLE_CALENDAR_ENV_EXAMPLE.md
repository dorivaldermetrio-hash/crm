# 📝 Configuração das Variáveis de Ambiente - Google Calendar

## ✅ Credenciais Recebidas do Google

Com base nas credenciais que você recebeu, configure seu arquivo `.env.local` assim:

```env
# Google Calendar - OAuth 2.0 Credentials
# IMPORTANTE: Substitua pelos valores reais do seu Google Cloud Console
GOOGLE_CALENDAR_CLIENT_ID=SEU_CLIENT_ID_AQUI.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=SEU_CLIENT_SECRET_AQUI
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback

# URL base da aplicação
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 🔄 Para Produção (Vercel)

Quando for fazer deploy na Vercel, configure as variáveis de ambiente lá também:

1. Acesse seu projeto na Vercel
2. Vá em **Settings** > **Environment Variables**
3. Adicione as mesmas variáveis, mas com o redirect URI de produção:

```env
# IMPORTANTE: Substitua pelos valores reais do seu Google Cloud Console
GOOGLE_CALENDAR_CLIENT_ID=SEU_CLIENT_ID_AQUI.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=SEU_CLIENT_SECRET_AQUI
GOOGLE_CALENDAR_REDIRECT_URI=https://seu-dominio.vercel.app/api/google-calendar/callback
NEXT_PUBLIC_BASE_URL=https://seu-dominio.vercel.app
```

## ⚠️ Importante

1. **NUNCA** commite o arquivo `.env.local` no Git
2. O arquivo `.env.local` já deve estar no `.gitignore`
3. Após adicionar as variáveis, **reinicie o servidor**:
   ```bash
   npm run dev
   ```

## ✅ Verificação

Após configurar, teste a conexão:

1. Acesse `/agenda`
2. Clique em "Conectar Google Calendar"
3. Você deve ser redirecionado para o Google
4. Após autorizar, deve voltar para a agenda com mensagem de sucesso
