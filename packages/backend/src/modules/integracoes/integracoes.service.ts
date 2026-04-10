import axios from 'axios';
import { prisma } from '../../lib/prisma';

// ─── Meta ────────────────────────────────────────────────────────────────────

export function getMetaAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID as string,
    redirect_uri: process.env.META_REDIRECT_URI as string,
    scope: 'ads_management,ads_read,business_management',
    response_type: 'code',
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

export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI as string,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/adwords',
    access_type: 'offline',
    prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
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
