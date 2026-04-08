import request from 'supertest';
import app from '../../../index';

// TODO: Implementar quando as rotas de campanhas existirem
// Dependência: módulo campanhas com controller + service + Prisma

// Setup necessário quando implementar:
// - beforeAll: prisma migrate deploy com DATABASE_URL_TEST
// - afterEach: TRUNCATE nas tabelas afetadas
// - afterAll: prisma.$disconnect()

describe('GET /campanhas', () => {
  it.todo('should return list of campaigns for authenticated user');
  it.todo('should return 401 if not authenticated');
});

describe('POST /campanhas', () => {
  it.todo('should create a campaign and return 201');
  it.todo('should return 400 if required fields are missing');
  it.todo('should return 401 if not authenticated');
});

describe('GET /campanhas/:id', () => {
  it.todo('should return campaign by id');
  it.todo('should return 404 if campaign does not exist');
  it.todo('should return 403 if campaign belongs to another user');
});

describe('PUT /campanhas/:id', () => {
  it.todo('should update campaign and return updated data');
  it.todo('should return 404 if campaign does not exist');
});

describe('DELETE /campanhas/:id', () => {
  it.todo('should delete campaign and return 204');
  it.todo('should return 403 if campaign belongs to another user');
});
