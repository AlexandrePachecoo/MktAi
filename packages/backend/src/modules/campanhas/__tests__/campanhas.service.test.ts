jest.mock('../../../lib/prisma', () => ({
  prisma: {
    campanha: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

import {
  listarCampanhas,
  criarCampanha,
  buscarCampanha,
  atualizarCampanha,
  deletarCampanha,
} from '../campanhas.service';
import { prisma } from '../../../lib/prisma';

const mockFindMany = prisma.campanha.findMany as jest.Mock;
const mockFindUnique = prisma.campanha.findUnique as jest.Mock;
const mockCreate = prisma.campanha.create as jest.Mock;
const mockUpdate = prisma.campanha.update as jest.Mock;
const mockDelete = prisma.campanha.delete as jest.Mock;

const campanha = {
  id: 'camp-1',
  user_id: 'user-1',
  nome: 'Campanha Verão',
  descricao: 'Desc',
  objetivo: 'conversao',
  publico_alvo: '18-35',
  orcamento: 1000,
  plataforma: 'meta',
  status: 'ativa',
  estrategia: null,
  created_at: new Date(),
};

beforeEach(() => jest.clearAllMocks());

describe('listarCampanhas', () => {
  it('retorna campanhas do usuário em ordem decrescente de criação', async () => {
    mockFindMany.mockResolvedValue([campanha]);

    const result = await listarCampanhas('user-1');

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { user_id: 'user-1' },
      orderBy: { created_at: 'desc' },
    });
    expect(result).toHaveLength(1);
    expect(result[0].nome).toBe('Campanha Verão');
  });

  it('retorna lista vazia quando usuário não tem campanhas', async () => {
    mockFindMany.mockResolvedValue([]);
    const result = await listarCampanhas('user-sem-campanhas');
    expect(result).toEqual([]);
  });
});

describe('criarCampanha', () => {
  it('cria campanha com os dados fornecidos', async () => {
    mockCreate.mockResolvedValue(campanha);

    const data = {
      nome: 'Campanha Verão',
      descricao: 'Desc',
      publico_alvo: '18-35',
      orcamento: 1000,
      plataforma: 'meta',
    };

    const result = await criarCampanha('user-1', data);

    expect(mockCreate).toHaveBeenCalledWith({
      data: { user_id: 'user-1', ...data },
    });
    expect(result.id).toBe('camp-1');
  });
});

describe('buscarCampanha', () => {
  it('retorna campanha quando id e userId batem', async () => {
    mockFindUnique.mockResolvedValue(campanha);

    const result = await buscarCampanha('camp-1', 'user-1');

    expect(result).toEqual(campanha);
  });

  it('lança NOT_FOUND quando campanha não existe', async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(buscarCampanha('inexistente', 'user-1')).rejects.toMatchObject({
      name: 'NOT_FOUND',
    });
  });

  it('lança FORBIDDEN quando campanha pertence a outro usuário', async () => {
    mockFindUnique.mockResolvedValue({ ...campanha, user_id: 'outro-user' });

    await expect(buscarCampanha('camp-1', 'user-1')).rejects.toMatchObject({
      name: 'FORBIDDEN',
    });
  });
});

describe('atualizarCampanha', () => {
  it('atualiza campanha quando usuário é o dono', async () => {
    mockFindUnique.mockResolvedValue(campanha);
    const atualizada = { ...campanha, nome: 'Campanha Inverno' };
    mockUpdate.mockResolvedValue(atualizada);

    const result = await atualizarCampanha('camp-1', 'user-1', { nome: 'Campanha Inverno' });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'camp-1' },
      data: { nome: 'Campanha Inverno' },
    });
    expect(result.nome).toBe('Campanha Inverno');
  });

  it('lança FORBIDDEN quando outro usuário tenta atualizar', async () => {
    mockFindUnique.mockResolvedValue({ ...campanha, user_id: 'outro-user' });

    await expect(atualizarCampanha('camp-1', 'user-1', { nome: 'Hack' })).rejects.toMatchObject({
      name: 'FORBIDDEN',
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe('deletarCampanha', () => {
  it('deleta campanha quando usuário é o dono', async () => {
    mockFindUnique.mockResolvedValue(campanha);
    mockDelete.mockResolvedValue(undefined);

    await deletarCampanha('camp-1', 'user-1');

    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'camp-1' } });
  });

  it('lança NOT_FOUND quando campanha não existe', async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(deletarCampanha('inexistente', 'user-1')).rejects.toMatchObject({
      name: 'NOT_FOUND',
    });
    expect(mockDelete).not.toHaveBeenCalled();
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
