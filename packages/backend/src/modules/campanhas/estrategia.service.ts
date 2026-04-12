import OpenAI from 'openai';
import { prisma } from '../../lib/prisma';

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface Estrategia {
  resumo: string;
  distribuicao: {
    plataforma: string;
    percentual: number;
    justificativa: string;
  }[];
  copies: {
    titulo: string;
    texto: string;
    formato: string;
  }[];
}

export async function gerarEstrategia(campanhaId: string, userId: string): Promise<Estrategia> {
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

  const prompt = `
Você é um especialista em marketing digital e mídia paga.

Com base nos dados da campanha abaixo, gere uma estratégia completa.

REGRAS OBRIGATÓRIAS:
- Use APENAS as plataformas informadas no campo "Plataforma" (Meta e/ou Google). Nunca inclua LinkedIn, TikTok, Twitter, Pinterest ou qualquer outra plataforma não informada.
- NÃO invente ofertas, promoções, descontos, períodos gratuitos ou qualquer benefício que não foi descrito nos dados da campanha.
- Baseie o resumo e os copies SOMENTE nas informações fornecidas abaixo. Não adicione informações fictícias.

Dados da campanha:
- Nome: ${campanha.nome}
- Descrição: ${campanha.descricao}
- Objetivo: ${campanha.objetivo || 'não informado'}
- Público-alvo: ${campanha.publico_alvo}
- Orçamento: R$ ${campanha.orcamento}
- Plataforma: ${campanha.plataforma}

Responda APENAS com um JSON válido, sem texto adicional, no seguinte formato:
{
  "resumo": "resumo da estratégia em 2-3 parágrafos",
  "distribuicao": [
    {
      "plataforma": "nome da plataforma (somente meta ou google)",
      "percentual": número entre 0 e 100,
      "justificativa": "por que essa distribuição"
    }
  ],
  "copies": [
    {
      "titulo": "título do anúncio",
      "texto": "texto do anúncio"
    }
  ]
}

Gere exatamente 5 opções de copies variadas para diferentes formatos e abordagens.
`.trim();

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const estrategia = JSON.parse(response.choices[0].message.content!) as Estrategia;

  await prisma.campanha.update({
    where: { id: campanhaId },
    data: { estrategia: estrategia as any },
  });

  return estrategia;
}
