import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';

export async function register(nome: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const error = new Error('EMAIL_TAKEN');
    error.name = 'EMAIL_TAKEN';
    throw error;
  }

  const hash_pass = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { nome, email, hash_pass },
    select: { id: true, nome: true, email: true, plano: true, created_at: true },
  });

  return user;
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const error = new Error('USER_NOT_FOUND');
    error.name = 'USER_NOT_FOUND';
    throw error;
  }

  const valid = await bcrypt.compare(password, user.hash_pass);
  if (!valid) {
    const error = new Error('INVALID_PASSWORD');
    error.name = 'INVALID_PASSWORD';
    throw error;
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: { id: user.id, nome: user.nome, email: user.email, plano: user.plano },
  };
}

interface UpdateProfileInput {
  nome?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const error = new Error('USER_NOT_FOUND');
    error.name = 'USER_NOT_FOUND';
    throw error;
  }

  const data: { nome?: string; email?: string; hash_pass?: string } = {};

  if (input.nome && input.nome !== user.nome) {
    data.nome = input.nome;
  }

  if (input.email && input.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing && existing.id !== userId) {
      const error = new Error('EMAIL_TAKEN');
      error.name = 'EMAIL_TAKEN';
      throw error;
    }
    data.email = input.email;
  }

  if (input.newPassword) {
    const valid = await bcrypt.compare(input.currentPassword ?? '', user.hash_pass);
    if (!valid) {
      const error = new Error('INVALID_PASSWORD');
      error.name = 'INVALID_PASSWORD';
      throw error;
    }
    data.hash_pass = await bcrypt.hash(input.newPassword, 10);
  }

  if (Object.keys(data).length === 0) {
    return { id: user.id, nome: user.nome, email: user.email, plano: user.plano };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, nome: true, email: true, plano: true },
  });

  return updated;
}
