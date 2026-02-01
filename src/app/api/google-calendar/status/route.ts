import { NextRequest, NextResponse } from 'next/server';
import { isGoogleCalendarConnected, getGoogleCalendarAccount } from '@/lib/google-calendar/client';
import { getUserId } from '@/lib/utils/getUserId';

/**
 * API Route para verificar status da conexão Google Calendar
 * GET /api/google-calendar/status
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const connected = await isGoogleCalendarConnected(userId);
    const account = connected ? await getGoogleCalendarAccount(userId) : null;

    return NextResponse.json(
      {
        success: true,
        connected,
        account: account
          ? {
              email: account.email,
              calendarId: account.calendarId,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Erro ao verificar status Google Calendar:', error);
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
