import { prisma } from '../../lib/prisma';

async function verificarAcessoCampanha(campanhaId: string, userId: string) {
  const campanha = await prisma.campanha.findUnique({ where: { id: campanhaId } });
  if (!campanha) {
    const err = new Error('NOT_FOUND');
    err.name = 'NOT_FOUND';
    throw err;
  }
  if (campanha.user_id !== userId) {
    const err = new Error('FORBIDDEN');
    err.name = 'FORBIDDEN';
    throw err;
  }
  return campanha;
}

export async function listarTestes(campanhaId: string, userId: string) {
  await verificarAcessoCampanha(campanhaId, userId);
  return prisma.testeAB.findMany({
    where: { campanha_id: campanhaId },
    include: {
      criativo_a: true,
      criativo_b: true,
    },
  });
}

export async function criarTeste(
  campanhaId: string,
  userId: string,
  criativo_id_a: string,
  criativo_id_b: string
) {
  await verificarAcessoCampanha(campanhaId, userId);

  // valida que os dois criativos pertencem a essa campanha
  const [criaA, criaB] = await Promise.all([
    prisma.criativo.findUnique({ where: { id: criativo_id_a } }),
    prisma.criativo.findUnique({ where: { id: criativo_id_b } }),
  ]);

  if (!criaA || criaA.campanha_id !== campanhaId) {
    const err = new Error('CRIATIVO_A_INVALIDO');
    err.name = 'CRIATIVO_A_INVALIDO';
    throw err;
  }
  if (!criaB || criaB.campanha_id !== campanhaId) {
    const err = new Error('CRIATIVO_B_INVALIDO');
    err.name = 'CRIATIVO_B_INVALIDO';
    throw err;
  }
  if (criativo_id_a === criativo_id_b) {
    const err = new Error('CRIATIVOS_IGUAIS');
    err.name = 'CRIATIVOS_IGUAIS';
    throw err;
  }

  return prisma.testeAB.create({
    data: { campanha_id: campanhaId, criativo_id_a, criativo_id_b },
    include: { criativo_a: true, criativo_b: true },
  });
}

export async function atualizarResultado(
  testeId: string,
  campanhaId: string,
  userId: string,
  resultado: string
) {
  await verificarAcessoCampanha(campanhaId, userId);

  const teste = await prisma.testeAB.findUnique({ where: { id: testeId } });
  if (!teste || teste.campanha_id !== campanhaId) {
    const err = new Error('NOT_FOUND');
    err.name = 'NOT_FOUND';
    throw err;
  }

  return prisma.testeAB.update({
    where: { id: testeId },
    data: { resultado, status: 'encerrado' },
    include: { criativo_a: true, criativo_b: true },
  });
}
