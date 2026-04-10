import axios from 'axios';
import { prisma } from '../../lib/prisma';

export interface MetricasMeta {
  plataforma: 'meta';
  impressoes: number;
  cliques: number;
  gasto: number;
  alcance: number;
  ctr: number;
  cpc: number;
}

export interface MetricasGoogle {
  plataforma: 'google';
  impressoes: number;
  cliques: number;
  gasto: number;
  ctr: number;
  cpc: number;
}

export type Metricas = MetricasMeta | MetricasGoogle | (MetricasMeta & MetricasGoogle & { plataforma: 'ambos' });

async function buscarMetricasMeta(externalCampanhaId: string, accessToken: string): Promise<MetricasMeta> {
  const { data } = await axios.get(
    `https://graph.facebook.com/v19.0/${externalCampanhaId}/insights`,
    {
      params: {
        fields: 'impressions,clicks,spend,reach,ctr,cpc',
        access_token: accessToken,
      },
    }
  );

  const row = data?.data?.[0] ?? {};
  return {
    plataforma: 'meta',
    impressoes: Number(row.impressions ?? 0),
    cliques: Number(row.clicks ?? 0),
    gasto: Number(row.spend ?? 0),
    alcance: Number(row.reach ?? 0),
    ctr: Number(row.ctr ?? 0),
    cpc: Number(row.cpc ?? 0),
  };
}

async function buscarMetricasGoogle(externalCampanhaId: string, accessToken: string): Promise<MetricasGoogle> {
  const { data } = await axios.get(
    `https://googleads.googleapis.com/v16/customers/-/googleAds:search`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '',
      },
      data: {
        query: `
          SELECT
            campaign.id,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.ctr,
            metrics.average_cpc
          FROM campaign
          WHERE campaign.id = ${externalCampanhaId}
          AND segments.date DURING LAST_30_DAYS
        `,
      },
    }
  );

  const row = data?.results?.[0]?.metrics ?? {};
  return {
    plataforma: 'google',
    impressoes: Number(row.impressions ?? 0),
    cliques: Number(row.clicks ?? 0),
    gasto: Number(row.cost_micros ?? 0) / 1_000_000,
    ctr: Number(row.ctr ?? 0),
    cpc: Number(row.average_cpc ?? 0) / 1_000_000,
  };
}

export async function buscarDashboard(campanhaId: string, userId: string) {
  const campanha = await prisma.campanha.findUnique({ where: { id: campanhaId } });

  if (!campanha) {
    const err = new Error('NOT_FOUND');
    err.name = 'NOT_FOUND';
    throw err;
  }
  if (campanha.user_id !== userId) {
    const err = new Error('FORBIDDEN');
    err.name = 'FORBIDDEN';
    throw err;
  }

  const plataformas = campanha.plataforma === 'ambos'
    ? ['meta', 'google']
    : [campanha.plataforma];

  const integracoes = await prisma.integracao.findMany({
    where: { user_id: userId, plataforma: { in: plataformas } },
  });

  const tokenPorPlataforma = Object.fromEntries(
    integracoes.map((i) => [i.plataforma, i.access_token])
  );

  const resultados: Record<string, unknown> = {
    campanha_id: campanhaId,
    nome: campanha.nome,
    status: campanha.status,
    plataforma: campanha.plataforma,
  };

  if (plataformas.includes('meta')) {
    if (!tokenPorPlataforma['meta']) {
      resultados['meta'] = { erro: 'Integração com Meta não encontrada' };
    } else {
      try {
        resultados['meta'] = await buscarMetricasMeta(campanhaId, tokenPorPlataforma['meta']);
      } catch {
        resultados['meta'] = { erro: 'Erro ao buscar métricas do Meta' };
      }
    }
  }

  if (plataformas.includes('google')) {
    if (!tokenPorPlataforma['google']) {
      resultados['google'] = { erro: 'Integração com Google não encontrada' };
    } else {
      try {
        resultados['google'] = await buscarMetricasGoogle(campanhaId, tokenPorPlataforma['google']);
      } catch {
        resultados['google'] = { erro: 'Erro ao buscar métricas do Google' };
      }
    }
  }

  return resultados;
}
