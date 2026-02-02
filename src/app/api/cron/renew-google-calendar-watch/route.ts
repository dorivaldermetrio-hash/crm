import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import GoogleCalendarAccount from '@/lib/models/GoogleCalendarAccount';
import { configurarWatchGoogleCalendar } from '@/lib/google-calendar/watch';

/**
 * API Route para renovar watches do Google Calendar que estão próximos de expirar
 * GET /api/cron/renew-google-calendar-watch
 * 
 * Esta rota é chamada diariamente às 2h da manhã pelo Vercel Cron
 * para renovar os watches do Google Calendar antes que expirem (7 dias)
 */
export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    // Renova watches que expiram em menos de 2 dias
    const expirationThreshold = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    console.log('🔄 Verificando watches do Google Calendar para renovação...');
    console.log('   Data atual:', now.toISOString());
    console.log('   Limite de expiração:', expirationThreshold.toISOString());

    // Busca contas com watch que expira em menos de 2 dias
    const accountsToRenew = await GoogleCalendarAccount.find({
      watchResourceId: { $exists: true, $ne: null },
      $or: [
        { watchExpiration: { $exists: false } }, // Sem data de expiração (watch antigo)
        { watchExpiration: { $lt: expirationThreshold } }, // Expira em menos de 2 dias
      ],
    }).lean();

    if (accountsToRenew.length === 0) {
      console.log('✅ Nenhum watch precisa ser renovado');
      return NextResponse.json({
        success: true,
        message: 'Nenhum watch precisa ser renovado',
        renewed: 0,
      });
    }

    console.log(`📅 Encontradas ${accountsToRenew.length} conta(s) com watch para renovar`);

    let renewed = 0;
    let failed = 0;

    for (const account of accountsToRenew) {
      try {
        console.log(`🔄 Renovando watch para userId: ${account.userId}`);
        const result = await configurarWatchGoogleCalendar(account.userId);
        
        if (result === true) {
          renewed++;
          console.log(`✅ Watch renovado com sucesso para userId: ${account.userId}`);
        } else {
          failed++;
          console.error(`❌ Falha ao renovar watch para userId: ${account.userId}`);
        }
      } catch (error) {
        failed++;
        console.error(`❌ Erro ao renovar watch para userId: ${account.userId}:`, error);
      }
    }

    console.log(`✅ Renovação concluída: ${renewed} renovado(s), ${failed} falha(s)`);

    return NextResponse.json({
      success: true,
      message: 'Renovação de watches concluída',
      renewed,
      failed,
      total: accountsToRenew.length,
    });
  } catch (error) {
    console.error('❌ Erro ao renovar watches do Google Calendar:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
