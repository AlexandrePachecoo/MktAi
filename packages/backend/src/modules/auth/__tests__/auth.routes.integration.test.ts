import request from 'supertest';
import app from '../../../index';

// TODO: Implementar quando as rotas de auth existirem
// Dependência: POST /auth/register e POST /auth/login

describe('POST /auth/register', () => {
  it.todo('should register a new user and return 201');
  it.todo('should return 400 if email already exists');
  it.todo('should return 400 if required fields are missing');
});

describe('POST /auth/login', () => {
  it.todo('should login with valid credentials and return token');
  it.todo('should return 401 with invalid password');
  it.todo('should return 404 if user does not exist');
});

// Smoke test para garantir que o servidor sobe
describe('Server', () => {
  it('should respond to requests', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });
});
