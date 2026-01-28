#!/usr/bin/env node

/**
 * Script para iniciar o ngrok e expor o servidor Next.js
 * 
 * Uso:
 *   node scripts/ngrok-setup.js
 *   ou
 *   npm run ngrok
 */

const { spawn } = require('child_process');
const http = require('http');

const PORT = process.env.PORT || 3000;
const NGROK_PORT = process.env.NGROK_PORT || 4040;

// Verifica se o servidor Next.js está rodando
function checkServerRunning() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}`, (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startNgrok() {
  console.log('🔍 Verificando se o servidor Next.js está rodando...');
  
  const isRunning = await checkServerRunning();
  
  if (!isRunning) {
    console.error(`❌ Erro: O servidor Next.js não está rodando na porta ${PORT}`);
    console.log(`\n💡 Execute primeiro: npm run dev`);
    process.exit(1);
  }
  
  console.log(`✅ Servidor Next.js detectado na porta ${PORT}`);
  console.log(`🚀 Iniciando ngrok...\n`);
  
  // Inicia o ngrok
  const ngrok = spawn('ngrok', ['http', PORT.toString()], {
    stdio: 'inherit',
    shell: true
  });
  
  ngrok.on('error', (error) => {
    console.error('❌ Erro ao iniciar ngrok:', error.message);
    console.log('\n💡 Certifique-se de que o ngrok está instalado:');
    console.log('   Windows: choco install ngrok');
    console.log('   macOS: brew install ngrok');
    console.log('   Ou baixe em: https://ngrok.com/download');
    process.exit(1);
  });
  
  ngrok.on('exit', (code) => {
    if (code !== 0) {
      console.error(`\n❌ ngrok encerrado com código ${code}`);
    }
  });
  
  // Aguarda um pouco e tenta mostrar a URL
  setTimeout(() => {
    console.log('\n📋 Para ver a URL pública do ngrok:');
    console.log(`   Acesse: http://localhost:${NGROK_PORT}`);
    console.log('\n💡 A URL pública será exibida no dashboard do ngrok acima.');
    console.log('   Use essa URL para configurar o webhook do WhatsApp Business API.\n');
  }, 2000);
  
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Encerrando ngrok...');
    ngrok.kill();
    process.exit(0);
  });
}

startNgrok();

