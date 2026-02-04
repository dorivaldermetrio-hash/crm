import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import GoogleCalendarAccount from '@/lib/models/GoogleCalendarAccount';
import { getUserId } from '@/lib/utils/getUserId';
import { pararWatchGoogleCalendar } from '@/lib/google-calendar/watch';

/**
 * API Route para desconectar Google Calendar
 * DELETE /api/google-calendar/disconnect
 */
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const userId = await getUserId(request);

    console.log('🔌 Desconectando Google Calendar para userId:', userId);

    // Busca a conta antes de deletar para parar o watch
    const account = await GoogleCalendarAccount.findOne({ userId }).lean();

    // Para o watch se existir
    if (account?.watchResourceId) {
      try {
        console.log('🛑 Parando watch do Google Calendar...');
        await pararWatchGoogleCalendar(account.watchResourceId, userId);
      } catch (watchError) {
        console.error('⚠️ Erro ao parar watch (não crítico):', watchError);
        // Continua mesmo se não conseguir parar o watch
      }
    }

    // Deleta a conta do Google Calendar
    const result = await GoogleCalendarAccount.findOneAndDelete({ userId });

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: 'Conta do Google Calendar não encontrada',
        },
        { status: 404 }
      );
    }

    console.log('✅ Google Calendar desconectado com sucesso');

    return NextResponse.json(
      {
        success: true,
        message: 'Google Calendar desconectado com sucesso',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Erro ao desconectar Google Calendar:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
