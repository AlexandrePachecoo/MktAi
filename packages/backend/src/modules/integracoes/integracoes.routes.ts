import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from '../../middlewares/auth.middleware';
import {
  getMetaAuthUrl,
  handleMetaCallback,
  getGoogleAuthUrl,
  handleGoogleCallback,
  listarIntegracoes,
  desconectarIntegracao,
  salvarAccountId,
  buscarContasMeta,
  buscarContasGoogle,
} from './integracoes.service';

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

function userIdFromState(state: unknown): string | null {
  if (typeof state !== 'string') return null;
  try {
    const payload = jwt.verify(state, process.env.JWT_SECRET as string) as { userId: string };
    return payload.userId ?? null;
  } catch {
    return null;
  }
}

// ─── Listar integrações conectadas ────────────────────────────────────────────

router.get('/', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  try {
    const lista = await listarIntegracoes((req as AuthRequest).userId);
    res.json(lista);
  } catch {
    res.status(500).json({ error: 'Erro ao listar integrações' });
  }
});

// ─── Desconectar integração ───────────────────────────────────────────────────

router.delete('/:plataforma', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  const { plataforma } = req.params;
  if (!['meta', 'google'].includes(plataforma)) {
    res.status(400).json({ error: 'Plataforma inválida' });
    return;
  }
  try {
    await desconectarIntegracao((req as AuthRequest).userId, plataforma);
    res.json({ message: 'Integração removida' });
  } catch {
    res.status(500).json({ error: 'Erro ao remover integração' });
  }
});

// ─── Salvar account_id ────────────────────────────────────────────────────────

router.patch('/:plataforma/conta', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  const { plataforma } = req.params;
  const { account_id } = req.body;

  if (!['meta', 'google'].includes(plataforma)) {
    res.status(400).json({ error: 'Plataforma inválida' });
    return;
  }
  if (!account_id || typeof account_id !== 'string' || !account_id.trim()) {
    res.status(400).json({ error: 'account_id é obrigatório' });
    return;
  }

  try {
    await salvarAccountId((req as AuthRequest).userId, plataforma, account_id.trim());
    res.json({ message: 'Conta salva' });
  } catch {
    res.status(500).json({ error: 'Erro ao salvar conta' });
  }
});

// ─── Contas Meta disponíveis ──────────────────────────────────────────────────

router.get('/meta/contas', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  try {
    const contas = await buscarContasMeta((req as AuthRequest).userId);
    res.json(contas);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao buscar contas' });
  }
});

// ─── Contas Google disponíveis ────────────────────────────────────────────────

router.get('/google/contas', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  try {
    const contas = await buscarContasGoogle((req as AuthRequest).userId);
    res.json(contas);
  } catch (err: unknown) {
    console.error('[google/contas] Erro:', err);
    const msg = err instanceof Error ? err.message : 'Erro ao buscar contas';
    res.status(500).json({ error: msg });
  }
});

// ─── Meta ────────────────────────────────────────────────────────────────────

router.get('/meta', authMiddleware as any, (req: Request, res: Response) => {
  const token = (req.headers.authorization as string).slice(7);
  const url = getMetaAuthUrl(token);
  res.json({ url });
});

router.get('/meta/callback', async (req: Request, res: Response): Promise<void> => {
  const { code, error, state } = req.query;

  if (error || !code) {
    res.redirect(`${FRONTEND_URL}/integracoes?erro=meta`);
    return;
  }

  const userId = userIdFromState(state);
  if (!userId) {
    res.redirect(`${FRONTEND_URL}/integracoes?erro=meta`);
    return;
  }

  try {
    await handleMetaCallback(code as string, userId);
    res.redirect(`${FRONTEND_URL}/integracoes?conectado=meta`);
  } catch {
    res.redirect(`${FRONTEND_URL}/integracoes?erro=meta`);
  }
});

// ─── Google ───────────────────────────────────────────────────────────────────

router.get('/google', authMiddleware as any, (req: Request, res: Response) => {
  const token = (req.headers.authorization as string).slice(7);
  const url = getGoogleAuthUrl(token);
  res.json({ url });
});

router.get('/google/callback', async (req: Request, res: Response): Promise<void> => {
  const { code, error, state } = req.query;

  if (error || !code) {
    res.redirect(`${FRONTEND_URL}/integracoes?erro=google`);
    return;
  }

  const userId = userIdFromState(state);
  if (!userId) {
    res.redirect(`${FRONTEND_URL}/integracoes?erro=google`);
    return;
  }

  try {
    await handleGoogleCallback(code as string, userId);
    res.redirect(`${FRONTEND_URL}/integracoes?conectado=google`);
  } catch {
    res.redirect(`${FRONTEND_URL}/integracoes?erro=google`);
  }
});

export default router;
