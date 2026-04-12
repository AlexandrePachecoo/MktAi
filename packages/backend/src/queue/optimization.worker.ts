import { Worker, Job } from 'bullmq';
import { prisma } from '../lib/prisma';
import OpenAI from 'openai';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
};

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function processarCampanha(campanhaId: string) {
  const campanha = await prisma.campanha.findUnique({
    where: { id: campanhaId },
    include: { criativos: true },
  });

  if (!campanha || campanha.status !== 'ativa') return;

  // Pede para a IA analisar a campanha e sugerir ajustes
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: `
Você é um especialista em otimização de campanhas de mídia paga.

Analise a campanha abaixo e sugira ajustes concisos:

- Nome: ${campanha.nome}
- Descrição: ${campanha.descricao}
- Objetivo: ${campanha.objetivo ?? 'não informado'}
- Público-alvo: ${campanha.publico_alvo}
- Orçamento: R$ ${campanha.orcamento}
- Plataforma: ${campanha.plataforma}
- Criativos ativos: ${campanha.criativos.length}

Responda apenas com JSON:
{
  "status": "otimizada" | "pausar" | "encerrar",
  "motivo": "explicação curta",
  "sugestoes": ["sugestão 1", "sugestão 2"]
}
        `.trim(),
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
  });

  const resultado = JSON.parse(response.choices[0].message.content!);

  // Se a IA recomendar pausar ou encerrar, atualiza o status
  if (resultado.status === 'pausar') {
    await prisma.campanha.update({
      where: { id: campanhaId },
      data: { status: 'pausada' },
    });
  } else if (resultado.status === 'encerrar') {
    await prisma.campanha.update({
      where: { id: campanhaId },
      data: { status: 'encerrada' },
    });
  }

  console.log(`[worker] Campanha ${campanhaId} processada:`, resultado);
}

export const optimizationWorker = new Worker(
  'optimization',
  async (job: Job) => {
    const { campanhaId } = job.data;
    await processarCampanha(campanhaId);
  },
  {
    connection,
    concurrency: 5, // processa até 5 campanhas em paralelo
  }
);

optimizationWorker.on('completed', (job) => {
  console.log(`[worker] Job ${job.id} concluído`);
});

optimizationWorker.on('failed', (job, err) => {
  console.error(`[worker] Job ${job?.id} falhou:`, err.message);
});
