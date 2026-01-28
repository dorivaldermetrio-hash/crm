import { NextResponse } from 'next/server';
import { deleteImage } from '@/lib/utils/cloudinary';

/**
 * API Route para deletar uma imagem do Cloudinary
 * DELETE /api/cloudinary/images/[publicId]
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params;
    const decodedPublicId = decodeURIComponent(publicId);

    await deleteImage(decodedPublicId, 'image');

    return NextResponse.json({
      success: true,
      message: 'Imagem deletada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar imagem do Cloudinary:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao deletar imagem',
      },
      { status: 500 }
    );
  }
}

