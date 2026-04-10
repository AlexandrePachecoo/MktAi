import { optimizationQueue } from './optimization.queue';
import { prisma } from '../lib/prisma';

export async function iniciarScheduler() {
  // Remove job recorrente anterior para evitar duplicatas ao reiniciar o servidor
  await optimizationQueue.removeRepeatable('optimize-all', {
    every: 60 * 60 * 1000, // 1 hora em ms
  });

  // Registra job recorrente que dispara a cada 1h
  await optimizationQueue.add(
    'optimize-all',
    {},
    {
      repeat: { every: 60 * 60 * 1000 },
      jobId: 'optimize-all-recurring',
    }
  );

  console.log('[scheduler] Otimização agendada a cada 1h');
}

// Essa função é chamada pelo worker quando o job "optimize-all" é processado
export async function enfileirarCampanhasAtivas() {
  const campanhas = await prisma.campanha.findMany({
    where: { status: 'ativa' },
    select: { id: true },
  });

  if (campanhas.length === 0) return;

  const jobs = campanhas.map((c) => ({
    name: 'optimize-campaign',
    data: { campanhaId: c.id },
  }));

  await optimizationQueue.addBulk(jobs);
  console.log(`[scheduler] ${campanhas.length} campanhas enfileiradas para otimização`);
}
