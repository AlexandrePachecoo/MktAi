import request from 'supertest';
import app from '../../../index';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';
import * as testesAbService from '../testes-ab.service';

jest.mock('../testes-ab.service');

const mocked = testesAbService as jest.Mocked<typeof testesAbService>;

function makeToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'test_secret');
}

const criativoA = { id: 'cria-a', campanha_id: 'camp-1', url_imagem: 'https://img.com/a.jpg', tipo: 'upload', created_at: new Date() };
const criativoB = { id: 'cria-b', campanha_id: 'camp-1', url_imagem: 'https://img.com/b.jpg', tipo: 'upload', created_at: new Date() };

const teste = {
  id: 'teste-1',
  campanha_id: 'camp-1',
  criativo_id_a: 'cria-a',
  criativo_id_b: 'cria-b',
  resultado: null,
  status: 'ativo',
  criativo_a: criativoA,
  criativo_b: criativoB,
};

describe('GET /campanhas/:id/testes-ab', () => {
  it('lista testes da campanha', async () => {
    mocked.listarTestes.mockResolvedValue([teste]);

    const res = await request(app)
      .get('/campanhas/camp-1/testes-ab')
      .set('Authorization', `Bearer ${makeToken('user-1')}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('teste-1');
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/campanhas/camp-1/testes-ab');
    expect(res.status).toBe(401);
  });

  it('retorna 404 se campanha não existe', async () => {
    const err = new Error('NOT_FOUND');
    err.name = 'NOT_FOUND';
    mocked.listarTestes.mockRejectedValue(err);

    const res = await request(app)
      .get('/campanhas/nao-existe/testes-ab')
      .set('Authorization', `Bearer ${makeToken('user-1')}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /campanhas/:id/testes-ab', () => {
  it('cria teste A/B e retorna 201', async () => {
    mocked.criarTeste.mockResolvedValue(teste);

    const res = await request(app)
      .post('/campanhas/camp-1/testes-ab')
      .set('Authorization', `Bearer ${makeToken('user-1')}`)
      .send({ criativo_id_a: 'cria-a', criativo_id_b: 'cria-b' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('teste-1');
  });

  it('retorna 400 se faltam campos', async () => {
    const res = await request(app)
      .post('/campanhas/camp-1/testes-ab')
      .set('Authorization', `Bearer ${makeToken('user-1')}`)
      .send({ criativo_id_a: 'cria-a' });

    expect(res.status).toBe(400);
  });

  it('retorna 400 se criativos são iguais', async () => {
    const err = new Error('CRIATIVOS_IGUAIS');
    err.name = 'CRIATIVOS_IGUAIS';
    mocked.criarTeste.mockRejectedValue(err);

    const res = await request(app)
      .post('/campanhas/camp-1/testes-ab')
      .set('Authorization', `Bearer ${makeToken('user-1')}`)
      .send({ criativo_id_a: 'cria-a', criativo_id_b: 'cria-a' });

    expect(res.status).toBe(400);
  });

  it('retorna 400 se criativo A não pertence à campanha', async () => {
    const err = new Error('CRIATIVO_A_INVALIDO');
    err.name = 'CRIATIVO_A_INVALIDO';
    mocked.criarTeste.mockRejectedValue(err);

    const res = await request(app)
      .post('/campanhas/camp-1/testes-ab')
      .set('Authorization', `Bearer ${makeToken('user-1')}`)
      .send({ criativo_id_a: 'outro', criativo_id_b: 'cria-b' });

    expect(res.status).toBe(400);
  });

  it('retorna 403 se campanha pertence a outro usuário', async () => {
    const err = new Error('FORBIDDEN');
    err.name = 'FORBIDDEN';
    mocked.criarTeste.mockRejectedValue(err);

    const res = await request(app)
      .post('/campanhas/camp-1/testes-ab')
      .set('Authorization', `Bearer ${makeToken('user-2')}`)
      .send({ criativo_id_a: 'cria-a', criativo_id_b: 'cria-b' });

    expect(res.status).toBe(403);
  });
});

describe('PATCH /campanhas/:id/testes-ab/:testeId/resultado', () => {
  it('atualiza resultado e encerra o teste', async () => {
    const encerrado = { ...teste, resultado: 'variante_a', status: 'encerrado' };
    mocked.atualizarResultado.mockResolvedValue(encerrado);

    const res = await request(app)
      .patch('/campanhas/camp-1/testes-ab/teste-1/resultado')
      .set('Authorization', `Bearer ${makeToken('user-1')}`)
      .send({ resultado: 'variante_a' });

    expect(res.status).toBe(200);
    expect(res.body.resultado).toBe('variante_a');
    expect(res.body.status).toBe('encerrado');
  });

  it('retorna 400 se resultado não for enviado', async () => {
    const res = await request(app)
      .patch('/campanhas/camp-1/testes-ab/teste-1/resultado')
      .set('Authorization', `Bearer ${makeToken('user-1')}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('retorna 404 se teste não existe', async () => {
    const err = new Error('NOT_FOUND');
    err.name = 'NOT_FOUND';
    mocked.atualizarResultado.mockRejectedValue(err);

    const res = await request(app)
      .patch('/campanhas/camp-1/testes-ab/nao-existe/resultado')
      .set('Authorization', `Bearer ${makeToken('user-1')}`)
      .send({ resultado: 'variante_b' });

    expect(res.status).toBe(404);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
