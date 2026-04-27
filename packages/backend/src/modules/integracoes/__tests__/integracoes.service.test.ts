jest.mock('axios');
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    integracao: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

import axios from 'axios';
import {
  getMetaAuthUrl,
  getGoogleAuthUrl,
  listarIntegracoes,
  desconectarIntegracao,
  salvarAccountId,
  handleMetaCallback,
  handleGoogleCallback,
  getValidToken,
  buscarContasMeta,
} from '../integracoes.service';
import { prisma } from '../../../lib/prisma';

const mockGet = axios.get as jest.Mock;
const mockPost = axios.post as jest.Mock;
const mFindUnique = prisma.integracao.findUnique as jest.Mock;
const mFindMany = prisma.integracao.findMany as jest.Mock;
const mUpdate = prisma.integracao.update as jest.Mock;
const mUpsert = prisma.integracao.upsert as jest.Mock;
const mDelete = prisma.integracao.deleteMany as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.META_APP_ID = 'meta-app-id';
  process.env.META_APP_SECRET = 'meta-secret';
  process.env.META_REDIRECT_URI = 'http://localhost/meta/cb';
  process.env.GOOGLE_CLIENT_ID = 'gcid';
  process.env.GOOGLE_CLIENT_SECRET = 'gcsec';
  process.env.GOOGLE_REDIRECT_URI = 'http://localhost/google/cb';
});

describe('getMetaAuthUrl', () => {
  it('gera URL de OAuth do Facebook com client_id e state', () => {
    const url = getMetaAuthUrl('meu-token');
    expect(url).toContain('facebook.com');
    expect(url).toContain('client_id=meta-app-id');
    expect(url).toContain('state=meu-token');
    expect(url).toContain('response_type=code');
  });
});

describe('getGoogleAuthUrl', () => {
  it('gera URL de OAuth do Google com prompt consent e access_type offline', () => {
    const url = getGoogleAuthUrl('tk');
    expect(url).toContain('accounts.google.com');
    expect(url).toContain('client_id=gcid');
    expect(url).toContain('access_type=offline');
    expect(url).toContain('prompt=consent');
    expect(url).toContain('state=tk');
  });
});

describe('listarIntegracoes', () => {
  it('retorna meta e google sempre, marcando conectado conforme registros', async () => {
    mFindMany.mockResolvedValue([
      { plataforma: 'meta', account_id: 'act_1', expires_at: null },
    ]);

    const lista = await listarIntegracoes('user-1');

    expect(lista).toHaveLength(2);
    const meta = lista.find((l) => l.plataforma === 'meta')!;
    const google = lista.find((l) => l.plataforma === 'google')!;
    expect(meta.conectado).toBe(true);
    expect(meta.account_id).toBe('act_1');
    expect(google.conectado).toBe(false);
    expect(google.account_id).toBeNull();
  });
});

describe('desconectarIntegracao', () => {
  it('remove a integração do usuário na plataforma', async () => {
    mDelete.mockResolvedValue({ count: 1 });

    await desconectarIntegracao('user-1', 'meta');

    expect(mDelete).toHaveBeenCalledWith({
      where: { user_id: 'user-1', plataforma: 'meta' },
    });
  });
});

describe('salvarAccountId', () => {
  it('atualiza o account_id da integração existente', async () => {
    mUpdate.mockResolvedValue({});

    await salvarAccountId('user-1', 'meta', 'act_99');

    expect(mUpdate).toHaveBeenCalledWith({
      where: { user_id_plataforma: { user_id: 'user-1', plataforma: 'meta' } },
      data: { account_id: 'act_99' },
    });
  });
});

describe('handleMetaCallback', () => {
  it('faz upsert do token recebido do Meta', async () => {
    mockGet.mockResolvedValue({
      data: { access_token: 'tok-meta', expires_in: 3600 },
    });
    mUpsert.mockResolvedValue({});

    await handleMetaCallback('codigo', 'user-1');

    expect(mockGet).toHaveBeenCalledWith(
      'https://graph.facebook.com/v19.0/oauth/access_token',
      expect.objectContaining({
        params: expect.objectContaining({ code: 'codigo' }),
      }),
    );
    expect(mUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id_plataforma: { user_id: 'user-1', plataforma: 'meta' } },
        update: expect.objectContaining({ access_token: 'tok-meta' }),
        create: expect.objectContaining({ user_id: 'user-1', plataforma: 'meta' }),
      }),
    );
  });
});

describe('handleGoogleCallback', () => {
  it('faz upsert do token e refresh_token recebidos do Google', async () => {
    mockPost.mockResolvedValue({
      data: { access_token: 'tok-g', refresh_token: 'rt-g', expires_in: 3600 },
    });
    mUpsert.mockResolvedValue({});

    await handleGoogleCallback('codigo', 'user-1');

    expect(mUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          access_token: 'tok-g',
          refresh_token: 'rt-g',
        }),
      }),
    );
  });
});

describe('getValidToken', () => {
  it('lança erro quando integração não existe', async () => {
    mFindUnique.mockResolvedValue(null);
    await expect(getValidToken('user-1', 'meta')).rejects.toThrow('meta não conectado');
  });

  it('retorna token quando ainda não está expirando', async () => {
    mFindUnique.mockResolvedValue({
      user_id: 'user-1',
      access_token: 'token-valido',
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
    });

    const token = await getValidToken('user-1', 'meta');
    expect(token).toBe('token-valido');
    expect(mockGet).not.toHaveBeenCalled();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('renova token Meta quando está prestes a expirar', async () => {
    mFindUnique.mockResolvedValue({
      user_id: 'user-1',
      access_token: 'antigo',
      expires_at: new Date(Date.now() + 60 * 1000),
    });
    mockGet.mockResolvedValue({ data: { access_token: 'novo', expires_in: 3600 } });
    mUpdate.mockResolvedValue({});

    const token = await getValidToken('user-1', 'meta');

    expect(token).toBe('novo');
    expect(mUpdate).toHaveBeenCalled();
  });

  it('renova token Google usando refresh_token quando expira', async () => {
    mFindUnique.mockResolvedValue({
      user_id: 'user-1',
      access_token: 'antigo',
      refresh_token: 'rt',
      expires_at: new Date(Date.now() + 60 * 1000),
    });
    mockPost.mockResolvedValue({ data: { access_token: 'novo-g', expires_in: 3600 } });
    mUpdate.mockResolvedValue({});

    const token = await getValidToken('user-1', 'google');

    expect(token).toBe('novo-g');
    expect(mockPost).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({
        grant_type: 'refresh_token',
        refresh_token: 'rt',
      }),
    );
  });

  it('lança erro ao renovar Google sem refresh_token', async () => {
    mFindUnique.mockResolvedValue({
      user_id: 'user-1',
      access_token: 'antigo',
      refresh_token: null,
      expires_at: new Date(Date.now() + 60 * 1000),
    });

    await expect(getValidToken('user-1', 'google')).rejects.toThrow('refresh_token não disponível');
  });
});

describe('buscarContasMeta', () => {
  it('lista contas de anúncios da Meta com id e nome', async () => {
    mFindUnique.mockResolvedValue({
      user_id: 'user-1',
      access_token: 'tk',
      expires_at: new Date(Date.now() + 3600 * 1000),
    });
    mockGet.mockResolvedValue({
      data: { data: [{ id: 'act_1', name: 'Conta A' }, { id: 'act_2', name: 'Conta B' }] },
    });

    const contas = await buscarContasMeta('user-1');
    expect(contas).toEqual([
      { id: 'act_1', name: 'Conta A' },
      { id: 'act_2', name: 'Conta B' },
    ]);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
