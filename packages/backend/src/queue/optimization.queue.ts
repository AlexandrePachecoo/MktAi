import { Queue } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
};

// Fila responsável por otimizar campanhas ativas
export const optimizationQueue = new Queue('optimization', { connection });

// Enfileira jobs para todas as campanhas de um usuário
export async function enqueueOptimizationJobs(campanhaIds: string[]) {
  const jobs = campanhaIds.map((id) => ({
    name: 'optimize-campaign',
    data: { campanhaId: id },
  }));

  await optimizationQueue.addBulk(jobs);
}
