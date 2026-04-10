import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middlewares/auth.middleware';
import {
  getMetaAuthUrl,
  handleMetaCallback,
  getGoogleAuthUrl,
  handleGoogleCallback,
} from './integracoes.service';

const router = Router();

// ─── Meta ────────────────────────────────────────────────────────────────────

router.get('/meta', authMiddleware as any, (req: Request, res: Response) => {
  const url = getMetaAuthUrl();
  res.redirect(url);
});

router.get('/meta/callback', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  const { code, error } = req.query;

  if (error || !code) {
    res.status(400).json({ error: 'Autorização negada pelo Meta' });
    return;
  }

  try {
    await handleMetaCallback(code as string, (req as AuthRequest).userId);
    res.json({ message: 'Meta Ads conectado com sucesso' });
  } catch {
    res.status(500).json({ error: 'Erro ao conectar com Meta Ads' });
  }
});

// ─── Google ───────────────────────────────────────────────────────────────────

router.get('/google', authMiddleware as any, (req: Request, res: Response) => {
  const url = getGoogleAuthUrl();
  res.redirect(url);
});

router.get('/google/callback', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  const { code, error } = req.query;

  if (error || !code) {
    res.status(400).json({ error: 'Autorização negada pelo Google' });
    return;
  }

  try {
    await handleGoogleCallback(code as string, (req as AuthRequest).userId);
    res.json({ message: 'Google Ads conectado com sucesso' });
  } catch {
    res.status(500).json({ error: 'Erro ao conectar com Google Ads' });
  }
});

export default router;
