import request from 'supertest';
import app from '../../../index';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';
import * as integracoesService from '../integracoes.service';

jest.mock('../integracoes.service');

const mockedService = integracoesService as jest.Mocked<typeof integracoesService>;

function makeToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'test_secret');
}

describe('GET /integracoes/meta', () => {
  it('redireciona para URL do Meta OAuth', async () => {
    mockedService.getMetaAuthUrl.mockReturnValue('https://facebook.com/oauth?mock=1');

    const token = makeToken('user-1');
    const res = await request(app)
      .get('/integracoes/meta')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://facebook.com/oauth?mock=1');
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/integracoes/meta');
    expect(res.status).toBe(401);
  });
});

describe('GET /integracoes/meta/callback', () => {
  it('salva integração e retorna sucesso', async () => {
    mockedService.handleMetaCallback.mockResolvedValue(undefined);

    const token = makeToken('user-1');
    const res = await request(app)
      .get('/integracoes/meta/callback?code=abc123')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Meta Ads conectado com sucesso');
    expect(mockedService.handleMetaCallback).toHaveBeenCalledWith('abc123', 'user-1');
  });

  it('retorna 400 quando callback retorna erro do Meta', async () => {
    const token = makeToken('user-1');
    const res = await request(app)
      .get('/integracoes/meta/callback?error=access_denied')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

describe('GET /integracoes/google', () => {
  it('redireciona para URL do Google OAuth', async () => {
    mockedService.getGoogleAuthUrl.mockReturnValue('https://accounts.google.com/oauth?mock=1');

    const token = makeToken('user-1');
    const res = await request(app)
      .get('/integracoes/google')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://accounts.google.com/oauth?mock=1');
  });
});

describe('GET /integracoes/google/callback', () => {
  it('salva integração e retorna sucesso', async () => {
    mockedService.handleGoogleCallback.mockResolvedValue(undefined);

    const token = makeToken('user-1');
    const res = await request(app)
      .get('/integracoes/google/callback?code=xyz789')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Google Ads conectado com sucesso');
    expect(mockedService.handleGoogleCallback).toHaveBeenCalledWith('xyz789', 'user-1');
  });

  it('retorna 400 quando callback retorna erro do Google', async () => {
    const token = makeToken('user-1');
    const res = await request(app)
      .get('/integracoes/google/callback?error=access_denied')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
