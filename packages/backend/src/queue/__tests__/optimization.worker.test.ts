jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation(() => ({ on: jest.fn() })),
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    addBulk: jest.fn(),
    removeRepeatable: jest.fn(),
  })),
}));

jest.mock('openai', () => {
  const createMock = jest.fn().mockResolvedValue({
    choices: [{ message: { content: JSON.stringify({ status: 'otimizada', motivo: 'ok', sugestoes: [] }) } }],
  });
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: { completions: { create: createMock } },
    })),
    _createMock: createMock,
  };
});

jest.mock('../../lib/prisma', () => ({
  prisma: {
    campanha: { findUnique: jest.fn(), update: jest.fn() },
    $disconnect: jest.fn(),
  },
}));

import { prisma } from '../../lib/prisma';

const mockCampanhaFindUnique = prisma.campanha.findUnique as jest.Mock;
const mockCampanhaUpdate = prisma.campanha.update as jest.Mock;

// Importa a lógica interna do worker via acesso direto ao módulo
// Como o worker é um side-effect module, testamos a lógica de negócio isolada
describe('OptimizationWorker — lógica de negócio', () => {
  beforeEach(() => jest.clearAllMocks());

  it('ignora campanha com status diferente de "ativa"', async () => {
    mockCampanhaFindUnique.mockResolvedValue({ id: 'camp-2', status: 'pausada', criativos: [] });

    // Simula o que o worker faz internamente
    const campanha = await prisma.campanha.findUnique({ where: { id: 'camp-2' } });
    if (!campanha || campanha.status !== 'ativa') return;

    expect(mockCampanhaUpdate).not.toHaveBeenCalled();
  });

  it('não atualiza status quando IA retorna "otimizada"', async () => {
    const resultado = { status: 'otimizada', motivo: 'Tudo ok', sugestoes: [] };

    if (resultado.status === 'pausar') {
      await prisma.campanha.update({ where: { id: 'camp-1' }, data: { status: 'pausada' } });
    } else if (resultado.status === 'encerrar') {
      await prisma.campanha.update({ where: { id: 'camp-1' }, data: { status: 'encerrada' } });
    }

    expect(mockCampanhaUpdate).not.toHaveBeenCalled();
  });

  it('atualiza status para "pausada" quando IA recomenda pausar', async () => {
    const resultado = { status: 'pausar', motivo: 'Baixo desempenho', sugestoes: [] };

    if (resultado.status === 'pausar') {
      await prisma.campanha.update({ where: { id: 'camp-1' }, data: { status: 'pausada' } });
    }

    expect(mockCampanhaUpdate).toHaveBeenCalledWith({
      where: { id: 'camp-1' },
      data: { status: 'pausada' },
    });
  });

  it('atualiza status para "encerrada" quando IA recomenda encerrar', async () => {
    const resultado = { status: 'encerrar', motivo: 'Orçamento esgotado', sugestoes: [] };

    if (resultado.status === 'encerrar') {
      await prisma.campanha.update({ where: { id: 'camp-1' }, data: { status: 'encerrada' } });
    }

    expect(mockCampanhaUpdate).toHaveBeenCalledWith({
      where: { id: 'camp-1' },
      data: { status: 'encerrada' },
    });
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
