import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../../../index';

jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { prisma } from '../../../lib/prisma';

const mockFindUnique = prisma.user.findUnique as jest.Mock;
const mockCreate = prisma.user.create as jest.Mock;

const fakeUser = {
  id: 'uuid-1',
  nome: 'Test User',
  email: 'test@test.com',
  plano: 'free',
  created_at: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /auth/register', () => {
  it('should register a new user and return 201', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue(fakeUser);

    const res = await request(app).post('/auth/register').send({
      nome: 'Test User',
      email: 'test@test.com',
      password: '123456',
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 'uuid-1', email: 'test@test.com' });
    expect(res.body).not.toHaveProperty('hash_pass');
  });

  it('should return 400 if email already exists', async () => {
    mockFindUnique.mockResolvedValue(fakeUser);

    const res = await request(app).post('/auth/register').send({
      nome: 'Test User',
      email: 'test@test.com',
      password: '123456',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email já cadastrado');
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  it('should login with valid credentials and return token', async () => {
    const hash = await bcrypt.hash('123456', 10);
    mockFindUnique.mockResolvedValue({ ...fakeUser, hash_pass: hash });

    const res = await request(app).post('/auth/login').send({
      email: 'test@test.com',
      password: '123456',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ email: 'test@test.com' });
  });

  it('should return 401 with invalid password', async () => {
    const hash = await bcrypt.hash('correct-password', 10);
    mockFindUnique.mockResolvedValue({ ...fakeUser, hash_pass: hash });

    const res = await request(app).post('/auth/login').send({
      email: 'test@test.com',
      password: 'wrong-password',
    });

    expect(res.status).toBe(401);
  });

  it('should return 404 if user does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await request(app).post('/auth/login').send({
      email: 'notfound@test.com',
      password: '123456',
    });

    expect(res.status).toBe(404);
  });
});

describe('Server', () => {
  it('should respond to requests', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });
});
