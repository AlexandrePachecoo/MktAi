jest.mock('../../../lib/prisma', () => ({
  prisma: {
    campanha: { findUnique: jest.fn() },
    criativo: { findUnique: jest.fn() },
    testeAB: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

import { listarTestes, criarTeste, atualizarResultado } from '../testes-ab.service';
import { prisma } from '../../../lib/prisma';

const mockCampanhaFind = prisma.campanha.findUnique as jest.Mock;
const mockCriativoFind = prisma.criativo.findUnique as jest.Mock;
const mockTesteFind = prisma.testeAB.findUnique as jest.Mock;
const mockTesteCreate = prisma.testeAB.create as jest.Mock;
const mockTesteUpdate = prisma.testeAB.update as jest.Mock;
const mockTesteList = prisma.testeAB.findMany as jest.Mock;

const campanha = {
  id: 'camp-1',
  user_id: 'user-1',
};

const criativoA = { id: 'cria-a', campanha_id: 'camp-1' };
const criativoB = { id: 'cria-b', campanha_id: 'camp-1' };

beforeEach(() => jest.clearAllMocks());

describe('listarTestes', () => {
  it('retorna testes da campanha', async () => {
    mockCampanhaFind.mockResolvedValue(campanha);
    const testes = [{ id: 'teste-1', campanha_id: 'camp-1' }];
    mockTesteList.mockResolvedValue(testes);

    const result = await listarTestes('camp-1', 'user-1');

    expect(result).toEqual(testes);
  });

  it('lança FORBIDDEN quando usuário não é dono da campanha', async () => {
    mockCampanhaFind.mockResolvedValue({ ...campanha, user_id: 'outro-user' });

    await expect(listarTestes('camp-1', 'user-1')).rejects.toMatchObject({
      name: 'FORBIDDEN',
    });
  });
});

describe('criarTeste', () => {
  it('cria teste A/B quando todos os dados são válidos', async () => {
    mockCampanhaFind.mockResolvedValue(campanha);
    mockCriativoFind
      .mockResolvedValueOnce(criativoA)
      .mockResolvedValueOnce(criativoB);
    const teste = { id: 'teste-1', campanha_id: 'camp-1', criativo_id_a: 'cria-a', criativo_id_b: 'cria-b' };
    mockTesteCreate.mockResolvedValue(teste);

    const result = await criarTeste('camp-1', 'user-1', 'cria-a', 'cria-b');

    expect(mockTesteCreate).toHaveBeenCalled();
    expect(result.id).toBe('teste-1');
  });

  it('lança CRIATIVO_A_INVALIDO quando criativo A não existe', async () => {
    mockCampanhaFind.mockResolvedValue(campanha);
    mockCriativoFind
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(criativoB);

    await expect(criarTeste('camp-1', 'user-1', 'invalido', 'cria-b')).rejects.toMatchObject({
      name: 'CRIATIVO_A_INVALIDO',
    });
  });

  it('lança CRIATIVO_A_INVALIDO quando criativo A pertence a outra campanha', async () => {
    mockCampanhaFind.mockResolvedValue(campanha);
    mockCriativoFind
      .mockResolvedValueOnce({ id: 'cria-a', campanha_id: 'outra-campanha' })
      .mockResolvedValueOnce(criativoB);

    await expect(criarTeste('camp-1', 'user-1', 'cria-a', 'cria-b')).rejects.toMatchObject({
      name: 'CRIATIVO_A_INVALIDO',
    });
  });

  it('lança CRIATIVO_B_INVALIDO quando criativo B não existe', async () => {
    mockCampanhaFind.mockResolvedValue(campanha);
    mockCriativoFind
      .mockResolvedValueOnce(criativoA)
      .mockResolvedValueOnce(null);

    await expect(criarTeste('camp-1', 'user-1', 'cria-a', 'invalido')).rejects.toMatchObject({
      name: 'CRIATIVO_B_INVALIDO',
    });
  });

  it('lança CRIATIVOS_IGUAIS quando os dois criativos são o mesmo', async () => {
    mockCampanhaFind.mockResolvedValue(campanha);
    mockCriativoFind
      .mockResolvedValueOnce(criativoA)
      .mockResolvedValueOnce(criativoA);

    await expect(criarTeste('camp-1', 'user-1', 'cria-a', 'cria-a')).rejects.toMatchObject({
      name: 'CRIATIVOS_IGUAIS',
    });
  });
});

describe('atualizarResultado', () => {
  it('encerra teste com resultado', async () => {
    mockCampanhaFind.mockResolvedValue(campanha);
    const teste = { id: 'teste-1', campanha_id: 'camp-1' };
    mockTesteFind.mockResolvedValue(teste);
    const atualizado = { ...teste, resultado: 'Criativo A venceu', status: 'encerrado' };
    mockTesteUpdate.mockResolvedValue(atualizado);

    const result = await atualizarResultado('teste-1', 'camp-1', 'user-1', 'Criativo A venceu');

    expect(mockTesteUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'teste-1' },
        data: { resultado: 'Criativo A venceu', status: 'encerrado' },
      })
    );
    expect(result.resultado).toBe('Criativo A venceu');
  });

  it('lança NOT_FOUND quando teste não existe', async () => {
    mockCampanhaFind.mockResolvedValue(campanha);
    mockTesteFind.mockResolvedValue(null);

    await expect(atualizarResultado('inexistente', 'camp-1', 'user-1', 'Resultado')).rejects.toMatchObject({
      name: 'NOT_FOUND',
    });
  });

  it('lança NOT_FOUND quando teste pertence a outra campanha', async () => {
    mockCampanhaFind.mockResolvedValue(campanha);
    mockTesteFind.mockResolvedValue({ id: 'teste-1', campanha_id: 'outra-campanha' });

    await expect(atualizarResultado('teste-1', 'camp-1', 'user-1', 'Resultado')).rejects.toMatchObject({
      name: 'NOT_FOUND',
    });
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
