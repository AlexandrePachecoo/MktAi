import axios from 'axios';
import { prisma } from '../../lib/prisma';

const ABACATEPAY_BASE = 'https://api.abacatepay.com/v2';

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

type Plano = (typeof PLANOS)[number];

interface UserMin {
  id: string;
  nome: string;
  email: string;
  cpf: string | null;
  telefone: string | null;
}

export function listarPlanos() {
  return PLANOS;
}

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function ensureProduct(plano: Plano): Promise<string> {
  const headers = authHeaders();

  try {
    const { data } = await axios.get(`${ABACATEPAY_BASE}/products/list`, {
      params: { externalId: plano.slug, limit: 1 },
      headers,
    });
    const existing = data?.data?.[0];
    if (existing?.id) return existing.id as string;
  } catch (_) {
    // se a busca falhar, segue para criação
  }

  const { data } = await axios.post(
    `${ABACATEPAY_BASE}/products/create`,
    {
      externalId: plano.slug,
      name: plano.nome,
      price: plano.preco,
      currency: 'BRL',
    },
    { headers },
  );
  return data.data.id as string;
}

async function ensureCustomer(user: UserMin): Promise<string> {
  const headers = authHeaders();

  try {
    const { data } = await axios.get(`${ABACATEPAY_BASE}/customers/list`, {
      params: { email: user.email, limit: 1 },
      headers,
    });
    const existing = data?.data?.[0];
    if (existing?.id) return existing.id as string;
  } catch (_) {
    // se a busca falhar, segue para criação
  }

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
    `${ABACATEPAY_BASE}/customers/create`,
    customer,
    { headers },
  );
  return data.data.id as string;
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

  try {
    const [productId, customerId] = await Promise.all([
      ensureProduct(plano),
      ensureCustomer(user),
    ]);

    const { data } = await axios.post(
      `${ABACATEPAY_BASE}/checkouts/create`,
      {
        items: [{ id: productId, quantity: 1 }],
        methods: ['PIX'],
        returnUrl: `${frontendUrl}/assinar?status=pendente`,
        completionUrl,
        customerId,
        externalId: `${userId}:${planoSlug}`,
      },
      { headers: authHeaders() },
    );

    return data.data.url as string;
  } catch (err: any) {
    const detail = err?.response?.data ?? err?.message;
    console.error('[pagamentos] AbacatePay erro:', JSON.stringify(detail));
    throw err;
  }
}

interface AbacatePayWebhookPayload {
  event: string;
  data?: {
    externalId?: string;
    products?: Array<{ externalId?: string }>;
    status?: string;
  };
}

export async function processarWebhook(payload: AbacatePayWebhookPayload): Promise<void> {
  if (payload.event !== 'BILLING_PAID') return;

  const externalId =
    payload.data?.externalId ?? payload.data?.products?.[0]?.externalId;
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
