jest.mock('axios');
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    campanha: { findUnique: jest.fn(), update: jest.fn() },
    criativo: { findUnique: jest.fn(), update: jest.fn() },
    integracao: { findUnique: jest.fn() },
    $disconnect: jest.fn(),
  },
}));
jest.mock('../../integracoes/meta-ads.service', () => ({
  criarCampanhaMeta: jest.fn(),
  criarAdSetMeta: jest.fn(),
  criarCriativoMeta: jest.fn(),
  criarAnuncioMeta: jest.fn(),
  listarPaginasMeta: jest.fn(),
}));
jest.mock('../../integracoes/integracoes.service', () => ({
  getValidToken: jest.fn(),
}));

import axios from 'axios';
import { publicarCampanhaNoMeta, publicarCriativoNoMeta } from '../publicar-meta.service';
import { prisma } from '../../../lib/prisma';
import {
  criarCampanhaMeta,
  criarAdSetMeta,
  criarCriativoMeta,
  criarAnuncioMeta,
  listarPaginasMeta,
} from '../../integracoes/meta-ads.service';
import { getValidToken } from '../../integracoes/integracoes.service';

const mFindCamp = prisma.campanha.findUnique as jest.Mock;
const mUpdateCamp = prisma.campanha.update as jest.Mock;
const mFindCri = prisma.criativo.findUnique as jest.Mock;
const mUpdateCri = prisma.criativo.update as jest.Mock;
const mFindInteg = prisma.integracao.findUnique as jest.Mock;
const mCriarCampanha = criarCampanhaMeta as jest.Mock;
const mCriarAdSet = criarAdSetMeta as jest.Mock;
const mCriarCriativo = criarCriativoMeta as jest.Mock;
const mCriarAnuncio = criarAnuncioMeta as jest.Mock;
const mListarPaginas = listarPaginasMeta as jest.Mock;
const mGetToken = getValidToken as jest.Mock;
const mockPost = axios.post as jest.Mock;

const campanha = {
  id: 'camp-1',
  user_id: 'user-1',
  nome: 'Promo',
  descricao: 'Descrição',
  objetivo: 'vendas',
  orcamento: 50,
  meta_campaign_id: null,
  meta_adset_id: null,
};

const criativo = {
  id: 'cri-1',
  campanha_id: 'camp-1',
  url_imagem: 'https://img.example.com/foo.png',
  meta_ad_id: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  mGetToken.mockResolvedValue('token');
});

describe('publicarCampanhaNoMeta', () => {
  it('lança NOT_FOUND se campanha não existe', async () => {
    mFindCamp.mockResolvedValue(null);

    await expect(publicarCampanhaNoMeta('camp-1', 'user-1')).rejects.toMatchObject({
      name: 'NOT_FOUND',
    });
  });

  it('lança FORBIDDEN se campanha pertence a outro usuário', async () => {
    mFindCamp.mockResolvedValue({ ...campanha, user_id: 'outro' });

    await expect(publicarCampanhaNoMeta('camp-1', 'user-1')).rejects.toMatchObject({
      name: 'FORBIDDEN',
    });
  });

  it('retorna campanha sem republicar quando já tem meta_campaign_id e meta_adset_id', async () => {
    mFindCamp.mockResolvedValue({
      ...campanha,
      meta_campaign_id: 'mc',
      meta_adset_id: 'ma',
    });

    const result = await publicarCampanhaNoMeta('camp-1', 'user-1');

    expect(result).toMatchObject({ meta_campaign_id: 'mc', meta_adset_id: 'ma' });
    expect(mCriarCampanha).not.toHaveBeenCalled();
    expect(mCriarAdSet).not.toHaveBeenCalled();
  });

  it('cria campanha e ad set na Meta e persiste IDs', async () => {
    mFindCamp.mockResolvedValue(campanha);
    mCriarCampanha.mockResolvedValue({ id: 'meta-c1' });
    mUpdateCamp.mockImplementation(({ data }) => Promise.resolve({ ...campanha, ...data }));
    mCriarAdSet.mockResolvedValue({ id: 'meta-as1' });

    await publicarCampanhaNoMeta('camp-1', 'user-1');

    expect(mCriarCampanha).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        name: 'Promo',
        objective: 'OUTCOME_SALES',
        status: 'PAUSED',
      }),
    );
    expect(mUpdateCamp).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'camp-1' },
        data: { meta_campaign_id: 'meta-c1' },
      }),
    );
    expect(mCriarAdSet).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        campaign_id: 'meta-c1',
        daily_budget: 5000,
        billing_event: 'IMPRESSIONS',
        optimization_goal: 'LINK_CLICKS',
        destination_type: 'WEBSITE',
      }),
    );
    expect(mUpdateCamp).toHaveBeenCalledWith(
      expect.objectContaining({ data: { meta_adset_id: 'meta-as1' } }),
    );
  });

  it('reaproveita meta_campaign_id existente sem recriar campanha', async () => {
    mFindCamp.mockResolvedValue({ ...campanha, meta_campaign_id: 'existente' });
    mCriarAdSet.mockResolvedValue({ id: 'meta-as1' });
    mUpdateCamp.mockResolvedValue({});

    await publicarCampanhaNoMeta('camp-1', 'user-1');

    expect(mCriarCampanha).not.toHaveBeenCalled();
    expect(mCriarAdSet).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ campaign_id: 'existente' }),
    );
  });

  it('mapeia objetivo desconhecido para OUTCOME_TRAFFIC', async () => {
    mFindCamp.mockResolvedValue({ ...campanha, objetivo: 'desconhecido' });
    mCriarCampanha.mockResolvedValue({ id: 'mc' });
    mUpdateCamp.mockResolvedValue({});
    mCriarAdSet.mockResolvedValue({ id: 'ma' });

    await publicarCampanhaNoMeta('camp-1', 'user-1');

    expect(mCriarCampanha).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ objective: 'OUTCOME_TRAFFIC' }),
    );
  });
});

