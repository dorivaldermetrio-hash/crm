# WhatsApp CRM

Sistema de CRM para gerenciamento de conversas e contatos do WhatsApp usando a API oficial do WhatsApp Business.

## 🚀 Iniciando o projeto

Primeiro, instale as dependências:

```bash
npm install
```

Depois, inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador para ver o resultado.

## 📡 Configurando o ngrok

Para expor o projeto publicamente e configurar webhooks do WhatsApp, você precisa do ngrok.

**Instruções completas:** Veja [NGROK_SETUP.md](./NGROK_SETUP.md)

**Resumo rápido:**

1. Instale o ngrok (veja instruções no arquivo acima)
2. Inicie o servidor: `npm run dev`
3. Em outro terminal: `npm run ngrok`
4. Use a URL pública gerada para configurar o webhook

## 🛠️ Scripts disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm run start` - Inicia o servidor de produção
- `npm run ngrok` - Inicia o ngrok para expor o projeto
- `npm run ngrok:url` - Obtém a URL pública do ngrok

## 📡 Webhook do WhatsApp

O projeto está configurado para receber mensagens do WhatsApp Business API através de webhook.

**URL do webhook:** `https://SUA_URL_NGROK.ngrok-free.app/api/webhook`

**Instruções completas:** Veja [WEBHOOK_SETUP.md](./WEBHOOK_SETUP.md)

**Resumo rápido:**

1. Configure `WHATSAPP_VERIFY_TOKEN` no `.env.local`
2. Inicie o servidor e ngrok
3. Configure o webhook no Meta for Developers
4. As mensagens recebidas aparecerão no console

## 📚 Tecnologias

- [Next.js](https://nextjs.org) - Framework React
- [TypeScript](https://www.typescriptlang.org) - Tipagem estática
- [Tailwind CSS](https://tailwindcss.com) - Estilização
- [ngrok](https://ngrok.com) - Túnel público para webhooks

## 🤖 Respostas Automáticas com Ollama

O sistema pode responder automaticamente às mensagens usando IA local via Ollama.

**Instruções completas:** Veja [OLLAMA_INTEGRATION.md](./OLLAMA_INTEGRATION.md)

**Resumo rápido:**

1. Instale o Ollama: https://ollama.ai
2. Baixe o modelo: `ollama pull llama3.1:8b`
3. Configure no `.env.local`: `OLLAMA_AUTO_REPLY_ENABLED=true`
4. As respostas serão geradas automaticamente!

## 📖 Documentação

- [NGROK_SETUP.md](./NGROK_SETUP.md) - Configuração do ngrok
- [WEBHOOK_SETUP.md](./WEBHOOK_SETUP.md) - Configuração do webhook do WhatsApp
- [MONGODB_SETUP.md](./MONGODB_SETUP.md) - Configuração do MongoDB
- [OLLAMA_INTEGRATION.md](./OLLAMA_INTEGRATION.md) - Integração com Ollama (IA local)
- [Next.js Documentation](https://nextjs.org/docs)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
