#!/usr/bin/env node

/**
 * Script para obter a URL pública do ngrok via API
 * 
 * Uso:
 *   node scripts/get-ngrok-url.js
 */

const http = require('http');

const NGROK_API_PORT = process.env.NGROK_PORT || 4040;

function getNgrokUrl() {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${NGROK_API_PORT}/api/tunnels`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const tunnels = json.tunnels || [];
          
          if (tunnels.length > 0) {
            // Prioriza HTTPS
            const httpsTunnel = tunnels.find(t => t.proto === 'https');
            const tunnel = httpsTunnel || tunnels[0];
            resolve(tunnel.public_url);
          } else {
            reject(new Error('Nenhum túnel ativo encontrado'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout ao conectar com a API do ngrok'));
    });
  });
}

async function main() {
  try {
    const url = await getNgrokUrl();
    console.log('✅ URL pública do ngrok:');
    console.log(`   ${url}\n`);
    console.log('💡 Use essa URL para configurar o webhook do WhatsApp Business API.');
    return url;
  } catch (error) {
    console.error('❌ Erro ao obter URL do ngrok:', error.message);
    console.log('\n💡 Certifique-se de que:');
    console.log('   1. O ngrok está rodando (npm run ngrok)');
    console.log('   2. O servidor Next.js está rodando (npm run dev)');
    process.exit(1);
  }
}

main();

