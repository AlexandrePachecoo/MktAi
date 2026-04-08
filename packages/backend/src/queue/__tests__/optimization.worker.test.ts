// TODO: Implementar quando o worker de otimização existir
// Arquivo: src/queue/optimization.worker.ts
// Dependências mockadas: @prisma/client, openai, bullmq

// Padrão de mock esperado:
// jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn(() => ({ campanha: { findMany: jest.fn() } })) }));
// jest.mock('openai', () => ({ OpenAI: jest.fn(() => ({ chat: { completions: { create: jest.fn() } } })) }));

describe('OptimizationWorker', () => {
  it.todo('should process a job and call Meta Ads API with optimized budget');
  it.todo('should skip campaign if status is not "ativa"');
  it.todo('should retry job on API failure');
  it.todo('should update campaign status on completion');
});
