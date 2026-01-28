/**
 * Baixa mídia do WhatsApp Business API
 */

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v21.0';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

interface MediaMetadata {
  id: string;
  mime_type: string;
  sha256: string;
  file_size: number;
  url?: string; // URL de download fornecida pelo WhatsApp
}

/**
 * Obtém metadados da mídia do WhatsApp
 */
export async function getMediaMetadata(mediaId: string): Promise<MediaMetadata | null> {
  if (!WHATSAPP_ACCESS_TOKEN) {
    console.error('❌ WHATSAPP_ACCESS_TOKEN não configurado');
    throw new Error('WHATSAPP_ACCESS_TOKEN não configurado');
  }

  try {
    console.log(`🔍 Buscando metadados da mídia: ${mediaId}`);
    // A API do WhatsApp requer o mediaId sem o prefixo do phone_number_id
    // O mediaId já vem no formato correto do webhook (ex: "733453275856849")
    const url = `${WHATSAPP_API_URL}/${mediaId}?access_token=${WHATSAPP_ACCESS_TOKEN}`;
    console.log(`   URL: ${url.replace(WHATSAPP_ACCESS_TOKEN || '', 'TOKEN_HIDDEN')}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro ao buscar metadados da mídia: ${response.status} ${response.statusText}`);
      console.error(`   Resposta: ${errorText}`);
      return null;
    }

    const data = await response.json();
    console.log(`✅ Metadados recebidos:`, {
      id: data.id,
      mime_type: data.mime_type,
      file_size: data.file_size,
      url: data.url ? 'Presente' : 'Não presente',
    });
    
    // Log completo dos metadados para debug
    console.log(`📋 Metadados completos:`, JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar metadados da mídia:', error);
    return null;
  }
}

/**
 * Baixa o arquivo de mídia do WhatsApp
 */
export async function downloadMediaFromWhatsApp(mediaId: string): Promise<{
  buffer: Buffer;
  contentType: string;
  filename: string;
} | null> {
  if (!WHATSAPP_ACCESS_TOKEN) {
    console.error('❌ WHATSAPP_ACCESS_TOKEN não configurado');
    throw new Error('WHATSAPP_ACCESS_TOKEN não configurado');
  }

  try {
    // Primeiro, obtém a URL de download
    console.log(`📥 Iniciando download da mídia: ${mediaId}`);
    const metadata = await getMediaMetadata(mediaId);
    if (!metadata) {
      console.error(`❌ Não foi possível obter metadados da mídia: ${mediaId}`);
      return null;
    }

    // Baixa o arquivo
    console.log(`⬇️ Baixando arquivo da mídia...`);
    
    // A API do WhatsApp retorna uma URL de download nos metadados
    // IMPORTANTE: A URL requer autenticação via token no header, não na query string
    let downloadUrl: string;
    
    if (metadata.url) {
      // Usa a URL fornecida pelo WhatsApp
      // A URL do WhatsApp é algo como: https://lookaside.fbsbx.com/whatsapp_business/attachments/...
      downloadUrl = metadata.url;
      console.log(`   Usando URL dos metadados do WhatsApp`);
      console.log(`   URL completa: ${downloadUrl.substring(0, 100)}...`);
    } else {
      // Se não tiver URL, tenta usar o endpoint de download direto
      downloadUrl = `${WHATSAPP_API_URL}/${mediaId}`;
      console.log(`   ⚠️ URL não encontrada nos metadados, tentando endpoint direto`);
    }
    
    console.log(`   URL de download: ${downloadUrl.substring(0, 100)}...`);
    
    // Faz o download do arquivo binário
    // IMPORTANTE: A URL do WhatsApp requer o token no header Authorization
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro ao baixar mídia: ${response.status} ${response.statusText}`);
      console.error(`   Resposta: ${errorText}`);
      return null;
    }

    // Verifica o Content-Type da resposta
    const responseContentType = response.headers.get('content-type');
    console.log(`   Content-Type da resposta: ${responseContentType}`);
    
    // Verifica se a resposta é JSON (erro) ou binário (sucesso)
    if (responseContentType?.includes('application/json')) {
      // A resposta é JSON, provavelmente um erro
      const errorData = await response.json();
      console.error(`❌ API retornou JSON em vez de arquivo binário:`, errorData);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`✅ Arquivo baixado: ${buffer.length} bytes`);
    
    // Valida se o buffer não está vazio
    if (buffer.length === 0) {
      console.error(`❌ Buffer vazio! Arquivo não foi baixado corretamente.`);
      return null;
    }
    
    // Verifica se é uma imagem válida (primeiros bytes)
    if (metadata.mime_type?.startsWith('image/')) {
      const firstBytes = buffer.slice(0, 4);
      const isJPEG = firstBytes[0] === 0xFF && firstBytes[1] === 0xD8 && firstBytes[2] === 0xFF;
      const isPNG = firstBytes[0] === 0x89 && firstBytes[1] === 0x50 && firstBytes[2] === 0x4E && firstBytes[3] === 0x47;
      const isGIF = firstBytes[0] === 0x47 && firstBytes[1] === 0x49 && firstBytes[2] === 0x46;
      const isValidImage = isJPEG || isPNG || isGIF;
      
      if (!isValidImage) {
        console.warn(`⚠️ Arquivo pode não ser uma imagem válida. Primeiros bytes: ${Array.from(firstBytes).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);
        console.warn(`   Esperado: JPEG (FF D8 FF), PNG (89 50 4E 47), ou GIF (47 49 46)`);
        // Tenta ler como texto para ver se é um erro JSON
        try {
          const text = buffer.toString('utf-8');
          if (text.startsWith('{') || text.startsWith('[')) {
            console.error(`❌ Resposta parece ser JSON, não um arquivo binário:`, text.substring(0, 200));
            return null;
          }
        } catch (e) {
          // Não é texto, continua
        }
      } else {
        console.log(`✅ Arquivo parece ser uma imagem válida (${isJPEG ? 'JPEG' : isPNG ? 'PNG' : 'GIF'})`);
      }
    }

    // Determina extensão baseado no mime_type
    const extension = getExtensionFromMimeType(metadata.mime_type);
    const filename = `media_${mediaId}.${extension}`;

    return {
      buffer,
      contentType: metadata.mime_type,
      filename,
    };
  } catch (error) {
    console.error('❌ Erro ao baixar mídia do WhatsApp:', error);
    return null;
  }
}

/**
 * Obtém extensão de arquivo baseado no MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: { [key: string]: string } = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'audio/ogg; codecs=opus': 'ogg',
    'audio/aac': 'aac',
    'audio/mp4': 'm4a',
    'audio/amr': 'amr',
    'video/mp4': 'mp4',
    'video/3gpp': '3gp',
    'application/pdf': 'pdf',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/msword': 'doc',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  };

  return mimeToExt[mimeType] || 'bin';
}

