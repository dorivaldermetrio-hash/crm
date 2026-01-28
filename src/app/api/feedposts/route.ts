import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import FeedPost from '@/lib/models/FeedPost';
import { postToInstagramFeed } from '@/lib/utils/postInstagramFeed';
import { startScheduledPostsProcessor } from '@/lib/utils/processScheduledPosts';

// Inicia o processador de posts agendados quando o módulo é carregado
// Isso garante que o processo seja iniciado quando o servidor inicia
if (typeof global !== 'undefined' && !(global as any).scheduledPostsProcessorStarted) {
  startScheduledPostsProcessor();
  (global as any).scheduledPostsProcessorStarted = true;
}

/**
 * API Route para gerenciar posts do feed
 * GET /api/feedposts - Lista todos os posts
 * POST /api/feedposts - Cria um novo post
 */
export async function GET() {
  try {
    await connectDB();

    const posts = await FeedPost.find({})
      .sort({ dataPublicacao: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar posts',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { imagem, dataPublicacao, statusPost, descricao } = body;

    // Validações
    if (!imagem) {
      return NextResponse.json(
        {
          success: false,
          error: 'URL da imagem é obrigatória',
        },
        { status: 400 }
      );
    }

    if (!dataPublicacao) {
      return NextResponse.json(
        {
          success: false,
          error: 'Data de publicação é obrigatória',
        },
        { status: 400 }
      );
    }

    // Cria o novo post
    const newPost = new FeedPost({
      imagem,
      dataPublicacao: new Date(dataPublicacao),
      statusPost: statusPost !== undefined ? statusPost : false,
      descricao: descricao || '',
    });

    await newPost.save();

    // Se for para postar agora (statusPost = true), posta no Instagram
    let instagramResult = null;
    if (statusPost === true) {
      try {
        console.log('📸 Iniciando postagem no Instagram...');
        instagramResult = await postToInstagramFeed(imagem, descricao || undefined);
        
        if (!instagramResult.success) {
          // Se falhar no Instagram, atualiza o statusPost para false
          newPost.statusPost = false;
          await newPost.save();
          
          return NextResponse.json(
            {
              success: false,
              error: instagramResult.error || 'Erro ao postar no Instagram',
              post: newPost,
            },
            { status: 500 }
          );
        }
        
        console.log('✅ Post publicado no Instagram com sucesso:', instagramResult.id);
      } catch (error) {
        console.error('❌ Erro ao postar no Instagram:', error);
        // Se falhar no Instagram, atualiza o statusPost para false
        newPost.statusPost = false;
        await newPost.save();
        
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao postar no Instagram',
            post: newPost,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      post: newPost,
      instagramPostId: instagramResult?.id,
    });
  } catch (error) {
    console.error('Erro ao criar post:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar post',
      },
      { status: 500 }
    );
  }
}

