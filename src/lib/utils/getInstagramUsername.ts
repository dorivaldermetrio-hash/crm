/**
 * Busca o username do Instagram usando a Graph API
 */

const INSTAGRAM_API_URL = 'https://graph.facebook.com/v21.0';
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;

/**
 * Busca o username do Instagram a partir do ID
 */
export async function getInstagramUsername(instagramId: string): Promise<string | null> {
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
    console.error('❌ INSTAGRAM_ACCESS_TOKEN ou INSTAGRAM_USER_ID não configurado');
    return null;
  }

  try {
    // A API do Instagram não permite buscar username diretamente pelo ID em alguns casos
    // Vamos tentar obter informações do usuário se possível
    // Por enquanto, retorna o ID formatado como username
    // Em produção, você pode usar a API para buscar o username real
    
    // Se o instagramId já contém @, retorna direto
    if (instagramId.startsWith('@')) {
      return instagramId;
    }

    // Tenta buscar informações do usuário via API do Instagram
    // Nota: Esta funcionalidade pode ser limitada pela API do Instagram
    // Por enquanto, vamos usar o ID como identificador e tentar buscar depois
    
    return `@user_${instagramId.slice(-6)}`; // Retorna um placeholder
  } catch (error) {
    console.error('Erro ao buscar username do Instagram:', error);
    return null;
  }
}

/**
 * Obtém informações do usuário do Instagram
 */
export async function getInstagramUserInfo(instagramId: string): Promise<{
  username?: string;
  name?: string;
} | null> {
  if (!INSTAGRAM_ACCESS_TOKEN) {
    return null;
  }

  try {
    // A Graph API do Instagram tem limitações para buscar informações de usuários
    // Esta função pode precisar ser adaptada conforme as permissões disponíveis
    return null;
  } catch (error) {
    console.error('Erro ao buscar informações do usuário do Instagram:', error);
    return null;
  }
}

