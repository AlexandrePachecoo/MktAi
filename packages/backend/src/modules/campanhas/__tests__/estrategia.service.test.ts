jest.mock('../../../lib/prisma', () => ({
  prisma: {
    campanha: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

const mockCreate = jest.fn();
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  })),
}));

import { gerarEstrategia } from '../estrategia.service';
import { prisma } from '../../../lib/prisma';

const mockCampanhaFind = prisma.campanha.findUnique as jest.Mock;
const mockCampanhaUpdate = prisma.campanha.update as jest.Mock;

const campanha = {
  id: 'camp-1',
  user_id: 'user-1',
  nome: 'Produto X',
  descricao: 'Software de gestão',
  objetivo: 'conversao',
  publico_alvo: 'Empreendedores 30-50',
  orcamento: 2000,
  plataforma: 'meta',
};

const estrategiaJson = {
  resumo: 'Estratégia focada em conversão',
  distribuicao: [{ plataforma: 'meta', percentual: 100, justificativa: 'Alta penetração' }],
  copies: [
    { titulo: 'Título 1', texto: 'Texto 1', formato: 'stories' },
    { titulo: 'Título 2', texto: 'Texto 2', formato: 'feed' },
    { titulo: 'Título 3', texto: 'Texto 3', formato: 'reels' },
    { titulo: 'Título 4', texto: 'Texto 4', formato: 'stories' },
    { titulo: 'Título 5', texto: 'Texto 5', formato: 'feed' },
  ],
};

beforeEach(() => jest.clearAllMocks());

describe('gerarEstrategia', () => {
  it('lança NOT_FOUND quando campanha não existe', async () => {
    mockCampanhaFind.mockResolvedValue(null);

    await expect(gerarEstrategia('inexistente', 'user-1')).rejects.toMatchObject({
      name: 'NOT_FOUND',
    });
  });

  it('lança FORBIDDEN quando campanha pertence a outro usuário', async () => {
    mockCampanhaFind.mockResolvedValue({ ...campanha, user_id: 'outro-user' });

    await expect(gerarEstrategia('camp-1', 'user-1')).rejects.toMatchObject({
      name: 'FORBIDDEN',
    });
  });

  it('chama OpenAI e retorna estratégia parseada', async () => {
    mockCampanhaFind.mockResolvedValue(campanha);
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(estrategiaJson) } }],
    });
    mockCampanhaUpdate.mockResolvedValue({ ...campanha, estrategia: estrategiaJson });

    const result = await gerarEstrategia('camp-1', 'user-1');

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
      })
    );
    expect(result.resumo).toBe('Estratégia focada em conversão');
    expect(result.copies).toHaveLength(5);
  });

  it('salva estratégia no banco após geração', async () => {
    mockCampanhaFind.mockResolvedValue(campanha);
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(estrategiaJson) } }],
    });
    mockCampanhaUpdate.mockResolvedValue({});

    await gerarEstrategia('camp-1', 'user-1');

    expect(mockCampanhaUpdate).toHaveBeenCalledWith({
      where: { id: 'camp-1' },
      data: { estrategia: estrategiaJson },
    });
  });

  it('inclui dados da campanha no prompt enviado para OpenAI', async () => {
    mockCampanhaFind.mockResolvedValue(campanha);
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(estrategiaJson) } }],
    });
    mockCampanhaUpdate.mockResolvedValue({});

    await gerarEstrategia('camp-1', 'user-1');

    const callArgs = mockCreate.mock.calls[0][0];
    const promptContent = callArgs.messages[0].content as string;
    expect(promptContent).toContain('Produto X');
    expect(promptContent).toContain('Software de gestão');
    expect(promptContent).toContain('Empreendedores 30-50');
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
