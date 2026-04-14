import { Queue } from 'bullmq';
import { getRedisConnection } from '../lib/redis';

const connection = getRedisConnection();

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
