jest.mock('axios');
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

import axios from 'axios';
import { listarPlanos, criarCheckout, processarWebhook, PLANOS } from '../pagamentos.service';
import { prisma } from '../../../lib/prisma';

const mockPost = axios.post as jest.Mock;
const mockFindUnique = prisma.user.findUnique as jest.Mock;
const mockUpdate = prisma.user.update as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.ABACATEPAY_API_KEY = 'test-key';
  process.env.BACKEND_URL = 'http://backend.test';
  process.env.FRONTEND_URL = 'http://frontend.test';
  delete process.env.ABACATEPAY_WEBHOOK_SECRET;
});

describe('listarPlanos', () => {
  it('retorna a lista de planos disponíveis', () => {
    const planos = listarPlanos();
    expect(planos).toBe(PLANOS);
    expect(planos.map((p) => p.slug)).toEqual(['free', 'basico', 'pro']);
  });

  it('cada plano tem nome, preco e features', () => {
    for (const plano of listarPlanos()) {
      expect(plano.slug).toBeTruthy();
      expect(plano.nome).toBeTruthy();
      expect(typeof plano.preco).toBe('number');
      expect(Array.isArray(plano.features)).toBe(true);
    }
  });
});

describe('criarCheckout', () => {
  it('lança erro quando plano é inválido', async () => {
    await expect(criarCheckout('user-1', 'inexistente')).rejects.toThrow('Plano inválido');
  });

  it('lança erro quando tenta checkout do plano free', async () => {
    await expect(criarCheckout('user-1', 'free')).rejects.toThrow('Plano inválido');
  });

  it('lança erro quando usuário não existe', async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(criarCheckout('user-1', 'basico')).rejects.toThrow('Usuário não encontrado');
  });

  it('cria checkout no AbacatePay e retorna URL sem CPF/telefone quando o usuário não os tem', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-1', nome: 'João', email: 'joao@test.com', cpf: null, telefone: null });
    mockPost.mockResolvedValue({ data: { data: { url: 'https://abacatepay.com/checkout/abc' } } });

    const url = await criarCheckout('user-1', 'basico');

    expect(url).toBe('https://abacatepay.com/checkout/abc');
    expect(mockPost).toHaveBeenCalledWith(
      'https://api.abacatepay.com/v1/billing/create',
      expect.objectContaining({
        frequency: 'ONE_TIME',
        methods: ['PIX'],
        products: [
          expect.objectContaining({
            externalId: 'user-1:basico',
            quantity: 1,
            price: 4890,
          }),
        ],
        customer: { name: 'João', email: 'joao@test.com' },
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      }),
    );
  });

  it('inclui CPF e telefone do usuário no customer quando já estão salvos', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'user-1',
      nome: 'João',
      email: 'joao@test.com',
      cpf: '123.456.789-09',
      telefone: '(11) 99999-9999',
    });
    mockPost.mockResolvedValue({ data: { data: { url: 'https://abacatepay.com/checkout/abc' } } });

    await criarCheckout('user-1', 'basico');

    const payload = mockPost.mock.calls[0][1];
    expect(payload.customer).toEqual({
      name: 'João',
      email: 'joao@test.com',
      taxId: '12345678909',
      cellphone: '+5511999999999',
    });
  });

  it('inclui token do webhook no completionUrl quando configurado', async () => {
    process.env.ABACATEPAY_WEBHOOK_SECRET = 'wh-secret';
    mockFindUnique.mockResolvedValue({ id: 'user-1', nome: 'João', email: 'joao@test.com', cpf: null, telefone: null });
    mockPost.mockResolvedValue({ data: { data: { url: 'https://abacatepay.com/checkout/abc' } } });

    await criarCheckout('user-1', 'pro');

    const payload = mockPost.mock.calls[0][1];
    expect(payload.completionUrl).toBe('http://backend.test/api/pagamentos/webhook?token=wh-secret');
  });
});

describe('processarWebhook', () => {
  it('ignora eventos diferentes de BILLING_PAID', async () => {
    await processarWebhook({ event: 'BILLING_CANCELLED' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('ignora payload sem externalId', async () => {
    await processarWebhook({ event: 'BILLING_PAID', data: { products: [{}] } });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('ignora externalId malformado', async () => {
    await processarWebhook({
      event: 'BILLING_PAID',
      data: { products: [{ externalId: 'sem-separador' }] },
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('ignora plano inexistente no externalId', async () => {
    await processarWebhook({
      event: 'BILLING_PAID',
      data: { products: [{ externalId: 'user-1:inexistente' }] },
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('atualiza plano do usuário quando pagamento é confirmado', async () => {
    await processarWebhook({
      event: 'BILLING_PAID',
      data: { products: [{ externalId: 'user-1:pro' }] },
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { plano: 'pro' },
    });
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
