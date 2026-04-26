import axios from 'axios';
import { prisma } from '../../lib/prisma';
import { getValidToken } from '../integracoes/integracoes.service';

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
    `https://googleads.googleapis.com/v20/customers/-/googleAds:search`,
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

  const integracaoPorPlataforma = Object.fromEntries(
    integracoes.map((i) => [i.plataforma, i])
  );

  const resultados: Record<string, unknown> = {
    campanha_id: campanhaId,
    nome: campanha.nome,
    status: campanha.status,
    plataforma: campanha.plataforma,
  };

  if (plataformas.includes('meta')) {
    const integ = integracaoPorPlataforma['meta'];
    if (!integ) {
      resultados['meta'] = { erro: 'Integração com Meta não encontrada' };
    } else if (!integ.account_id) {
      resultados['meta'] = { erro: 'Conta de anúncios do Meta não configurada' };
    } else {
      try {
        const token = await getValidToken(userId, 'meta');
        // Usar meta_campaign_id se disponível (métricas específicas da campanha), senão usar account_id (conta inteira)
        const targetId = (campanha as any).meta_campaign_id ?? integ.account_id;
        resultados['meta'] = await buscarMetricasMeta(targetId, token);
      } catch {
        resultados['meta'] = { erro: 'Erro ao buscar métricas do Meta' };
      }
    }
  }

  if (plataformas.includes('google')) {
    const integ = integracaoPorPlataforma['google'];
    if (!integ) {
      resultados['google'] = { erro: 'Integração com Google não encontrada' };
    } else if (!integ.account_id) {
      resultados['google'] = { erro: 'Customer ID do Google Ads não configurado' };
    } else {
      try {
        const token = await getValidToken(userId, 'google');
        resultados['google'] = await buscarMetricasGoogle(integ.account_id, token);
      } catch {
        resultados['google'] = { erro: 'Erro ao buscar métricas do Google' };
      }
    }
  }

  return resultados;
}
