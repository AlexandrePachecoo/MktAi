import axios from 'axios';
import { prisma } from '../../lib/prisma';

const ABACATEPAY_BASE = 'https://api.abacatepay.com/v1';

export const PLANOS = [
  {
    slug: 'free',
    nome: 'Free',
    preco: 0,
    precoFormatado: 'Grátis',
    features: [
      '1 campanha ativa',
      '3 criativos por campanha',
      'Dashboard básico',
    ],
  },
  {
    slug: 'pro',
    nome: 'Pro',
    preco: 9700,
    precoFormatado: 'R$ 97/mês',
    features: [
      'Campanhas ilimitadas',
      'Criativos ilimitados',
      'Testes A/B',
      'Dashboard avançado',
      'Integrações Meta + Google',
    ],
  },
  {
    slug: 'enterprise',
    nome: 'Enterprise',
    preco: 29700,
    precoFormatado: 'R$ 297/mês',
    features: [
      'Tudo do Pro',
      'Suporte prioritário',
      'Múltiplas contas',
      'API access',
      'White-label',
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
  data?: {
    products?: Array<{ externalId?: string }>;
    status?: string;
  };
}

export async function processarWebhook(payload: AbacatePayWebhookPayload): Promise<void> {
  if (payload.event !== 'BILLING_PAID') return;

  const externalId = payload.data?.products?.[0]?.externalId;
  if (!externalId) return;

  const [userId, planoSlug] = externalId.split(':');
  if (!userId || !planoSlug) return;

  const planoValido = PLANOS.find((p) => p.slug === planoSlug);
  if (!planoValido) return;

  await prisma.user.update({
    where: { id: userId },
    data: { plano: planoSlug },
  });
}
