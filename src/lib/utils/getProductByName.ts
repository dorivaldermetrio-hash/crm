/**
 * Utilitário para buscar um produto específico por nome
 */

import connectDB from '@/lib/db';
import Produto from '@/lib/models/Produto';

export interface ProductInfo {
  nome: string;
  descBreve: string;
  descCompleta: string;
  valor: string;
  duracao: string;
}

/**
 * Busca um produto pelo nome
 * @param nome - Nome do produto a ser buscado
 * @returns Objeto com informações do produto ou null se não encontrado
 */
export async function getProductByName(nome: string): Promise<ProductInfo | null> {
  try {
    if (!nome || nome.trim() === '') {
      return null;
    }

    await connectDB();

    const produto = await Produto.findOne({ nome: nome.trim() }).lean();

    if (!produto) {
      return null;
    }

    return {
      nome: produto.nome || '',
      descBreve: produto.descBreve || '',
      descCompleta: produto.descCompleta || '',
      valor: produto.valor || '',
      duracao: produto.duracao || '',
    };
  } catch (error) {
    console.error('❌ Erro ao buscar produto por nome:', error);
    return null;
  }
}

