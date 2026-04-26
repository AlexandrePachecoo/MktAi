import OpenAI from 'openai';
import { prisma } from '../../lib/prisma';
import { buscarInsightsMeta } from '../integracoes/meta-ads.service';

export async function gerarInsightsCampanha(campanhaId: string, userId: string) {
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

  // Buscar métricas reais da Meta
  let metricsText = 'Sem métricas disponíveis (campanha não publicada na Meta)';
  try {
    const metaCampanhaId = (campanha as any).meta_campaign_id;
    if (metaCampanhaId) {
      const metricasMeta = await buscarInsightsMeta(userId, {
        level: 'campaign',
        objectId: metaCampanhaId,
        date_preset: 'last_30d',
        fields: ['impressions', 'clicks', 'spend', 'cpm', 'cpc', 'ctr', 'reach', 'frequency'],
      });

      if (metricasMeta.length) {
        metricsText = JSON.stringify(metricasMeta[0], null, 2);
      }
    }
  } catch (err) {
    // sem métricas disponíveis
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Você é um especialista em marketing digital e análise de campanhas de anúncios. Analise os dados fornecidos e gere insights acionáveis em português, mantendo tom profissional e direto.',
      },
      {
        role: 'user',
        content: `
CAMPANHA: ${campanha.nome}
Descrição: ${campanha.descricao}
Objetivo: ${campanha.objetivo ?? 'não definido'}
Público-alvo: ${campanha.publico_alvo}
Orçamento: R$ ${campanha.orcamento}
Plataforma: ${campanha.plataforma}
Status: ${campanha.status}

MÉTRICAS DOS ÚLTIMOS 30 DIAS:
${metricsText}

Gere um JSON (válido) com:
{
  "resumo": "análise geral em 2-3 parágrafos",
  "pontos_positivos": ["insight 1", "insight 2"],
  "pontos_de_melhoria": ["melhoria 1", "melhoria 2"],
  "sugestoes_acionaveis": ["sugestão 1", "sugestão 2", "sugestão 3"],
  "score_desempenho": "0-10"
}

Responda APENAS com o JSON, sem markdown ou explicações extras.
        `.trim(),
      },
    ],
  });

  const content = completion.choices[0].message.content ?? '{}';
  return JSON.parse(content);
}
