jest.mock('axios');
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    integracao: {
      findUnique: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));
jest.mock('../integracoes.service', () => ({
  getValidToken: jest.fn(),
}));

import axios from 'axios';
import {
  buscarPerfilMeta,
  listarPaginasMeta,
  listarCampanhasMeta,
  criarCampanhaMeta,
  atualizarCampanhaMeta,
  deletarCampanhaMeta,
  listarAdSetsMeta,
  criarAdSetMeta,
  listarCriativosMeta,
  criarAnuncioMeta,
  buscarInsightsMeta,
  listarFormulariosLeadsMeta,
} from '../meta-ads.service';
import { getValidToken } from '../integracoes.service';
import { prisma } from '../../../lib/prisma';

const mockGet = axios.get as jest.Mock;
const mockPost = axios.post as jest.Mock;
const mockDelete = axios.delete as jest.Mock;
const mockGetValidToken = getValidToken as jest.Mock;
const mockFindUnique = prisma.integracao.findUnique as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetValidToken.mockResolvedValue('access-token');
  mockFindUnique.mockResolvedValue({ account_id: 'act_123' });
});

describe('buscarPerfilMeta', () => {
  it('faz GET em /me com fields padrão', async () => {
    mockGet.mockResolvedValue({ data: { id: '1', name: 'Foo' } });

    const profile = await buscarPerfilMeta('user-1');

    expect(profile).toEqual({ id: '1', name: 'Foo' });
    expect(mockGet).toHaveBeenCalledWith(
      'https://graph.facebook.com/v19.0/me',
      expect.objectContaining({
        params: expect.objectContaining({
          fields: 'id,name,email',
          access_token: 'access-token',
        }),
      }),
    );
  });
});

describe('listarPaginasMeta', () => {
  it('retorna lista de páginas', async () => {
    mockGet.mockResolvedValue({ data: { data: [{ id: 'p1', name: 'Página' }] } });

    const paginas = await listarPaginasMeta('user-1');
    expect(paginas).toEqual([{ id: 'p1', name: 'Página' }]);
  });

  it('retorna array vazio quando data ausente', async () => {
    mockGet.mockResolvedValue({ data: {} });
    expect(await listarPaginasMeta('user-1')).toEqual([]);
  });
});

describe('listarCampanhasMeta', () => {
  it('lista campanhas usando o accountId formatado com prefixo act_', async () => {
    mockFindUnique.mockResolvedValue({ account_id: '123' });
    mockGet.mockResolvedValue({ data: { data: [{ id: 'c1' }] } });

    const result = await listarCampanhasMeta('user-1');

    expect(result).toEqual([{ id: 'c1' }]);
    expect(mockGet).toHaveBeenCalledWith(
      'https://graph.facebook.com/v19.0/act_123/campaigns',
      expect.any(Object),
    );
  });

  it('lança erro se conta meta não selecionada', async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(listarCampanhasMeta('user-1')).rejects.toThrow('Conta Meta não selecionada');
  });
});

describe('criarCampanhaMeta', () => {
  it('faz POST com defaults de status PAUSED e special_ad_categories vazio', async () => {
    mockPost.mockResolvedValue({ data: { id: 'novo' } });

    const out = await criarCampanhaMeta('user-1', {
      name: 'Campanha',
      objective: 'OUTCOME_TRAFFIC',
    });

    expect(out).toEqual({ id: 'novo' });
    expect(mockPost).toHaveBeenCalledWith(
      'https://graph.facebook.com/v19.0/act_123/campaigns',
      expect.objectContaining({
        name: 'Campanha',
        objective: 'OUTCOME_TRAFFIC',
        status: 'PAUSED',
        special_ad_categories: [],
        is_adset_budget_sharing_enabled: false,
      }),
    );
  });

  it('repassa erro do Meta como Error com mensagem', async () => {
    const axiosError = Object.assign(new Error('boom'), {
      isAxiosError: true,
      response: { status: 400, data: { error: { message: 'Invalid objective' } } },
    });
    (axios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(true);
    mockPost.mockRejectedValue(axiosError);

    await expect(
      criarCampanhaMeta('user-1', { name: 'X', objective: 'OUTCOME_TRAFFIC' }),
    ).rejects.toThrow('Invalid objective');
  });
});

describe('atualizarCampanhaMeta', () => {
  it('faz POST no endpoint da campanha', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });

    await atualizarCampanhaMeta('user-1', 'camp-x', { status: 'ACTIVE' });

    expect(mockPost).toHaveBeenCalledWith(
      'https://graph.facebook.com/v19.0/camp-x',
      expect.objectContaining({ status: 'ACTIVE', access_token: 'access-token' }),
    );
  });
});

