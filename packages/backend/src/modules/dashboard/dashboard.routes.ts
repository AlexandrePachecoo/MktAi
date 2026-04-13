import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middlewares/auth.middleware';
import { buscarDashboard } from './dashboard.service';

const router = Router();

router.use(authMiddleware as any);

// GET /dashboard/:campanha_id
router.get('/:campanhaId', async (req: Request, res: Response): Promise<void> => {
  try {
    const dados = await buscarDashboard(req.params.campanhaId, (req as AuthRequest).userId);
    res.json(dados);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'NOT_FOUND') {
      res.status(404).json({ error: 'Campanha não encontrada' });
      return;
    }
    if (err instanceof Error && err.name === 'FORBIDDEN') {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
