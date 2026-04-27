import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../pagamentos.service');

import app from '../../../index';
import { prisma } from '../../../lib/prisma';
import * as pagamentosService from '../pagamentos.service';

const mocked = pagamentosService as jest.Mocked<typeof pagamentosService>;

function makeToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret');
}

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.ABACATEPAY_WEBHOOK_SECRET;
});

describe('GET /api/pagamentos/planos', () => {
  it('retorna a lista de planos sem autenticação', async () => {
    mocked.listarPlanos.mockReturnValue([
      { slug: 'free', nome: 'Free', preco: 0, precoFormatado: 'Grátis', features: [] },
    ]);

    const res = await request(app).get('/api/pagamentos/planos');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].slug).toBe('free');
  });
});

describe('POST /api/pagamentos/checkout', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).post('/api/pagamentos/checkout').send({ plano: 'pro' });
    expect(res.status).toBe(401);
  });

  it('retorna 400 quando plano não é informado', async () => {
    const res = await request(app)
      .post('/api/pagamentos/checkout')
      .set('Authorization', `Bearer ${makeToken('user-1')}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/plano/i);
  });

  it('cria checkout e retorna URL', async () => {
    mocked.criarCheckout.mockResolvedValue('https://abacatepay.com/checkout/xyz');

    const res = await request(app)
      .post('/api/pagamentos/checkout')
      .set('Authorization', `Bearer ${makeToken('user-1')}`)
      .send({ plano: 'pro' });

    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://abacatepay.com/checkout/xyz');
    expect(mocked.criarCheckout).toHaveBeenCalledWith('user-1', 'pro');
  });

  it('retorna 400 quando service lança erro', async () => {
    mocked.criarCheckout.mockRejectedValue(new Error('Plano inválido'));

    const res = await request(app)
      .post('/api/pagamentos/checkout')
      .set('Authorization', `Bearer ${makeToken('user-1')}`)
      .send({ plano: 'inexistente' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Plano inválido');
  });
});

describe('POST /api/pagamentos/webhook', () => {
  it('processa webhook sem autenticação quando ABACATEPAY_WEBHOOK_SECRET não está definido', async () => {
    mocked.processarWebhook.mockResolvedValue(undefined);

    const res = await request(app)
      .post('/api/pagamentos/webhook')
      .send({ event: 'BILLING_PAID' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(mocked.processarWebhook).toHaveBeenCalled();
  });

  it('retorna 401 quando token não bate com o secret', async () => {
    process.env.ABACATEPAY_WEBHOOK_SECRET = 'segredo';

    const res = await request(app)
      .post('/api/pagamentos/webhook?token=errado')
      .send({ event: 'BILLING_PAID' });

    expect(res.status).toBe(401);
    expect(mocked.processarWebhook).not.toHaveBeenCalled();
  });

  it('aceita token correto via query string', async () => {
    process.env.ABACATEPAY_WEBHOOK_SECRET = 'segredo';
    mocked.processarWebhook.mockResolvedValue(undefined);

    const res = await request(app)
      .post('/api/pagamentos/webhook?token=segredo')
      .send({ event: 'BILLING_PAID' });

    expect(res.status).toBe(200);
    expect(mocked.processarWebhook).toHaveBeenCalled();
  });

  it('aceita token correto via header x-abacatepay-token', async () => {
    process.env.ABACATEPAY_WEBHOOK_SECRET = 'segredo';
    mocked.processarWebhook.mockResolvedValue(undefined);

    const res = await request(app)
      .post('/api/pagamentos/webhook')
      .set('x-abacatepay-token', 'segredo')
      .send({ event: 'BILLING_PAID' });

    expect(res.status).toBe(200);
  });

  it('retorna 500 quando processamento falha', async () => {
    mocked.processarWebhook.mockRejectedValue(new Error('boom'));

    const res = await request(app)
      .post('/api/pagamentos/webhook')
      .send({ event: 'BILLING_PAID' });

    expect(res.status).toBe(500);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
