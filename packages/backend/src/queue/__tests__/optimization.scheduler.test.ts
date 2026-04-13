jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation(() => ({ on: jest.fn() })),
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({}),
    addBulk: jest.fn().mockResolvedValue([]),
    removeRepeatable: jest.fn().mockResolvedValue(true),
  })),
}));

jest.mock('../../lib/prisma', () => ({
  prisma: {
    campanha: { findMany: jest.fn() },
    $disconnect: jest.fn(),
  },
}));

import { enfileirarCampanhasAtivas } from '../optimization.scheduler';
import { prisma } from '../../lib/prisma';
import { Queue } from 'bullmq';

const mockFindMany = prisma.campanha.findMany as jest.Mock;
const MockQueue = Queue as jest.MockedClass<typeof Queue>;

beforeEach(() => jest.clearAllMocks());

describe('enfileirarCampanhasAtivas', () => {
  it('retorna sem adicionar jobs quando não há campanhas ativas', async () => {
    mockFindMany.mockResolvedValue([]);

    await enfileirarCampanhasAtivas();

    // addBulk não deve ter sido chamado
    const queueInstance = MockQueue.mock.results[0]?.value;
    if (queueInstance) {
      expect(queueInstance.addBulk).not.toHaveBeenCalled();
    }
  });

  it('enfileira um job por campanha ativa', async () => {
    const campanhas = [{ id: 'camp-1' }, { id: 'camp-2' }, { id: 'camp-3' }];
    mockFindMany.mockResolvedValue(campanhas);

    await enfileirarCampanhasAtivas();

    const queueInstance = MockQueue.mock.results[0]?.value;
    if (queueInstance) {
      expect(queueInstance.addBulk).toHaveBeenCalledWith([
        { name: 'optimize-campaign', data: { campanhaId: 'camp-1' } },
        { name: 'optimize-campaign', data: { campanhaId: 'camp-2' } },
        { name: 'optimize-campaign', data: { campanhaId: 'camp-3' } },
      ]);
    }
  });

  it('busca somente campanhas com status "ativa"', async () => {
    mockFindMany.mockResolvedValue([]);

    await enfileirarCampanhasAtivas();

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { status: 'ativa' },
      select: { id: true },
    });
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