describe('publicarCriativoNoMeta', () => {
  beforeEach(() => {
    mFindCamp.mockResolvedValue({ ...campanha, meta_adset_id: 'meta-as1' });
    mFindCri.mockResolvedValue(criativo);
    mFindInteg.mockResolvedValue({ account_id: 'act_1' });
    mListarPaginas.mockResolvedValue([{ id: 'page-1' }]);
    mockPost.mockResolvedValue({ data: { images: { foo: { hash: 'IMGHASH' } } } });
    mCriarCriativo.mockResolvedValue({ id: 'meta-cr1' });
    mCriarAnuncio.mockResolvedValue({ id: 'meta-ad1' });
    mUpdateCri.mockResolvedValue({});
  });

  it('lança erro quando campanha ainda não foi publicada', async () => {
    mFindCamp.mockResolvedValue({ ...campanha, meta_adset_id: null });

    await expect(publicarCriativoNoMeta('camp-1', 'cri-1', 'user-1')).rejects.toThrow(
      'Publique a campanha primeiro',
    );
  });

  it('lança NOT_FOUND quando criativo não existe', async () => {
    mFindCri.mockResolvedValue(null);

    await expect(publicarCriativoNoMeta('camp-1', 'cri-1', 'user-1')).rejects.toMatchObject({
      name: 'NOT_FOUND',
    });
  });

  it('lança NOT_FOUND quando criativo pertence a outra campanha', async () => {
    mFindCri.mockResolvedValue({ ...criativo, campanha_id: 'outra' });

    await expect(publicarCriativoNoMeta('camp-1', 'cri-1', 'user-1')).rejects.toMatchObject({
      name: 'NOT_FOUND',
    });
  });

  it('retorna criativo sem republicar quando já tem meta_ad_id', async () => {
    mFindCri.mockResolvedValue({ ...criativo, meta_ad_id: 'existente' });

    const out = await publicarCriativoNoMeta('camp-1', 'cri-1', 'user-1');

    expect(out).toMatchObject({ meta_ad_id: 'existente' });
    expect(mCriarCriativo).not.toHaveBeenCalled();
  });

  it('lança erro quando conta Meta não está configurada', async () => {
    mFindInteg.mockResolvedValue(null);

    await expect(publicarCriativoNoMeta('camp-1', 'cri-1', 'user-1')).rejects.toThrow(
      'Conta Meta não configurada',
    );
  });

  it('lança erro quando não há páginas conectadas', async () => {
    mListarPaginas.mockResolvedValue([]);

    await expect(publicarCriativoNoMeta('camp-1', 'cri-1', 'user-1')).rejects.toThrow(
      'Nenhuma página do Facebook',
    );
  });

  it('faz upload da imagem, cria criativo e anúncio na Meta', async () => {
    await publicarCriativoNoMeta('camp-1', 'cri-1', 'user-1');

    expect(mCriarCriativo).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        object_story_spec: expect.objectContaining({
          page_id: 'page-1',
          link_data: expect.objectContaining({ image_hash: 'IMGHASH' }),
        }),
      }),
    );
    expect(mCriarAnuncio).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        adset_id: 'meta-as1',
        creative: { creative_id: 'meta-cr1' },
        status: 'PAUSED',
      }),
    );
    expect(mUpdateCri).toHaveBeenCalledWith({
      where: { id: 'cri-1' },
      data: { meta_ad_id: 'meta-ad1' },
    });
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
