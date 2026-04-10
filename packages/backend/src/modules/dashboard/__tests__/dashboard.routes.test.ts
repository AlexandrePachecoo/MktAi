import request from 'supertest';
import app from '../../../index';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';
import * as dashboardService from '../dashboard.service';

jest.mock('../dashboard.service');

const mocked = dashboardService as jest.Mocked<typeof dashboardService>;

function makeToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'test_secret');
}

const dashboardMeta = {
  campanha_id: 'camp-1',
  nome: 'growthAi',
  status: 'ativa',
  plataforma: 'meta',
  meta: {
    plataforma: 'meta',
    impressoes: 12000,
    cliques: 340,
    gasto: 180.5,
    alcance: 9800,
    ctr: 2.83,
    cpc: 0.53,
  },
};

describe('GET /dashboard/:campanha_id', () => {
  it('retorna métricas da campanha', async () => {
    mocked.buscarDashboard.mockResolvedValue(dashboardMeta);

    const res = await request(app)
      .get('/dashboard/camp-1')
      .set('Authorization', `Bearer ${makeToken('user-1')}`);

    expect(res.status).toBe(200);
    expect(res.body.campanha_id).toBe('camp-1');
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.impressoes).toBe(12000);
    expect(mocked.buscarDashboard).toHaveBeenCalledWith('camp-1', 'user-1');
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/dashboard/camp-1');
    expect(res.status).toBe(401);
  });

  it('retorna 404 se campanha não existe', async () => {
    const err = new Error('NOT_FOUND');
    err.name = 'NOT_FOUND';
    mocked.buscarDashboard.mockRejectedValue(err);

    const res = await request(app)
      .get('/dashboard/nao-existe')
      .set('Authorization', `Bearer ${makeToken('user-1')}`);

    expect(res.status).toBe(404);
  });

  it('retorna 403 se campanha pertence a outro usuário', async () => {
    const err = new Error('FORBIDDEN');
    err.name = 'FORBIDDEN';
    mocked.buscarDashboard.mockRejectedValue(err);

    const res = await request(app)
      .get('/dashboard/camp-1')
      .set('Authorization', `Bearer ${makeToken('user-2')}`);

    expect(res.status).toBe(403);
  });

  it('retorna erro dentro do objeto quando integração não está conectada', async () => {
    mocked.buscarDashboard.mockResolvedValue({
      ...dashboardMeta,
      meta: { erro: 'Integração com Meta não encontrada' },
    });

    const res = await request(app)
      .get('/dashboard/camp-1')
      .set('Authorization', `Bearer ${makeToken('user-1')}`);

    expect(res.status).toBe(200);
    expect(res.body.meta.erro).toBeDefined();
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
