import request from 'supertest';
import app from '../../../index';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';
import * as campanhasService from '../campanhas.service';

jest.mock('../campanhas.service');

const mocked = campanhasService as jest.Mocked<typeof campanhasService>;

function makeToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'test_secret');
}

const campanha = {
  id: 'camp-1',
  user_id: 'user-1',
  nome: 'Campanha Verão',
  descricao: 'Promoção verão',
  publico_alvo: '18-35',
  orcamento: 500,
  plataforma: 'meta',
  status: 'ativa',
  created_at: new Date(),
};

describe('GET /campanhas', () => {
  it('retorna lista de campanhas do usuário autenticado', async () => {
    mocked.listarCampanhas.mockResolvedValue([campanha]);

    const res = await request(app)
      .get('/campanhas')
      .set('Authorization', `Bearer ${makeToken('user-1')}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].nome).toBe('Campanha Verão');
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/campanhas');
    expect(res.status).toBe(401);
  });
});

describe('POST /campanhas', () => {
  it('cria campanha e retorna 201', async () => {
    mocked.criarCampanha.mockResolvedValue(campanha);

    const res = await request(app)
      .post('/campanhas')
      .set('Authorization', `Bearer ${makeToken('user-1')}`)
      .send({ nome: 'Campanha Verão', descricao: 'Promoção verão', publico_alvo: '18-35', orcamento: 500, plataforma: 'meta' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('camp-1');
  });

  it('retorna 400 se faltam campos obrigatórios', async () => {
    const res = await request(app)
      .post('/campanhas')
      .set('Authorization', `Bearer ${makeToken('user-1')}`)
      .send({ nome: 'Só o nome' });

    expect(res.status).toBe(400);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).post('/campanhas').send({});
    expect(res.status).toBe(401);
  });
});

describe('GET /campanhas/:id', () => {
  it('retorna campanha pelo id', async () => {
    mocked.buscarCampanha.mockResolvedValue(campanha);

    const res = await request(app)
      .get('/campanhas/camp-1')
      .set('Authorization', `Bearer ${makeToken('user-1')}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('camp-1');
  });

  it('retorna 404 se campanha não existe', async () => {
    const err = new Error('NOT_FOUND');
    err.name = 'NOT_FOUND';
    mocked.buscarCampanha.mockRejectedValue(err);

    const res = await request(app)
      .get('/campanhas/nao-existe')
      .set('Authorization', `Bearer ${makeToken('user-1')}`);

    expect(res.status).toBe(404);
  });

  it('retorna 403 se campanha pertence a outro usuário', async () => {
    const err = new Error('FORBIDDEN');
    err.name = 'FORBIDDEN';
    mocked.buscarCampanha.mockRejectedValue(err);

    const res = await request(app)
      .get('/campanhas/camp-1')
      .set('Authorization', `Bearer ${makeToken('user-2')}`);

    expect(res.status).toBe(403);
  });
});

describe('PUT /campanhas/:id', () => {
  it('atualiza campanha e retorna dados atualizados', async () => {
    const atualizada = { ...campanha, nome: 'Campanha Inverno' };
    mocked.atualizarCampanha.mockResolvedValue(atualizada);

    const res = await request(app)
      .put('/campanhas/camp-1')
      .set('Authorization', `Bearer ${makeToken('user-1')}`)
      .send({ nome: 'Campanha Inverno' });

    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Campanha Inverno');
  });

  it('retorna 404 se campanha não existe', async () => {
    const err = new Error('NOT_FOUND');
    err.name = 'NOT_FOUND';
    mocked.atualizarCampanha.mockRejectedValue(err);

    const res = await request(app)
      .put('/campanhas/nao-existe')
      .set('Authorization', `Bearer ${makeToken('user-1')}`)
      .send({ nome: 'Novo nome' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /campanhas/:id', () => {
  it('deleta campanha e retorna 204', async () => {
    mocked.deletarCampanha.mockResolvedValue(undefined);

    const res = await request(app)
      .delete('/campanhas/camp-1')
      .set('Authorization', `Bearer ${makeToken('user-1')}`);

    expect(res.status).toBe(204);
  });

  it('retorna 403 se campanha pertence a outro usuário', async () => {
    const err = new Error('FORBIDDEN');
    err.name = 'FORBIDDEN';
    mocked.deletarCampanha.mockRejectedValue(err);

    const res = await request(app)
      .delete('/campanhas/camp-1')
      .set('Authorization', `Bearer ${makeToken('user-2')}`);

    expect(res.status).toBe(403);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
