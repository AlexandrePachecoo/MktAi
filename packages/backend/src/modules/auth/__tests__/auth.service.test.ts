jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_token'),
}));

import { register, login } from '../auth.service';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

const mockFindUnique = prisma.user.findUnique as jest.Mock;
const mockCreate = prisma.user.create as jest.Mock;
const mockCompare = bcrypt.compare as jest.Mock;

const userRecord = {
  id: 'u1',
  nome: 'João',
  email: 'joao@test.com',
  hash_pass: 'hashed_password',
  plano: 'free',
  created_at: new Date(),
};

beforeEach(() => jest.clearAllMocks());

describe('register', () => {
  it('lança EMAIL_TAKEN quando e-mail já existe', async () => {
    mockFindUnique.mockResolvedValue(userRecord);

    await expect(register('João', 'joao@test.com', '123456')).rejects.toMatchObject({
      name: 'EMAIL_TAKEN',
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('cria usuário quando e-mail não existe', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      id: 'u2',
      nome: 'Maria',
      email: 'maria@test.com',
      plano: 'free',
      created_at: new Date(),
    });

    const result = await register('Maria', 'maria@test.com', 'senha123');

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nome: 'Maria',
          email: 'maria@test.com',
          hash_pass: 'hashed_password',
        }),
      })
    );
    expect(result.email).toBe('maria@test.com');
  });

  it('faz hash da senha antes de salvar', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: 'u2', nome: 'Maria', email: 'maria@test.com', plano: 'free', created_at: new Date() });

    await register('Maria', 'maria@test.com', 'senha_secreta');

    expect(bcrypt.hash).toHaveBeenCalledWith('senha_secreta', 10);
  });
});

describe('login', () => {
  it('lança USER_NOT_FOUND quando e-mail não existe', async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(login('nao@existe.com', '123456')).rejects.toMatchObject({
      name: 'USER_NOT_FOUND',
    });
  });

  it('lança INVALID_PASSWORD quando a senha está incorreta', async () => {
    mockFindUnique.mockResolvedValue(userRecord);
    mockCompare.mockResolvedValue(false);

    await expect(login('joao@test.com', 'senha_errada')).rejects.toMatchObject({
      name: 'INVALID_PASSWORD',
    });
  });

  it('retorna token e user quando credenciais são válidas', async () => {
    mockFindUnique.mockResolvedValue(userRecord);
    mockCompare.mockResolvedValue(true);

    const result = await login('joao@test.com', '123456');

    expect(result.token).toBe('mock_token');
    expect(result.user.email).toBe('joao@test.com');
    expect(result.user).not.toHaveProperty('hash_pass');
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
