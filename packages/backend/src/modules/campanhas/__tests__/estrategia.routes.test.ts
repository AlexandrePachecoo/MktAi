import request from 'supertest';
import app from '../../../index';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';
import * as estrategiaService from '../estrategia.service';

jest.mock('../estrategia.service');

const mocked = estrategiaService as jest.Mocked<typeof estrategiaService>;

function makeToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'test_secret');
}

const estrategiaMock: estrategiaService.Estrategia = {
  resumo: 'Estratégia focada em conversão para o público jovem adulto.',
  distribuicao: [
    { plataforma: 'meta', percentual: 60, justificativa: 'Maior alcance para o público-alvo' },
    { plataforma: 'google', percentual: 40, justificativa: 'Captura intenção de compra' },
  ],
  copies: [
    { titulo: 'Oferta imperdível', texto: 'Aproveite agora!', formato: 'stories' },
    { titulo: 'Você merece', texto: 'Qualidade que transforma.', formato: 'carrossel' },
    { titulo: 'Promoção limitada', texto: 'Só hoje com 20% off.', formato: 'feed' },
    { titulo: 'Conheça agora', texto: 'A solução que você esperava.', formato: 'search' },
    { titulo: 'Resultados reais', texto: 'Veja o que nossos clientes dizem.', formato: 'display' },
  ],
};

describe('POST /campanhas/:id/estrategia', () => {
  it('gera e retorna estratégia de marketing', async () => {
    mocked.gerarEstrategia.mockResolvedValue(estrategiaMock);

    const res = await request(app)
      .post('/campanhas/camp-1/estrategia')
      .set('Authorization', `Bearer ${makeToken('user-1')}`);

    expect(res.status).toBe(200);
    expect(res.body.resumo).toBeDefined();
    expect(res.body.copies).toHaveLength(5);
    expect(res.body.distribuicao.length).toBeGreaterThan(0);
    expect(mocked.gerarEstrategia).toHaveBeenCalledWith('camp-1', 'user-1');
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).post('/campanhas/camp-1/estrategia');
    expect(res.status).toBe(401);
  });

  it('retorna 404 se campanha não existe', async () => {
    const err = new Error('NOT_FOUND');
    err.name = 'NOT_FOUND';
    mocked.gerarEstrategia.mockRejectedValue(err);

    const res = await request(app)
      .post('/campanhas/nao-existe/estrategia')
      .set('Authorization', `Bearer ${makeToken('user-1')}`);

    expect(res.status).toBe(404);
  });

  it('retorna 403 se campanha pertence a outro usuário', async () => {
    const err = new Error('FORBIDDEN');
    err.name = 'FORBIDDEN';
    mocked.gerarEstrategia.mockRejectedValue(err);

    const res = await request(app)
      .post('/campanhas/camp-1/estrategia')
      .set('Authorization', `Bearer ${makeToken('user-2')}`);

    expect(res.status).toBe(403);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
