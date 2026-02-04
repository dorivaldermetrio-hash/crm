import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Utilitário para obter o ID do usuário autenticado
 * 
 * Obtém o userId do cookie de sessão criado após login OAuth
 * 
 * @param request - Request do Next.js (opcional, para compatibilidade)
 * @returns ID do usuário autenticado ou 'default-user' como fallback
 */
export async function getUserId(request?: NextRequest): Promise<string> {
  // Tenta obter do cookie (método preferido)
  try {
    const cookieStore = await cookies();
    const userIdFromCookie = cookieStore.get('userId')?.value;
    if (userIdFromCookie) {
      return userIdFromCookie;
    }
  } catch (error) {
    // Se não conseguir acessar cookies (pode acontecer em alguns contextos), tenta do request
    console.warn('⚠️ Não foi possível acessar cookies diretamente, tentando do request');
  }

  // Se houver request, tenta obter do header ou cookie do request
  if (request) {
    // Exemplo: obter de header customizado
    const userIdFromHeader = request.headers.get('x-user-id');
    if (userIdFromHeader) {
      return userIdFromHeader;
    }

    // Exemplo: obter de cookie do request
    const userIdFromCookie = request.cookies.get('userId')?.value;
    if (userIdFromCookie) {
      return userIdFromCookie;
    }
  }

  // Fallback: userId mockado (para desenvolvimento/testes)
  // Em produção, você pode lançar um erro se não houver usuário autenticado
  console.warn('⚠️ Usuário não autenticado, usando userId padrão');
  return 'default-user';
}

