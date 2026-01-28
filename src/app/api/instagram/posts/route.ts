import { NextResponse } from 'next/server';

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;

interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  caption?: string;
  like_count?: number;
  comments_count?: number;
}

/**
 * API Route para buscar posts do Instagram
 * GET /api/instagram/posts
 */
export async function GET() {
  try {
    if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_USER_ID) {
      return NextResponse.json(
        {
          success: false,
          error: 'Configuração do Instagram não encontrada. Configure INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_USER_ID no .env.local',
        },
        { status: 400 }
      );
    }

    // Busca os posts do Instagram usando a Graph API
    // Documentação: https://developers.facebook.com/docs/instagram-api/reference/ig-user/media
    const url = `https://graph.facebook.com/v21.0/${INSTAGRAM_USER_ID}/media`;
    
    const params = new URLSearchParams({
      fields: 'id,media_type,media_url,thumbnail_url,permalink,timestamp,caption,like_count,comments_count',
      access_token: INSTAGRAM_ACCESS_TOKEN,
      limit: '25', // Limita a 25 posts
    });

    const response = await fetch(`${url}?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao buscar posts do Instagram:', errorData);
      return NextResponse.json(
        {
          success: false,
          error: errorData.error?.message || `Erro ${response.status}: ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Formata os dados para o frontend
    const posts: InstagramMedia[] = (data.data || []).map((post: any) => ({
      id: post.id,
      media_type: post.media_type,
      media_url: post.media_url,
      thumbnail_url: post.thumbnail_url,
      permalink: post.permalink,
      timestamp: post.timestamp,
      caption: post.caption || '',
      like_count: post.like_count || 0,
      comments_count: post.comments_count || 0,
    }));

    return NextResponse.json(
      {
        success: true,
        posts,
        pagination: data.paging || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao buscar posts do Instagram:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

