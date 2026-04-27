jest.mock('axios');
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    campanha: { findUnique: jest.fn() },
    integracao: { findMany: jest.fn() },
    $disconnect: jest.fn(),
  },
}));
jest.mock('../../integracoes/integracoes.service', () => ({
  getValidToken: jest.fn(),
}));

import axios from 'axios';
import { buscarDashboard } from '../dashboard.service';
import { prisma } from '../../../lib/prisma';
import { getValidToken } from '../../integracoes/integracoes.service';

const mockGet = axios.get as jest.Mock;
const mFindUnique = prisma.campanha.findUnique as jest.Mock;
const mFindMany = prisma.integracao.findMany as jest.Mock;
const mGetToken = getValidToken as jest.Mock;

const campanhaMeta = {
  id: 'camp-1',
  user_id: 'user-1',
  nome: 'C',
  status: 'ativa',
  plataforma: 'meta',
  meta_campaign_id: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  mGetToken.mockResolvedValue('tok');
});

describe('buscarDashboard — controle de acesso', () => {
  it('lança NOT_FOUND quando campanha não existe', async () => {
    mFindUnique.mockResolvedValue(null);

    await expect(buscarDashboard('camp-x', 'user-1')).rejects.toMatchObject({
      name: 'NOT_FOUND',
    });
  });

  it('lança FORBIDDEN quando campanha pertence a outro usuário', async () => {
    mFindUnique.mockResolvedValue({ ...campanhaMeta, user_id: 'outro' });

    await expect(buscarDashboard('camp-1', 'user-1')).rejects.toMatchObject({
      name: 'FORBIDDEN',
    });
  });
});

describe('buscarDashboard — Meta', () => {
  it('retorna erro estruturado quando integração Meta não existe', async () => {
    mFindUnique.mockResolvedValue(campanhaMeta);
    mFindMany.mockResolvedValue([]);

    const out = await buscarDashboard('camp-1', 'user-1');
    expect(out.meta).toEqual({ erro: 'Integração com Meta não encontrada' });
  });

  it('retorna erro quando integração Meta não tem account_id', async () => {
    mFindUnique.mockResolvedValue(campanhaMeta);
    mFindMany.mockResolvedValue([{ plataforma: 'meta', account_id: null }]);

    const out = await buscarDashboard('camp-1', 'user-1');
    expect(out.meta).toEqual({ erro: 'Conta de anúncios do Meta não configurada' });
  });

  it('retorna métricas do Meta quando integração está ok', async () => {
    mFindUnique.mockResolvedValue(campanhaMeta);
    mFindMany.mockResolvedValue([{ plataforma: 'meta', account_id: 'act_1' }]);
    mockGet.mockResolvedValue({
      data: {
        data: [
          { impressions: '1000', clicks: '50', spend: '100', reach: '900', ctr: '5', cpc: '2' },
        ],
      },
    });

    const out = await buscarDashboard('camp-1', 'user-1');
    expect(out.meta).toEqual({
      plataforma: 'meta',
      impressoes: 1000,
      cliques: 50,
      gasto: 100,
      alcance: 900,
      ctr: 5,
      cpc: 2,
    });
  });

  it('usa meta_campaign_id quando disponível para insights mais precisos', async () => {
    mFindUnique.mockResolvedValue({ ...campanhaMeta, meta_campaign_id: 'meta-camp-9' });
    mFindMany.mockResolvedValue([{ plataforma: 'meta', account_id: 'act_1' }]);
    mockGet.mockResolvedValue({ data: { data: [{}] } });

    await buscarDashboard('camp-1', 'user-1');

    expect(mockGet).toHaveBeenCalledWith(
      'https://graph.facebook.com/v19.0/meta-camp-9/insights',
      expect.any(Object),
    );
  });

  it('retorna erro estruturado quando API do Meta falha', async () => {
    mFindUnique.mockResolvedValue(campanhaMeta);
    mFindMany.mockResolvedValue([{ plataforma: 'meta', account_id: 'act_1' }]);
    mockGet.mockRejectedValue(new Error('API error'));

    const out = await buscarDashboard('camp-1', 'user-1');
    expect(out.meta).toEqual({ erro: 'Erro ao buscar métricas do Meta' });
  });
});

describe('buscarDashboard — Google', () => {
  it('retorna erro quando integração Google não existe', async () => {
    mFindUnique.mockResolvedValue({ ...campanhaMeta, plataforma: 'google' });
    mFindMany.mockResolvedValue([]);

    const out = await buscarDashboard('camp-1', 'user-1');
    expect(out.google).toEqual({ erro: 'Integração com Google não encontrada' });
  });
});

describe('buscarDashboard — ambos', () => {
  it('busca métricas em meta e google quando plataforma é ambos', async () => {
    mFindUnique.mockResolvedValue({ ...campanhaMeta, plataforma: 'ambos' });
    mFindMany.mockResolvedValue([
      { plataforma: 'meta', account_id: 'act_1' },
      { plataforma: 'google', account_id: '999' },
    ]);
    mockGet.mockResolvedValue({ data: { data: [{}], results: [{ metrics: {} }] } });

    const out = await buscarDashboard('camp-1', 'user-1');

    expect(out.meta).toBeDefined();
    expect(out.google).toBeDefined();
  });

  it('retorna metadata da campanha (id, nome, plataforma)', async () => {
    mFindUnique.mockResolvedValue({ ...campanhaMeta, nome: 'Verão' });
    mFindMany.mockResolvedValue([]);

    const out = await buscarDashboard('camp-1', 'user-1');

    expect(out.campanha_id).toBe('camp-1');
    expect(out.nome).toBe('Verão');
    expect(out.plataforma).toBe('meta');
    expect(out.status).toBe('ativa');
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
