import { prisma } from '../../lib/prisma';

export async function listarCampanhas(userId: string) {
  return prisma.campanha.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  });
}

export async function criarCampanha(
  userId: string,
  data: { nome: string; descricao: string; publico_alvo: string; orcamento: number; plataforma: string }
) {
  return prisma.campanha.create({
    data: { user_id: userId, ...data },
  });
}

export async function buscarCampanha(id: string, userId: string) {
  const campanha = await prisma.campanha.findUnique({ where: { id } });
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

export async function atualizarCampanha(
  id: string,
  userId: string,
  data: Partial<{ nome: string; descricao: string; publico_alvo: string; orcamento: number; plataforma: string; status: string }>
) {
  await buscarCampanha(id, userId);
  return prisma.campanha.update({ where: { id }, data });
}

export async function deletarCampanha(id: string, userId: string) {
  await buscarCampanha(id, userId);
  await prisma.campanha.delete({ where: { id } });
}
