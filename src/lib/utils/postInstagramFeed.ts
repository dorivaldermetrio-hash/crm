/**
 * Utilitário para postar imagens no feed do Instagram usando a Graph API
 */

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;

interface InstagramPostResult {
  id: string;
  success: boolean;
  error?: string;
}

/**
 * Cria um container de mídia no Instagram
 * @param imageUrl - URL da imagem no Cloudinary
 * @param caption - Legenda do post (opcional)
 */
async function createMediaContainer(
  imageUrl: string,
  caption?: string
): Promise<string> {
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
    throw new Error('Credenciais do Instagram não configuradas');
  }

  const url = `https://graph.facebook.com/v18.0/${INSTAGRAM_USER_ID}/media`;

  const params = new URLSearchParams({
    image_url: imageUrl,
    access_token: INSTAGRAM_ACCESS_TOKEN,
    ...(caption && { caption }),
  });

  const response = await fetch(`${url}?${params.toString()}`, {
    method: 'POST',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Erro ao criar container de mídia: ${errorData.error?.message || 'Erro desconhecido'}`
    );
  }

  const data = await response.json();
  return data.id; // Retorna o creation_id
}

/**
 * Publica o container de mídia no feed do Instagram
 * @param creationId - ID do container criado
 */
async function publishMediaContainer(creationId: string): Promise<string> {
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
    throw new Error('Credenciais do Instagram não configuradas');
  }

  const url = `https://graph.facebook.com/v18.0/${INSTAGRAM_USER_ID}/media_publish`;

  const params = new URLSearchParams({
    creation_id: creationId,
    access_token: INSTAGRAM_ACCESS_TOKEN,
  });

  const response = await fetch(`${url}?${params.toString()}`, {
    method: 'POST',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Erro ao publicar no Instagram: ${errorData.error?.message || 'Erro desconhecido'}`
    );
  }

  const data = await response.json();
  return data.id; // Retorna o ID do post publicado
}

/**
 * Verifica o status de um container de mídia
 * @param creationId - ID do container
 */
async function checkMediaStatus(creationId: string): Promise<string> {
  if (!INSTAGRAM_ACCESS_TOKEN) {
    throw new Error('Credenciais do Instagram não configuradas');
  }

  const url = `https://graph.facebook.com/v18.0/${creationId}`;

  const params = new URLSearchParams({
    fields: 'status_code',
    access_token: INSTAGRAM_ACCESS_TOKEN,
  });

  const response = await fetch(`${url}?${params.toString()}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Erro ao verificar status: ${errorData.error?.message || 'Erro desconhecido'}`
    );
  }

  const data = await response.json();
  return data.status_code;
}

/**
 * Posta uma imagem no feed do Instagram
 * @param imageUrl - URL da imagem no Cloudinary
 * @param caption - Legenda do post (opcional)
 */
export async function postToInstagramFeed(
  imageUrl: string,
  caption?: string
): Promise<InstagramPostResult> {
  try {
    if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
      throw new Error('Credenciais do Instagram não configuradas');
    }

    // Passo 1: Criar container de mídia
    console.log('📸 Criando container de mídia no Instagram...');
    const creationId = await createMediaContainer(imageUrl, caption);
    console.log('✅ Container criado:', creationId);

    // Passo 2: Aguardar o processamento da imagem (pode levar alguns segundos)
    console.log('⏳ Aguardando processamento da imagem...');
    let status = await checkMediaStatus(creationId);
    let attempts = 0;
    const maxAttempts = 30; // Máximo de 30 tentativas (30 segundos)

    while (status !== 'FINISHED' && attempts < maxAttempts) {
      if (status === 'ERROR') {
        throw new Error('Erro ao processar imagem no Instagram');
      }
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Aguarda 1 segundo
      status = await checkMediaStatus(creationId);
      attempts++;
    }

    if (status !== 'FINISHED') {
      throw new Error('Timeout ao processar imagem no Instagram');
    }

    console.log('✅ Imagem processada com sucesso');

    // Passo 3: Publicar o container
    console.log('📤 Publicando no feed do Instagram...');
    const mediaId = await publishMediaContainer(creationId);
    console.log('✅ Post publicado com sucesso:', mediaId);

    return {
      id: mediaId,
      success: true,
    };
  } catch (error) {
    console.error('❌ Erro ao postar no Instagram:', error);
    return {
      id: '',
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

