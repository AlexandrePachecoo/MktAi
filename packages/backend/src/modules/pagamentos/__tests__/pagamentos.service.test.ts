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

const mockGet = axios.get as jest.Mock;
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

  it('cria produto, customer e checkout no AbacatePay v2 e retorna URL', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-1', nome: 'João', email: 'joao@test.com', cpf: null, telefone: null });
    mockGet.mockResolvedValue({ data: { data: [] } });
    mockPost.mockImplementation((url: string) => {
      if (url.endsWith('/products/create')) return Promise.resolve({ data: { data: { id: 'prod_123' } } });
      if (url.endsWith('/customers/create')) return Promise.resolve({ data: { data: { id: 'cust_456' } } });
      if (url.endsWith('/checkouts/create')) return Promise.resolve({ data: { data: { url: 'https://abacatepay.com/checkout/abc' } } });
      return Promise.reject(new Error(`unexpected url: ${url}`));
    });

    const url = await criarCheckout('user-1', 'basico');

    expect(url).toBe('https://abacatepay.com/checkout/abc');

    const checkoutCall = mockPost.mock.calls.find((call) => call[0].endsWith('/checkouts/create'));
    expect(checkoutCall).toBeDefined();
    expect(checkoutCall![0]).toBe('https://api.abacatepay.com/v2/checkouts/create');
    expect(checkoutCall![1]).toEqual(
      expect.objectContaining({
        items: [{ id: 'prod_123', quantity: 1 }],
        methods: ['PIX'],
        customerId: 'cust_456',
        externalId: 'user-1:basico',
        returnUrl: 'http://frontend.test/assinar?status=pendente',
        completionUrl: 'http://backend.test/api/pagamentos/webhook',
      }),
    );
    expect(checkoutCall![2]).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
      }),
    );

    const productCreate = mockPost.mock.calls.find((call) => call[0].endsWith('/products/create'));
    expect(productCreate![1]).toEqual({
      externalId: 'basico',
      name: 'Básico',
      price: 4890,
      currency: 'BRL',
    });

    const customerCreate = mockPost.mock.calls.find((call) => call[0].endsWith('/customers/create'));
    expect(customerCreate![1]).toEqual({ name: 'João', email: 'joao@test.com' });
  });

  it('inclui CPF e telefone do usuário ao criar customer quando já estão salvos', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'user-1',
      nome: 'João',
      email: 'joao@test.com',
      cpf: '123.456.789-09',
      telefone: '(11) 99999-9999',
    });
    mockGet.mockResolvedValue({ data: { data: [] } });
    mockPost.mockImplementation((url: string) => {
      if (url.endsWith('/products/create')) return Promise.resolve({ data: { data: { id: 'prod_123' } } });
      if (url.endsWith('/customers/create')) return Promise.resolve({ data: { data: { id: 'cust_456' } } });
      if (url.endsWith('/checkouts/create')) return Promise.resolve({ data: { data: { url: 'https://abacatepay.com/checkout/abc' } } });
      return Promise.reject(new Error(`unexpected url: ${url}`));
    });

    await criarCheckout('user-1', 'basico');

    const customerCreate = mockPost.mock.calls.find((call) => call[0].endsWith('/customers/create'));
    expect(customerCreate![1]).toEqual({
      name: 'João',
      email: 'joao@test.com',
      taxId: '12345678909',
      cellphone: '+5511999999999',
    });
  });

  it('reutiliza produto e customer já existentes encontrados via list', async () => {
    mockFindUnique.mockResolvedValue({ id: 'user-1', nome: 'João', email: 'joao@test.com', cpf: null, telefone: null });
    mockGet.mockImplementation((url: string) => {
      if (url.endsWith('/products/list')) return Promise.resolve({ data: { data: [{ id: 'prod_existing' }] } });
      if (url.endsWith('/customers/list')) return Promise.resolve({ data: { data: [{ id: 'cust_existing' }] } });
      return Promise.reject(new Error(`unexpected url: ${url}`));
    });
    mockPost.mockResolvedValue({ data: { data: { url: 'https://abacatepay.com/checkout/abc' } } });

    const url = await criarCheckout('user-1', 'pro');

    expect(url).toBe('https://abacatepay.com/checkout/abc');
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost.mock.calls[0][0]).toBe('https://api.abacatepay.com/v2/checkouts/create');
    expect(mockPost.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        items: [{ id: 'prod_existing', quantity: 1 }],
        customerId: 'cust_existing',
      }),
    );
  });

  it('inclui token do webhook no completionUrl quando configurado', async () => {
    process.env.ABACATEPAY_WEBHOOK_SECRET = 'wh-secret';
    mockFindUnique.mockResolvedValue({ id: 'user-1', nome: 'João', email: 'joao@test.com', cpf: null, telefone: null });
    mockGet.mockResolvedValue({ data: { data: [] } });
    mockPost.mockImplementation((url: string) => {
      if (url.endsWith('/products/create')) return Promise.resolve({ data: { data: { id: 'prod_123' } } });
      if (url.endsWith('/customers/create')) return Promise.resolve({ data: { data: { id: 'cust_456' } } });
      if (url.endsWith('/checkouts/create')) return Promise.resolve({ data: { data: { url: 'https://abacatepay.com/checkout/abc' } } });
      return Promise.reject(new Error(`unexpected url: ${url}`));
    });

    await criarCheckout('user-1', 'pro');

    const checkoutCall = mockPost.mock.calls.find((call) => call[0].endsWith('/checkouts/create'));
    expect(checkoutCall![1].completionUrl).toBe('http://backend.test/api/pagamentos/webhook?token=wh-secret');
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
      data: { externalId: 'sem-separador' },
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('ignora plano inexistente no externalId', async () => {
    await processarWebhook({
      event: 'BILLING_PAID',
      data: { externalId: 'user-1:inexistente' },
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('atualiza plano do usuário quando pagamento é confirmado (externalId no topo do data v2)', async () => {
    await processarWebhook({
      event: 'BILLING_PAID',
      data: { externalId: 'user-1:pro' },
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { plano: 'pro' },
    });
  });

  it('aceita externalId aninhado em products[] como fallback', async () => {
    await processarWebhook({
      event: 'BILLING_PAID',
      data: { products: [{ externalId: 'user-1:basico' }] },
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { plano: 'basico' },
    });
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