describe('deletarCampanhaMeta', () => {
  it('faz DELETE no endpoint da campanha', async () => {
    mockDelete.mockResolvedValue({ data: { success: true } });

    await deletarCampanhaMeta('user-1', 'camp-x');

    expect(mockDelete).toHaveBeenCalledWith(
      'https://graph.facebook.com/v19.0/camp-x',
      expect.objectContaining({
        params: { access_token: 'access-token' },
      }),
    );
  });
});

describe('listarAdSetsMeta', () => {
  it('usa endpoint da campanha quando campaignId é informado', async () => {
    mockGet.mockResolvedValue({ data: { data: [] } });

    await listarAdSetsMeta('user-1', 'camp-1');

    expect(mockGet).toHaveBeenCalledWith(
      'https://graph.facebook.com/v19.0/camp-1/adsets',
      expect.any(Object),
    );
  });

  it('usa endpoint da conta quando campaignId é omitido', async () => {
    mockGet.mockResolvedValue({ data: { data: [] } });

    await listarAdSetsMeta('user-1');

    expect(mockGet).toHaveBeenCalledWith(
      'https://graph.facebook.com/v19.0/act_123/adsets',
      expect.any(Object),
    );
  });
});

describe('criarAdSetMeta', () => {
  it('faz POST com payload e status default PAUSED', async () => {
    mockPost.mockResolvedValue({ data: { id: 'as-1' } });

    const out = await criarAdSetMeta('user-1', {
      name: 'AS',
      campaign_id: 'c-1',
      daily_budget: 1000,
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'REACH',
      targeting: {},
    });

    expect(out).toEqual({ id: 'as-1' });
    expect(mockPost).toHaveBeenCalledWith(
      'https://graph.facebook.com/v19.0/act_123/adsets',
      expect.objectContaining({ status: 'PAUSED' }),
    );
  });
});

describe('listarCriativosMeta', () => {
  it('lista criativos da conta', async () => {
    mockGet.mockResolvedValue({ data: { data: [{ id: 'cr-1' }] } });
    expect(await listarCriativosMeta('user-1')).toEqual([{ id: 'cr-1' }]);
  });
});

describe('criarAnuncioMeta', () => {
  it('faz POST do anúncio com creative_id', async () => {
    mockPost.mockResolvedValue({ data: { id: 'ad-1' } });

    const out = await criarAnuncioMeta('user-1', {
      name: 'Ad',
      adset_id: 'as-1',
      creative: { creative_id: 'cr-1' },
    });

    expect(out).toEqual({ id: 'ad-1' });
    expect(mockPost).toHaveBeenCalledWith(
      'https://graph.facebook.com/v19.0/act_123/ads',
      expect.objectContaining({ status: 'PAUSED' }),
    );
  });
});

describe('buscarInsightsMeta', () => {
  it('usa accountId quando objectId não é passado', async () => {
    mockGet.mockResolvedValue({ data: { data: [{ impressions: '100' }] } });

    const out = await buscarInsightsMeta('user-1');

    expect(out).toEqual([{ impressions: '100' }]);
    expect(mockGet).toHaveBeenCalledWith(
      'https://graph.facebook.com/v19.0/act_123/insights',
      expect.any(Object),
    );
  });

  it('usa objectId fornecido ao invés do accountId', async () => {
    mockGet.mockResolvedValue({ data: { data: [] } });

    await buscarInsightsMeta('user-1', { objectId: 'camp-99', level: 'campaign' });

    expect(mockGet).toHaveBeenCalledWith(
      'https://graph.facebook.com/v19.0/camp-99/insights',
      expect.any(Object),
    );
  });

  it('usa time_range em vez de date_preset quando informado', async () => {
    mockGet.mockResolvedValue({ data: { data: [] } });

    await buscarInsightsMeta('user-1', {
      time_range: { since: '2024-01-01', until: '2024-01-31' },
    });

    const params = mockGet.mock.calls[0][1].params;
    expect(params.time_range).toBe(JSON.stringify({ since: '2024-01-01', until: '2024-01-31' }));
    expect(params.date_preset).toBeUndefined();
  });
});

describe('listarFormulariosLeadsMeta', () => {
  it('lista formulários de leads de uma página', async () => {
    mockGet.mockResolvedValue({ data: { data: [{ id: 'f1' }] } });

    const forms = await listarFormulariosLeadsMeta('user-1', 'page-1');

    expect(forms).toEqual([{ id: 'f1' }]);
    expect(mockGet).toHaveBeenCalledWith(
      'https://graph.facebook.com/v19.0/page-1/leadgen_forms',
      expect.any(Object),
    );
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
