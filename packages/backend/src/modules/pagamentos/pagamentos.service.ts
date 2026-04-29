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
      'Até 2 campanhas',
      'Até 10 copies geradas',
      'Geração de estratégia com IA',
    ],
  },
  {
    slug: 'basico',
    nome: 'Básico',
    preco: 4890,
    precoFormatado: 'R$ 48,90/mês',
    features: [
      'Até 5 campanhas ativas',
      'Até 25 criativos',
      'Copies ilimitadas',
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
      'Até 10 campanhas',
      'Até 50 criativos',
      'Copies ilimitadas',
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

export async function criarCheckout(
  userId: string,
  planoSlug: string,
): Promise<string> {
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

  const customer: Record<string, string> = {
    name: user.nome,
    email: user.email,
  };
  if (user.cpf) {
    customer.taxId = user.cpf.replace(/\D/g, '');
  }
  if (user.telefone) {
    customer.cellphone = `+55${user.telefone.replace(/\D/g, '')}`;
  }

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
      returnUrl: `${frontendUrl}/assinar?status=pendente`,
      completionUrl,
      customer,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  ).catch((err) => {
    const detail = err?.response?.data ?? err?.message;
    console.error('[pagamentos] AbacatePay erro:', JSON.stringify(detail));
    throw err;
  });

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
