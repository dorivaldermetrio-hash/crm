/**
 * Transcreve áudio usando OpenAI Whisper API
 */

import { getOpenAIKey } from '@/lib/config/ai';
import { getFileFromGridFS } from './gridfs';

// Modelo de transcrição da OpenAI
// Usa o modelo configurado em OPEN_AI_TRANSCRIBE (ex: gpt-4o-transcribe)
// Se não configurado, usa whisper-1 como fallback
const OPENAI_TRANSCRIBE_MODEL = process.env.OPEN_AI_TRANSCRIBE || 'whisper-1';

/**
 * Transcreve um arquivo de áudio usando OpenAI Whisper API
 * @param midiaId - ID do arquivo no GridFS
 * @returns Texto transcrito ou null em caso de erro
 */
export async function transcribeAudio(midiaId: string): Promise<string | null> {
  try {
    const apiKey = getOpenAIKey();
    
    if (!apiKey) {
      console.error('❌ OPENAI_API_KEY não configurada');
      return null;
    }

    // Busca o arquivo do GridFS
    console.log(`🎤 Transcrevendo áudio: ${midiaId}`);
    const fileData = await getFileFromGridFS(midiaId);
    
    if (!fileData) {
      console.error(`❌ Arquivo não encontrado no GridFS: ${midiaId}`);
      return null;
    }

    // Detecta o tipo de conteúdo e extensão correta
    // Se o contentType não estiver disponível, tenta detectar pelos primeiros bytes
    let contentType = fileData.contentType;
    let fileExtension = 'ogg';
    
    if (!contentType || contentType === 'application/octet-stream') {
      // Detecta pelo conteúdo do arquivo (primeiros bytes)
      const firstBytes = fileData.buffer.slice(0, 4);
      // OGG: 0x4F 0x67 0x67 0x53 (OggS)
      if (firstBytes[0] === 0x4F && firstBytes[1] === 0x67 && firstBytes[2] === 0x67 && firstBytes[3] === 0x53) {
        contentType = 'audio/ogg';
        fileExtension = 'ogg';
      } else {
        // Fallback para ogg (formato mais comum do WhatsApp)
        contentType = 'audio/ogg';
        fileExtension = 'ogg';
      }
    } else {
      // Extrai extensão do contentType
      if (contentType.includes('ogg')) {
        fileExtension = 'ogg';
      } else if (contentType.includes('mp3')) {
        fileExtension = 'mp3';
      } else if (contentType.includes('m4a') || contentType.includes('mp4')) {
        fileExtension = 'm4a';
      } else if (contentType.includes('wav')) {
        fileExtension = 'wav';
      } else if (contentType.includes('aac')) {
        fileExtension = 'aac';
      }
    }

    console.log(`📝 Usando contentType: ${contentType}, extensão: ${fileExtension}`);

    // Cria um FormData usando o FormData nativo do Node.js 18+
    const formData = new FormData();
    const filename = `audio.${fileExtension}`;
    
    // Converte Buffer para Uint8Array para compatibilidade com Blob
    const uint8Array = new Uint8Array(fileData.buffer);
    const blob = new Blob([uint8Array], { type: contentType });
    formData.append('file', blob, filename);
    formData.append('model', OPENAI_TRANSCRIBE_MODEL);
    formData.append('language', 'pt'); // Português

    console.log(`📤 Enviando para OpenAI: filename=${filename}, model=${OPENAI_TRANSCRIBE_MODEL}, size=${fileData.buffer.length} bytes, contentType=${contentType}`);

    // Chama a API da OpenAI
    // IMPORTANTE: Não incluir Content-Type header - o fetch vai definir automaticamente com boundary
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        // Não definir Content-Type - o FormData define automaticamente com boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro ao transcrever áudio: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    const transcription = data.text?.trim() || null;

    if (transcription) {
      console.log(`✅ Transcrição concluída: ${transcription.substring(0, 50)}...`);
    } else {
      console.warn(`⚠️ Transcrição vazia para áudio: ${midiaId}`);
    }

    return transcription;
  } catch (error) {
    console.error('❌ Erro ao transcrever áudio:', error);
    return null;
  }
}
