# Configuração de Envio de Emails com Nodemailer

Este guia explica como configurar o envio de emails usando Nodemailer.

## 📋 Variáveis de Ambiente Necessárias

Adicione no arquivo `.env.local`:

```env
# Configuração de Email (Nodemailer)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=seu_email@gmail.com
EMAIL_SERVER_PASSWORD=sua_senha_de_app_aqui
EMAIL_FROM=seu_email@gmail.com
```

## 🔑 Configuração para Gmail

### 1. Habilitar Senha de App

1. Acesse: https://myaccount.google.com/
2. Vá em **Segurança**
3. Ative a **Verificação em duas etapas** (se ainda não estiver ativada)
4. Role até **Senhas de app**
5. Clique em **Senhas de app**
6. Selecione **Email** e **Outro (personalizado)**
7. Digite "CRM" ou outro nome
8. Clique em **Gerar**
9. Copie a senha gerada (16 caracteres)

### 2. Configurar no .env.local

```env
EMAIL_SERVER_USER=seu_email@gmail.com
EMAIL_SERVER_PASSWORD=abcd efgh ijkl mnop  # A senha de app gerada (sem espaços ou com espaços, ambos funcionam)
EMAIL_FROM=seu_email@gmail.com
```

## 📝 Exemplo Completo de .env.local

```env
# MongoDB
MONGODB_URL=mongodb+srv://...

# Email (Nodemailer)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=seu_email@gmail.com
EMAIL_SERVER_PASSWORD=sua_senha_de_app
EMAIL_FROM=seu_email@gmail.com
```

## ⚠️ Importante

1. **Segurança**: Nunca commite o `.env.local` no Git
2. **Senha de App**: Use sempre senha de app, nunca a senha normal da conta
3. **Porta**: 
   - Porta 465 usa SSL (recomendado)
   - Porta 587 usa TLS (alternativa)
4. **Outros provedores**: Para outros provedores (Outlook, Yahoo, etc.), ajuste `EMAIL_SERVER_HOST` e `EMAIL_SERVER_PORT`

## 🔄 Como Funciona

1. Ao clicar em "Enviar Email", o sistema envia um email por vez
2. Um modal mostra o progresso em tempo real
3. A barra de progresso atualiza conforme cada email é enviado
4. Mostra para qual email está sendo enviado no momento
5. Exibe sucesso ou erro para cada email

