import axios from 'axios';
import { prisma } from '../../lib/prisma';

const ABACATEPAY_BASE = 'https://api.abacatepay.com/v1';

export const PLANOS = [
  {
    slug: 'basico',
    nome: 'Básico',
    preco: 4890,
    precoFormatado: 'R$ 48,90/mês',
    features: [
      'Até 10 campanhas ativas',
      'Meta + Google simultâneo',
      'Geração de criativos com IA',
      'Testes A/B',
      'Suporte prioritário',
    ],
  },
  {
    slug: 'pro',
    nome: 'Pro',
    preco: 6890,
    precoFormatado: 'R$ 68,90/mês',
    features: [
      'Campanhas ilimitadas',
      'Meta + Google simultâneo',
      'Testes A/B automáticos',
      'Logs completos da IA',
      'Suporte prioritário',
    ],
  },
];

export function listarPlanos() {
  return PLANOS;
}

export async function criarCheckout(userId: string, planoSlug: string): Promise<string> {
  const plano = PLANOS.find((p) => p.slug === planoSlug);
  if (!plano || plano.slug === 'free') {
    throw new Error('Plano inválido para checkout');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Usuário não encontrado');

  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3000';
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  const webhookSecret = process.env.ABACATEPAY_WEBHOOK_SECRET ?? '';

  const completionUrl = webhookSecret
    ? `${backendUrl}/api/pagamentos/webhook?token=${webhookSecret}`
    : `${backendUrl}/api/pagamentos/webhook`;

  const { data } = await axios.post(
    `${ABACATEPAY_BASE}/billing/create`,
    {
      frequency: 'MONTHLY',
      methods: ['PIX'],
      products: [
        {
          externalId: `${userId}:${planoSlug}`,
          name: plano.nome,
          quantity: 1,
          price: plano.preco,
        },
      ],
      returnUrl: `${frontendUrl}/assinatura?status=pendente`,
      completionUrl,
      customer: {
        name: user.nome,
        email: user.email,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  );

  return data.data.url as string;
}

interface AbacatePayWebhookPayload {
  event: string;
  data?: Record<string, unknown>;
}

function extrairExternalId(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  if (typeof data.externalId === 'string') return data.externalId;
  const nested = data.checkout ?? data.billing ?? data.subscription;
  if (nested && typeof nested === 'object') {
    const n = nested as Record<string, unknown>;
    if (typeof n.externalId === 'string') return n.externalId;
  }
  return null;
}

export async function processarWebhook(payload: AbacatePayWebhookPayload): Promise<void> {
  const { event, data } = payload;

  if (event === 'checkout.completed' || event === 'subscription.renewed') {
    const externalId = extrairExternalId(data);
    if (!externalId) return;

    const [userId, planoSlug] = externalId.split(':');
    if (!userId || !planoSlug) return;

    const planoValido = PLANOS.find((p) => p.slug === planoSlug);
    if (!planoValido) return;

    await prisma.user.update({ where: { id: userId }, data: { plano: planoSlug } });
    return;
  }

  if (event === 'subscription.cancelled') {
    const externalId = extrairExternalId(data);
    if (!externalId) return;

    const [userId] = externalId.split(':');
    if (!userId) return;

    await prisma.user.update({ where: { id: userId }, data: { plano: 'free' } });
  }
}
