import connectDB from '@/lib/db';
import FeedPost from '@/lib/models/FeedPost';
import { postToInstagramFeed } from './postInstagramFeed';

/**
 * Processa posts agendados que já passaram da data/hora programada
 * Esta função é chamada periodicamente pelo servidor
 */
export async function processScheduledPosts(): Promise<void> {
  try {
    await connectDB();

    const now = new Date();

    // Busca posts agendados (statusPost = false) que já passaram da data programada
    const scheduledPosts = await FeedPost.find({
      statusPost: false,
      dataPublicacao: { $lte: now }, // Data de publicação menor ou igual a agora
    })
      .sort({ dataPublicacao: 1 }) // Ordena do mais antigo para o mais recente
      .lean();

    if (scheduledPosts.length === 0) {
      console.log('📅 Nenhum post agendado para processar');
      return;
    }

    console.log(`📅 Encontrados ${scheduledPosts.length} post(s) agendado(s) para processar`);

    // Processa cada post em ordem (do mais atrasado para o menos atrasado)
    for (const post of scheduledPosts) {
      try {
        console.log(`📤 Processando post agendado: ${post._id} (Data: ${post.dataPublicacao})`);

        // Posta no Instagram
        const instagramResult = await postToInstagramFeed(
          post.imagem,
          post.descricao || undefined
        );

        if (instagramResult.success) {
          // Atualiza o statusPost para true e salva o ID do post do Instagram
          await FeedPost.findByIdAndUpdate(post._id, {
            statusPost: true,
          });

          console.log(`✅ Post ${post._id} publicado no Instagram com sucesso (ID: ${instagramResult.id})`);
        } else {
          console.error(`❌ Erro ao publicar post ${post._id}: ${instagramResult.error}`);
          // Não atualiza o statusPost, para tentar novamente na próxima verificação
        }

        // Pequeno delay entre posts para não sobrecarregar a API do Instagram
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 segundos entre posts
      } catch (error) {
        console.error(`❌ Erro ao processar post ${post._id}:`, error);
        // Continua processando os próximos posts mesmo se um falhar
      }
    }

    console.log(`✅ Processamento de posts agendados concluído`);
  } catch (error) {
    console.error('❌ Erro ao processar posts agendados:', error);
  }
}

/**
 * Inicia o processo de verificação periódica de posts agendados
 * Verifica a cada 10 minutos
 */
export function startScheduledPostsProcessor(): void {
  console.log('🚀 Iniciando processador de posts agendados (verificação a cada 10 minutos)');

  // Processa imediatamente ao iniciar
  processScheduledPosts().catch(console.error);

  // Depois processa a cada 10 minutos (600000 ms)
  const interval = setInterval(() => {
    processScheduledPosts().catch(console.error);
  }, 10 * 60 * 1000); // 10 minutos

  // Mantém o intervalo ativo (evita garbage collection)
  if (typeof global !== 'undefined') {
    (global as any).scheduledPostsInterval = interval;
  }

  console.log('✅ Processador de posts agendados iniciado');
}

