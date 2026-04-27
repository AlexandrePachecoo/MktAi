import axios from 'axios';
import { getValidToken } from './integracoes.service';
import { prisma } from '../../lib/prisma';

const GRAPH = 'https://graph.facebook.com/v19.0';

function extractMetaError(err: unknown): never {
  if (axios.isAxiosError(err)) {
    const error = err.response?.data?.error;
    const status = err.response?.status;
    console.error(`[meta-ads] HTTP ${status}: code=${error?.code} subcode=${error?.error_subcode} type=${error?.type} msg="${error?.message}" user_title="${error?.error_user_title}"`);
    throw new Error(error?.message ?? `Meta API error: HTTP ${status}`);
  }
  throw err;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function getAccountId(userId: string): Promise<string> {
  const integracao = await prisma.integracao.findUnique({
    where: { user_id_plataforma: { user_id: userId, plataforma: 'meta' } },
  });
  if (!integracao?.account_id) throw new Error('Conta Meta não selecionada');
  const id = integracao.account_id;
  return id.startsWith('act_') ? id : `act_${id}`;
}

// ─── Perfil / Pages ───────────────────────────────────────────────────────────

export async function buscarPerfilMeta(userId: string) {
  const access_token = await getValidToken(userId, 'meta');
  const { data } = await axios.get(`${GRAPH}/me`, {
    params: { fields: 'id,name,email', access_token },
  });
  return data;
}

export async function listarPaginasMeta(userId: string) {
  const access_token = await getValidToken(userId, 'meta');
  const { data } = await axios.get(`${GRAPH}/me/accounts`, {
    params: { fields: 'id,name,access_token,category', access_token },
  });
  return data?.data ?? [];
}

// ─── Campanhas ────────────────────────────────────────────────────────────────

export async function listarCampanhasMeta(userId: string) {
  const access_token = await getValidToken(userId, 'meta');
  const accountId = await getAccountId(userId);
  const { data } = await axios.get(`${GRAPH}/${accountId}/campaigns`, {
    params: {
      fields: 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time',
      access_token,
    },
  });
  return data?.data ?? [];
}

export async function criarCampanhaMeta(
  userId: string,
  payload: {
    name: string;
    objective: string;
    status?: string;
    daily_budget?: number;
    lifetime_budget?: number;
    start_time?: string;
    stop_time?: string;
    special_ad_categories?: string[];
  }
) {
  const access_token = await getValidToken(userId, 'meta');
  const accountId = await getAccountId(userId);
  try {
    const { data } = await axios.post(`${GRAPH}/${accountId}/campaigns`, {
      ...payload,
      status: payload.status ?? 'PAUSED',
      special_ad_categories: payload.special_ad_categories ?? [],
      access_token,
    });
    return data;
  } catch (err) {
    extractMetaError(err);
  }
}

export async function atualizarCampanhaMeta(
  userId: string,
  campaignId: string,
  payload: Partial<{ name: string; status: string; daily_budget: number }>
) {
  const access_token = await getValidToken(userId, 'meta');
  const { data } = await axios.post(`${GRAPH}/${campaignId}`, {
    ...payload,
    access_token,
  });
  return data;
}

export async function deletarCampanhaMeta(userId: string, campaignId: string) {
  const access_token = await getValidToken(userId, 'meta');
  const { data } = await axios.delete(`${GRAPH}/${campaignId}`, {
    params: { access_token },
  });
  return data;
}

// ─── Conjuntos de anúncios (Ad Sets) ─────────────────────────────────────────

export async function listarAdSetsMeta(userId: string, campaignId?: string) {
  const access_token = await getValidToken(userId, 'meta');
  const accountId = await getAccountId(userId);
  const endpoint = campaignId
    ? `${GRAPH}/${campaignId}/adsets`
    : `${GRAPH}/${accountId}/adsets`;
  const { data } = await axios.get(endpoint, {
    params: {
      fields: 'id,name,status,daily_budget,optimization_goal,billing_event,targeting,campaign_id',
      access_token,
    },
  });
  return data?.data ?? [];
}

export async function criarAdSetMeta(
  userId: string,
  payload: {
    name: string;
    campaign_id: string;
    daily_budget: number;
    billing_event: string;
    optimization_goal: string;
    targeting: Record<string, unknown>;
    status?: string;
    start_time?: string;
    end_time?: string;
    is_adset_budget_sharing_enabled?: boolean;
  }
) {
  const access_token = await getValidToken(userId, 'meta');
  const accountId = await getAccountId(userId);
  try {
    const { data } = await axios.post(`${GRAPH}/${accountId}/adsets`, {
      ...payload,
      status: payload.status ?? 'PAUSED',
      access_token,
    });
    return data;
  } catch (err) {
    extractMetaError(err);
  }
}

export async function atualizarAdSetMeta(
  userId: string,
  adsetId: string,
  payload: Partial<{ name: string; status: string; daily_budget: number }>
) {
  const access_token = await getValidToken(userId, 'meta');
  const { data } = await axios.post(`${GRAPH}/${adsetId}`, {
    ...payload,
    access_token,
  });
  return data;
}

// ─── Criativos ────────────────────────────────────────────────────────────────

export async function listarCriativosMeta(userId: string) {
  const access_token = await getValidToken(userId, 'meta');
  const accountId = await getAccountId(userId);
  const { data } = await axios.get(`${GRAPH}/${accountId}/adcreatives`, {
    params: {
      fields: 'id,name,object_story_spec,thumbnail_url',
      access_token,
    },
  });
  return data?.data ?? [];
}

export async function criarCriativoMeta(
  userId: string,
  payload: {
    name: string;
    object_story_spec: Record<string, unknown>;
  }
) {
  const access_token = await getValidToken(userId, 'meta');
  const accountId = await getAccountId(userId);
  const { data } = await axios.post(`${GRAPH}/${accountId}/adcreatives`, {
    ...payload,
    access_token,
  });
  return data;
}

// ─── Anúncios ─────────────────────────────────────────────────────────────────

export async function listarAnunciosMeta(userId: string, adsetId?: string) {
  const access_token = await getValidToken(userId, 'meta');
  const accountId = await getAccountId(userId);
  const endpoint = adsetId
    ? `${GRAPH}/${adsetId}/ads`
    : `${GRAPH}/${accountId}/ads`;
  const { data } = await axios.get(endpoint, {
    params: {
      fields: 'id,name,status,adset_id,creative{id,name,thumbnail_url}',
      access_token,
    },
  });
  return data?.data ?? [];
}

export async function criarAnuncioMeta(
  userId: string,
  payload: {
    name: string;
    adset_id: string;
    creative: { creative_id: string };
    status?: string;
  }
) {
  const access_token = await getValidToken(userId, 'meta');
  const accountId = await getAccountId(userId);
  const { data } = await axios.post(`${GRAPH}/${accountId}/ads`, {
    ...payload,
    status: payload.status ?? 'PAUSED',
    access_token,
  });
  return data;
}

export async function atualizarAnuncioMeta(
  userId: string,
  adId: string,
  payload: Partial<{ name: string; status: string }>
) {
  const access_token = await getValidToken(userId, 'meta');
  const { data } = await axios.post(`${GRAPH}/${adId}`, {
    ...payload,
    access_token,
  });
  return data;
}

// ─── Insights (desempenho) ────────────────────────────────────────────────────

export async function buscarInsightsMeta(
  userId: string,
  options: {
    level?: 'account' | 'campaign' | 'adset' | 'ad';
    date_preset?: string;
    time_range?: { since: string; until: string };
    fields?: string[];
    objectId?: string;
  } = {}
) {
  const access_token = await getValidToken(userId, 'meta');
  const accountId = await getAccountId(userId);
  const {
    level = 'campaign',
    date_preset = 'last_30d',
    time_range,
    fields = ['impressions', 'clicks', 'spend', 'cpm', 'cpc', 'ctr', 'reach', 'frequency'],
    objectId,
  } = options;

  const endpoint = objectId
    ? `${GRAPH}/${objectId}/insights`
    : `${GRAPH}/${accountId}/insights`;

  const params: Record<string, unknown> = {
    level,
    fields: fields.join(','),
    access_token,
  };

  if (time_range) {
    params.time_range = JSON.stringify(time_range);
  } else {
    params.date_preset = date_preset;
  }

  const { data } = await axios.get(endpoint, { params });
  return data?.data ?? [];
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export async function listarFormulariosLeadsMeta(userId: string, pageId: string) {
  const access_token = await getValidToken(userId, 'meta');
  const { data } = await axios.get(`${GRAPH}/${pageId}/leadgen_forms`, {
    params: {
      fields: 'id,name,status,leads_count,created_time',
      access_token,
    },
  });
  return data?.data ?? [];
}

export async function buscarLeadsMeta(userId: string, formId: string) {
  const access_token = await getValidToken(userId, 'meta');
  const { data } = await axios.get(`${GRAPH}/${formId}/leads`, {
    params: {
      fields: 'id,created_time,field_data,ad_id,adset_id,campaign_id,form_id',
      access_token,
    },
  });
  return data?.data ?? [];
}

export async function criarFormularioLeadsMeta(
  userId: string,
  pageId: string,
  payload: {
    name: string;
    questions: { type: string; label?: string; key?: string }[];
    privacy_policy: { url: string };
    locale?: string;
  }
) {
  const access_token = await getValidToken(userId, 'meta');
  const { data } = await axios.post(`${GRAPH}/${pageId}/leadgen_forms`, {
    ...payload,
    locale: payload.locale ?? 'pt_BR',
    access_token,
  });
  return data;
}

// ─── Anúncios de Apps ─────────────────────────────────────────────────────────

export async function buscarAppsAnunciadosMeta(userId: string) {
  const access_token = await getValidToken(userId, 'meta');
  const { data } = await axios.get(`${GRAPH}/me/applications`, {
    params: { fields: 'id,name,link', access_token },
  });
  return data?.data ?? [];
}
