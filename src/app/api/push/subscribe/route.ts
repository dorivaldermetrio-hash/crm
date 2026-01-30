import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PushSubscription from '@/lib/models/PushSubscription';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { success: false, error: 'Subscription inválida' },
        { status: 400 }
      );
    }

    // Verifica se já existe uma subscription com esse endpoint
    const existing = await PushSubscription.findOne({
      endpoint: subscription.endpoint,
    });

    if (existing) {
      // Atualiza a subscription existente
      existing.keys = subscription.keys;
      await existing.save();
      return NextResponse.json({
        success: true,
        message: 'Subscription atualizada',
      });
    }

    // Cria nova subscription
    const newSubscription = new PushSubscription({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    await newSubscription.save();

    return NextResponse.json({
      success: true,
      message: 'Subscription salva com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao salvar subscription:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao salvar subscription' },
      { status: 500 }
    );
  }
}
