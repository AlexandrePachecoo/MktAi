import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { register, login } from './auth.service';

const router = Router();

const registerSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { nome, email, password } = parsed.data;
  try {
    const user = await register(nome, email, password);
    res.status(201).json(user);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'EMAIL_TAKEN') {
      res.status(400).json({ error: 'Email já cadastrado' });
      return;
    }
    console.error('[register error]', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { email, password } = parsed.data;
  try {
    const result = await login(email, password);
    res.status(200).json(result);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'USER_NOT_FOUND') {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }
    if (err instanceof Error && err.name === 'INVALID_PASSWORD') {
      res.status(401).json({ error: 'Senha inválida' });
      return;
    }
    console.error('[login error]', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
