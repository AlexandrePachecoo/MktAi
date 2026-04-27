jest.mock('../../../lib/prisma', () => ({
  prisma: {
    campanha: { findUnique: jest.fn() },
    $disconnect: jest.fn(),
  },
}));

jest.mock('../../integracoes/meta-ads.service', () => ({
  buscarInsightsMeta: jest.fn(),
}));

const mockChatCreate = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockChatCreate } },
  }));
});

import { gerarInsightsCampanha } from '../insights.service';
import { prisma } from '../../../lib/prisma';
import { buscarInsightsMeta } from '../../integracoes/meta-ads.service';

const mFindUnique = prisma.campanha.findUnique as jest.Mock;
const mInsightsMeta = buscarInsightsMeta as jest.Mock;

const campanha = {
  id: 'c-1',
  user_id: 'u-1',
  nome: 'Camp',
  descricao: 'Desc',
  objetivo: 'conversao',
  publico_alvo: '18-35',
  orcamento: 500,
  plataforma: 'meta',
  status: 'ativa',
  meta_campaign_id: 'meta-c1',
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.OPENAI_API_KEY = 'sk-test';
});

describe('gerarInsightsCampanha — controle de acesso', () => {
  it('lança NOT_FOUND quando campanha não existe', async () => {
    mFindUnique.mockResolvedValue(null);

    await expect(gerarInsightsCampanha('c-x', 'u-1')).rejects.toMatchObject({
      name: 'NOT_FOUND',
    });
  });

  it('lança FORBIDDEN quando campanha pertence a outro usuário', async () => {
    mFindUnique.mockResolvedValue({ ...campanha, user_id: 'outro' });

    await expect(gerarInsightsCampanha('c-1', 'u-1')).rejects.toMatchObject({
      name: 'FORBIDDEN',
    });
  });
});

describe('gerarInsightsCampanha — geração', () => {
  it('chama OpenAI com métricas reais quando meta_campaign_id existe', async () => {
    mFindUnique.mockResolvedValue(campanha);
    mInsightsMeta.mockResolvedValue([{ impressions: '1000', clicks: '50' }]);
    mockChatCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              resumo: 'OK',
              pontos_positivos: ['p1'],
              pontos_de_melhoria: [],
              sugestoes_acionaveis: [],
              score_desempenho: '8',
            }),
          },
        },
      ],
    });

    const result = await gerarInsightsCampanha('c-1', 'u-1');

    expect(mInsightsMeta).toHaveBeenCalledWith('u-1', expect.objectContaining({
      level: 'campaign',
      objectId: 'meta-c1',
    }));
    expect(mockChatCreate).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-4o-mini',
    }));
    expect(result.resumo).toBe('OK');
    expect(result.score_desempenho).toBe('8');
  });

  it('continua com mensagem de "sem métricas" quando campanha não foi publicada', async () => {
    mFindUnique.mockResolvedValue({ ...campanha, meta_campaign_id: null });
    mockChatCreate.mockResolvedValue({
      choices: [{ message: { content: '{"resumo":"sem metricas"}' } }],
    });

    const result = await gerarInsightsCampanha('c-1', 'u-1');

    expect(mInsightsMeta).not.toHaveBeenCalled();
    expect(result.resumo).toBe('sem metricas');
    const userPrompt = mockChatCreate.mock.calls[0][0].messages[1].content;
    expect(userPrompt).toContain('Sem métricas disponíveis');
  });

  it('continua mesmo se buscar insights da Meta falhar', async () => {
    mFindUnique.mockResolvedValue(campanha);
    mInsightsMeta.mockRejectedValue(new Error('boom'));
    mockChatCreate.mockResolvedValue({
      choices: [{ message: { content: '{"resumo":"x"}' } }],
    });

    const result = await gerarInsightsCampanha('c-1', 'u-1');

    expect(result.resumo).toBe('x');
  });

  it('retorna {} quando OpenAI não retorna content', async () => {
    mFindUnique.mockResolvedValue(campanha);
    mInsightsMeta.mockResolvedValue([]);
    mockChatCreate.mockResolvedValue({ choices: [{ message: { content: null } }] });

    const result = await gerarInsightsCampanha('c-1', 'u-1');
    expect(result).toEqual({});
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
