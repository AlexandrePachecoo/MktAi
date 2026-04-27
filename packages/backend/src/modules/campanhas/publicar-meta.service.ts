import axios from 'axios';
import { prisma } from '../../lib/prisma';
import {
  criarCampanhaMeta,
  criarAdSetMeta,
  criarCriativoMeta,
  criarAnuncioMeta,
  listarPaginasMeta,
} from '../integracoes/meta-ads.service';
import { getValidToken } from '../integracoes/integracoes.service';

const GRAPH = 'https://graph.facebook.com/v19.0';

const OBJETIVO_META: Record<string, string> = {
  conversao: 'OUTCOME_SALES',
  vendas: 'OUTCOME_SALES',
  leads: 'OUTCOME_LEADS',
  awareness: 'OUTCOME_AWARENESS',
  alcance: 'OUTCOME_AWARENESS',
  trafego: 'OUTCOME_TRAFFIC',
  engajamento: 'OUTCOME_ENGAGEMENT',
  apps: 'OUTCOME_APP_PROMOTION',
};

const OPTIMIZATION_MAP: Record<string, { billing_event: string; optimization_goal: string }> = {
  OUTCOME_SALES: { billing_event: 'IMPRESSIONS', optimization_goal: 'OFFSITE_CONVERSIONS' },
  OUTCOME_LEADS: { billing_event: 'IMPRESSIONS', optimization_goal: 'LEAD_GENERATION' },
  OUTCOME_AWARENESS: { billing_event: 'IMPRESSIONS', optimization_goal: 'REACH' },
  OUTCOME_TRAFFIC: { billing_event: 'IMPRESSIONS', optimization_goal: 'LINK_CLICKS' },
  OUTCOME_ENGAGEMENT: { billing_event: 'IMPRESSIONS', optimization_goal: 'POST_ENGAGEMENT' },
};

export async function publicarCampanhaNoMeta(campanhaId: string, userId: string) {
  try {
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

    // Já publicada?
    if ((campanha as any).meta_campaign_id) return campanha;

    const objetivo = campanha.objetivo?.toLowerCase() ?? '';
    const metaObjective = OBJETIVO_META[objetivo] ?? 'OUTCOME_TRAFFIC';
    const { billing_event, optimization_goal } = OPTIMIZATION_MAP[metaObjective] ?? OPTIMIZATION_MAP.OUTCOME_TRAFFIC;

    const metaCampanha = await criarCampanhaMeta(userId, {
      name: campanha.nome,
      objective: metaObjective,
      status: 'PAUSED',
      daily_budget: Math.round(campanha.orcamento * 100),
    });

    const metaAdSet = await criarAdSetMeta(userId, {
      name: `${campanha.nome} - Ad Set`,
      campaign_id: metaCampanha.id,
      daily_budget: Math.round(campanha.orcamento * 100),
      billing_event,
      optimization_goal,
      targeting: { geo_locations: { countries: ['BR'] }, age_min: 18, age_max: 65 },
      status: 'PAUSED',
    });

    return prisma.campanha.update({
      where: { id: campanhaId },
      data: { meta_campaign_id: metaCampanha.id, meta_adset_id: metaAdSet.id },
    });
  } catch (err) {
    console.error('[publicar-meta]', (err as Error).message);
    throw err;
  }
}

async function uploadImagemMeta(userId: string, accountId: string, imageUrl: string): Promise<string> {
  const access_token = await getValidToken(userId, 'meta');
  const { data } = await axios.post(`${GRAPH}/${accountId}/adimages`, {
    url: imageUrl,
    access_token,
  });
  const hashes = Object.values(data.images ?? {}) as any[];
  if (!hashes.length) throw new Error('Falha ao fazer upload da imagem para Meta');
  return hashes[0].hash;
}

export async function publicarCriativoNoMeta(campanhaId: string, criativoId: string, userId: string) {
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

  const metaAdsetId = (campanha as any).meta_adset_id;
  if (!metaAdsetId) {
    throw new Error('Campanha ainda não foi publicada na Meta. Publique a campanha primeiro.');
  }

  const criativo = await prisma.criativo.findUnique({ where: { id: criativoId } });
  if (!criativo || criativo.campanha_id !== campanhaId) {
    const err = new Error('NOT_FOUND');
    err.name = 'NOT_FOUND';
    throw err;
  }

  const integracao = await prisma.integracao.findUnique({
    where: { user_id_plataforma: { user_id: userId, plataforma: 'meta' } },
  });
  if (!integracao?.account_id) throw new Error('Conta Meta não configurada');

  const paginas = await listarPaginasMeta(userId);
  if (!paginas.length) throw new Error('Nenhuma página do Facebook encontrada. Conecte uma página para publicar anúncios.');

  const pageId = paginas[0].id;
  const imageHash = await uploadImagemMeta(userId, integracao.account_id, criativo.url_imagem);

  const metaCriativo = await criarCriativoMeta(userId, {
    name: `${campanha.nome} - Creative`,
    object_story_spec: {
      page_id: pageId,
      link_data: {
        image_hash: imageHash,
        link: 'https://www.facebook.com',
        message: campanha.descricao,
        call_to_action: { type: 'LEARN_MORE' },
      },
    },
  });

  const metaAd = await criarAnuncioMeta(userId, {
    name: `${campanha.nome} - Ad`,
    adset_id: metaAdsetId,
    creative: { creative_id: metaCriativo.id },
    status: 'PAUSED',
  });

  return prisma.criativo.update({
    where: { id: criativoId },
    data: { meta_ad_id: metaAd.id },
  });
}
