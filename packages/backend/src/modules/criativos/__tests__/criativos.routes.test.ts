import request from 'supertest';
import app from '../../../index';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';
import * as criativosService from '../criativos.service';

jest.mock('../criativos.service');

const mocked = criativosService as jest.Mocked<typeof criativosService>;

function makeToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'test_secret');
}

const criativo = {
  id: 'criativo-1',
  campanha_id: 'camp-1',
  url_imagem: 'https://supabase.co/storage/criativos/user-1/foto.jpg',
  tipo: 'upload',
  created_at: new Date(),
};

describe('POST /upload', () => {
  it('retorna 400 se nenhuma imagem for enviada', async () => {
    const res = await request(app)
      .post('/upload/upload')
      .set('Authorization', `Bearer ${makeToken('user-1')}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Nenhuma imagem enviada');
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).post('/upload/upload');
    expect(res.status).toBe(401);
  });

  it('faz upload e retorna URL', async () => {
    mocked.uploadImagem.mockResolvedValue('https://supabase.co/storage/criativos/foto.jpg');

    const res = await request(app)
      .post('/upload/upload')
      .set('Authorization', `Bearer ${makeToken('user-1')}`)
      .attach('imagem', Buffer.from('fake-image'), { filename: 'foto.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(201);
    expect(res.body.url).toBeDefined();
  });
});

describe('POST /campanhas/:id/criativos', () => {
  it('associa criativo à campanha', async () => {
    mocked.associarCriativo.mockResolvedValue(criativo);

    const res = await request(app)
      .post('/campanhas/camp-1/criativos')
      .set('Authorization', `Bearer ${makeToken('user-1')}`)
      .send({ url_imagem: 'https://supabase.co/storage/criativos/foto.jpg' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('criativo-1');
  });

  it('retorna 400 se url_imagem não for enviada', async () => {
    const res = await request(app)
      .post('/campanhas/camp-1/criativos')
      .set('Authorization', `Bearer ${makeToken('user-1')}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('retorna 404 se campanha não existe', async () => {
    const err = new Error('NOT_FOUND');
    err.name = 'NOT_FOUND';
    mocked.associarCriativo.mockRejectedValue(err);

    const res = await request(app)
      .post('/campanhas/nao-existe/criativos')
      .set('Authorization', `Bearer ${makeToken('user-1')}`)
      .send({ url_imagem: 'https://example.com/foto.jpg' });

    expect(res.status).toBe(404);
  });

  it('retorna 403 se campanha pertence a outro usuário', async () => {
    const err = new Error('FORBIDDEN');
    err.name = 'FORBIDDEN';
    mocked.associarCriativo.mockRejectedValue(err);

    const res = await request(app)
      .post('/campanhas/camp-1/criativos')
      .set('Authorization', `Bearer ${makeToken('user-2')}`)
      .send({ url_imagem: 'https://example.com/foto.jpg' });

    expect(res.status).toBe(403);
  });
});

describe('GET /campanhas/:id/criativos', () => {
  it('lista criativos da campanha', async () => {
    mocked.listarCriativos.mockResolvedValue([criativo]);

    const res = await request(app)
      .get('/campanhas/camp-1/criativos')
      .set('Authorization', `Bearer ${makeToken('user-1')}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/campanhas/camp-1/criativos');
    expect(res.status).toBe(401);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
