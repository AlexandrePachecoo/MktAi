import { gerarCriativoIA } from '../criativos.service';
import { prisma } from '../../../lib/prisma';

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    campanha: { findUnique: jest.fn() },
    criativo: { create: jest.fn() },
    $disconnect: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://supabase.co/criativo.png' } }),
      }),
    },
  },
}));

// sharp mock: suporta metadata(), extract/greyscale/stats (análise de cor) e composite pipeline
jest.mock('sharp', () => {
  const chain = {
    metadata:  jest.fn().mockResolvedValue({ width: 1080, height: 1080 }),
    extract:   jest.fn().mockReturnThis(),
    greyscale: jest.fn().mockReturnThis(),
    stats:     jest.fn().mockResolvedValue({ channels: [{ mean: 60 }] }), // fundo escuro → texto branco
    composite: jest.fn().mockReturnThis(),
    png:       jest.fn().mockReturnThis(),
    toBuffer:  jest.fn().mockResolvedValue(Buffer.from('final-image')),
  };
  return jest.fn().mockReturnValue(chain);
});

const mPrisma = prisma as jest.Mocked<typeof prisma>;

const campanhaBase = {
  id: 'camp-1',
  user_id: 'user-1',
  nome: 'Produto X',
  descricao: 'Descrição do produto',
  objetivo: 'conversao',
  publico_alvo: 'Empreendedores',
  estrategia: {
    copies: [
      { titulo: 'Título A', texto: 'Texto A do anúncio' },
    ],
  },
};

const criativoSalvo = {
  id: 'cri-1',
  campanha_id: 'camp-1',
  url_imagem: 'https://supabase.co/criativo.png',
  tipo: 'gerado_ia',
  created_at: new Date(),
};

function mockFetch(calls: { ok: boolean; json?: object; text?: string }[]) {
  let i = 0;
  global.fetch = jest.fn().mockImplementation(() => {
    const call = calls[i++] ?? calls[calls.length - 1];
    return Promise.resolve({
      ok: call.ok,
      json: () => Promise.resolve(call.json ?? {}),
      text: () => Promise.resolve(call.text ?? ''),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.IDEOGRAM_API_KEY = 'test-key';
  (mPrisma.campanha.findUnique as jest.Mock).mockResolvedValue(campanhaBase);
  (mPrisma.criativo.create as jest.Mock).mockResolvedValue(criativoSalvo);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('gerarCriativoIA — sem copy', () => {
  it('chama /generate, baixa imagem e salva sem composite', async () => {
    mockFetch([
      { ok: true, json: { data: [{ url: 'https://ideogram.ai/base.png' }] } }, // /generate
      { ok: true }, // download base
    ]);

    const result = await gerarCriativoIA('camp-1', 'user-1', {});

    const fetchMock = global.fetch as jest.Mock;
    const urls = fetchMock.mock.calls.map((c: unknown[]) => c[0]);
    expect(urls).toContain('https://api.ideogram.ai/generate');
    expect(urls).not.toContain('https://api.ideogram.ai/edit');
    expect(result.id).toBe('cri-1');
  });
});

describe('gerarCriativoIA — com copy', () => {
  it('chama /generate, baixa imagem e aplica composite de texto via sharp', async () => {
    mockFetch([
      { ok: true, json: { data: [{ url: 'https://ideogram.ai/base.png' }] } }, // /generate
      { ok: true }, // download base
    ]);

    const sharpMock = jest.requireMock('sharp');
    const result = await gerarCriativoIA('camp-1', 'user-1', { copyIndex: 0 });

    const fetchMock = global.fetch as jest.Mock;
    const urls = fetchMock.mock.calls.map((c: unknown[]) => c[0]);
    expect(urls).toContain('https://api.ideogram.ai/generate');
    expect(urls).not.toContain('https://api.ideogram.ai/edit');

    // sharp foi chamado para metadata + composite
    expect(sharpMock).toHaveBeenCalled();
    const instance = sharpMock.mock.results[0].value;
    expect(instance.composite).toHaveBeenCalled();

    expect(result.id).toBe('cri-1');
  });
});

describe('gerarCriativoIA — erros de acesso', () => {
  it('lança NOT_FOUND se campanha não existe', async () => {
    (mPrisma.campanha.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      gerarCriativoIA('nao-existe', 'user-1', {})
    ).rejects.toMatchObject({ name: 'NOT_FOUND' });
  });

  it('lança FORBIDDEN se campanha pertence a outro usuário', async () => {
    await expect(
      gerarCriativoIA('camp-1', 'user-outro', {})
    ).rejects.toMatchObject({ name: 'FORBIDDEN' });
  });

  it('lança erro se IDEOGRAM_API_KEY não configurada', async () => {
    delete process.env.IDEOGRAM_API_KEY;

    await expect(
      gerarCriativoIA('camp-1', 'user-1', {})
    ).rejects.toThrow('IDEOGRAM_API_KEY');
  });

  it('lança erro se /generate falhar', async () => {
    mockFetch([{ ok: false, text: 'Service Unavailable' }]);

    await expect(
      gerarCriativoIA('camp-1', 'user-1', {})
    ).rejects.toThrow('Ideogram /generate error');
  });
});
