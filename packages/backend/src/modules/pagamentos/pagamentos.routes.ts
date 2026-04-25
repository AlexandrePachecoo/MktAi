import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middlewares/auth.middleware';
import { listarPlanos, criarCheckout, processarWebhook } from './pagamentos.service';

const router = Router();

router.get('/planos', (_req, res) => {
  res.json(listarPlanos());
});

router.post('/checkout', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  const { plano } = req.body;
  if (!plano || typeof plano !== 'string') {
    res.status(400).json({ error: 'plano é obrigatório' });
    return;
  }

  try {
    const url = await criarCheckout((req as AuthRequest).userId, plano);
    res.json({ url });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Erro ao criar checkout' });
  }
});

router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  const secret = process.env.ABACATEPAY_WEBHOOK_SECRET;
  if (secret) {
    const token =
      (req.headers['x-webhook-token'] as string) ??
      (req.headers['x-abacatepay-token'] as string) ??
      (req.query.token as string);
    if (token !== secret) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  }

  try {
    await processarWebhook(req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error('[pagamentos/webhook]', err);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

export default router;
