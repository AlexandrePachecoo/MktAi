import axios from 'axios';
import { prisma } from '../../lib/prisma';

// ─── Token refresh ────────────────────────────────────────────────────────────

async function refreshGoogleToken(integracao: { user_id: string; refresh_token: string | null }) {
  if (!integracao.refresh_token) throw new Error('Google: refresh_token não disponível');

  const { data } = await axios.post('https://oauth2.googleapis.com/token', {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: integracao.refresh_token,
    grant_type: 'refresh_token',
  });

  const { access_token, expires_in } = data;
  const expires_at = expires_in ? new Date(Date.now() + expires_in * 1000) : null;

  await prisma.integracao.update({
    where: { user_id_plataforma: { user_id: integracao.user_id, plataforma: 'google' } },
    data: { access_token, expires_at },
  });

  return access_token as string;
}

async function refreshMetaToken(integracao: { user_id: string; access_token: string }) {
  const { data } = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      fb_exchange_token: integracao.access_token,
    },
  });

  const { access_token, expires_in } = data;
  const expires_at = expires_in ? new Date(Date.now() + expires_in * 1000) : null;

  await prisma.integracao.update({
    where: { user_id_plataforma: { user_id: integracao.user_id, plataforma: 'meta' } },
    data: { access_token, expires_at },
  });

  return access_token as string;
}

export async function getValidToken(userId: string, plataforma: 'meta' | 'google'): Promise<string> {
  const integracao = await prisma.integracao.findUnique({
    where: { user_id_plataforma: { user_id: userId, plataforma } },
  });

  if (!integracao) throw new Error(`${plataforma} não conectado`);

  const expiraEm5Min = integracao.expires_at
    ? integracao.expires_at.getTime() - Date.now() < 5 * 60 * 1000
    : false;

  if (!expiraEm5Min) return integracao.access_token;

  if (plataforma === 'google') return refreshGoogleToken(integracao);
  return refreshMetaToken(integracao);
}

// ─── Meta ────────────────────────────────────────────────────────────────────

export function getMetaAuthUrl(token: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID as string,
    redirect_uri: process.env.META_REDIRECT_URI as string,
    scope: 'ads_management,ads_read,business_management',
    response_type: 'code',
    state: token,
  });
  return `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
}

export async function handleMetaCallback(code: string, userId: string) {
  const { data } = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
    params: {
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      redirect_uri: process.env.META_REDIRECT_URI,
      code,
    },
  });

  const { access_token, expires_in } = data;
  const expires_at = expires_in
    ? new Date(Date.now() + expires_in * 1000)
    : null;

  await prisma.integracao.upsert({
    where: { user_id_plataforma: { user_id: userId, plataforma: 'meta' } },
    update: { access_token, expires_at },
    create: { user_id: userId, plataforma: 'meta', access_token, expires_at },
  });
}

// ─── Google ───────────────────────────────────────────────────────────────────

export function getGoogleAuthUrl(token: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI as string,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/adwords',
    access_type: 'offline',
    prompt: 'consent',
    state: token,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function listarIntegracoes(userId: string) {
  const rows = await prisma.integracao.findMany({ where: { user_id: userId } });
  const plataformas = ['meta', 'google'] as const;
  return plataformas.map(p => {
    const row = rows.find(r => r.plataforma === p);
    return {
      plataforma: p,
      conectado: !!row,
      account_id: row?.account_id ?? null,
      expires_at: row?.expires_at ?? null,
    };
  });
}

export async function desconectarIntegracao(userId: string, plataforma: string) {
  await prisma.integracao.deleteMany({ where: { user_id: userId, plataforma } });
}

export async function salvarAccountId(userId: string, plataforma: string, account_id: string) {
  await prisma.integracao.update({
    where: { user_id_plataforma: { user_id: userId, plataforma } },
    data: { account_id },
  });
}

export async function buscarContasGoogle(userId: string): Promise<{ id: string; name: string }[]> {
  const access_token = await getValidToken(userId, 'google');

  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken) throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN não configurado no .env');

  try {
    const { data } = await axios.get(
      'https://googleads.googleapis.com/v20/customers:listAccessibleCustomers',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'developer-token': developerToken,
        },
      }
    );

    // resourceNames: ["customers/1234567890", ...]
    const resourceNames: string[] = data?.resourceNames ?? [];
    const ids = resourceNames.map(r => r.replace('customers/', ''));

    // busca nome descritivo de cada conta em paralelo
    const contas = await Promise.all(
      ids.map(async id => {
        const formatted = id.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3');
        try {
          const { data: searchData } = await axios.post(
            `https://googleads.googleapis.com/v20/customers/${id}/googleAds:search`,
            { query: 'SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1' },
            {
              headers: {
                Authorization: `Bearer ${access_token}`,
                'developer-token': developerToken,
              },
            }
          );
          const nome = searchData?.results?.[0]?.customer?.descriptiveName || formatted;
          return { id, name: nome };
        } catch {
          return { id, name: `Conta ${formatted}` };
        }
      })
    );

    return contas;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const detail = JSON.stringify(err.response?.data ?? err.message);
      throw new Error(`Google Ads API: ${detail}`);
    }
    throw err;
  }
}

export async function buscarContasMeta(userId: string): Promise<{ id: string; name: string }[]> {
  const access_token = await getValidToken(userId, 'meta');

  const { data } = await axios.get('https://graph.facebook.com/v19.0/me/adaccounts', {
    params: {
      fields: 'id,name,account_status',
      access_token,
    },
  });

  return (data?.data ?? []).map((a: { id: string; name: string }) => ({
    id: a.id,
    name: a.name,
  }));
}

export async function handleGoogleCallback(code: string, userId: string) {
  const { data } = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const { access_token, refresh_token, expires_in } = data;
  const expires_at = expires_in
    ? new Date(Date.now() + expires_in * 1000)
    : null;

  await prisma.integracao.upsert({
    where: { user_id_plataforma: { user_id: userId, plataforma: 'google' } },
    update: { access_token, refresh_token, expires_at },
    create: { user_id: userId, plataforma: 'google', access_token, refresh_token, expires_at },
  });
}
