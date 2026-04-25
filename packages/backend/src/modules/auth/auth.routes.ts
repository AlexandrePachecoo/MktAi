import { Router, Request, Response } from 'express';
import { register, login } from './auth.service';

const router = Router();

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { nome, email, password } = req.body;
  if (!nome || !email || !password) {
    res.status(400).json({ error: 'nome, email e password são obrigatórios' });
    return;
  }

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
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'email e password são obrigatórios' });
    return;
  }

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
