# Configuração PWA - WhatsApp CRM

O Progressive Web App (PWA) foi configurado com sucesso! Agora você precisa adicionar os ícones do app.

## Ícones Necessários

Você precisa criar e adicionar os seguintes ícones na pasta `public/`:

1. **icon-192x192.png** - Ícone de 192x192 pixels
2. **icon-512x512.png** - Ícone de 512x512 pixels

### Como Gerar os Ícones

1. **Usando ferramenta online:**
   - Acesse https://realfavicongenerator.net/
   - Faça upload do seu logo/favicon
   - Baixe os ícones gerados
   - Coloque na pasta `public/`

2. **Criando manualmente:**
   - Use um editor de imagens (Photoshop, GIMP, Figma, etc.)
   - Crie imagens quadradas de 192x192 e 512x512 pixels
   - Salve como PNG com fundo transparente ou sólido
   - Coloque na pasta `public/`

## Como Funciona

- O prompt de instalação **não aparece automaticamente** quando o app abre
- O prompt só aparece quando o usuário clica em **"Download App"** no sidebar
- A página `/download-app` gerencia o processo de instalação
- Suporta instalação em Android, iOS e Desktop

## Testando

1. Faça o build do projeto: `npm run build`
2. Inicie o servidor: `npm start`
3. Acesse o app no navegador
4. Clique em "Download App" no sidebar
5. O prompt de instalação deve aparecer

## Notas

- O PWA está **desabilitado em desenvolvimento** (modo dev)
- Para testar, use o build de produção
- No iOS, o usuário precisa usar o Safari e seguir instruções manuais
- No Android/Desktop, o prompt aparece automaticamente quando clicado
