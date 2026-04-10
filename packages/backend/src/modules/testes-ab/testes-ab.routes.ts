import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middlewares/auth.middleware';
import { listarTestes, criarTeste, atualizarResultado } from './testes-ab.service';

const router = Router({ mergeParams: true });

router.use(authMiddleware as any);

// GET /campanhas/:id/testes-ab
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const testes = await listarTestes(req.params.campanhaId, (req as AuthRequest).userId);
    res.json(testes);
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

// POST /campanhas/:id/testes-ab
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { criativo_id_a, criativo_id_b } = req.body;

  if (!criativo_id_a || !criativo_id_b) {
    res.status(400).json({ error: 'criativo_id_a e criativo_id_b são obrigatórios' });
    return;
  }

  try {
    const teste = await criarTeste(
      req.params.campanhaId,
      (req as AuthRequest).userId,
      criativo_id_a,
      criativo_id_b
    );
    res.status(201).json(teste);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'NOT_FOUND') {
      res.status(404).json({ error: 'Campanha não encontrada' });
      return;
    }
    if (err instanceof Error && err.name === 'FORBIDDEN') {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }
    if (err instanceof Error && err.name === 'CRIATIVO_A_INVALIDO') {
      res.status(400).json({ error: 'Criativo A não pertence a essa campanha' });
      return;
    }
    if (err instanceof Error && err.name === 'CRIATIVO_B_INVALIDO') {
      res.status(400).json({ error: 'Criativo B não pertence a essa campanha' });
      return;
    }
    if (err instanceof Error && err.name === 'CRIATIVOS_IGUAIS') {
      res.status(400).json({ error: 'Os dois criativos não podem ser iguais' });
      return;
    }
    res.status(500).json({ error: 'Erro interno' });
  }
});

// PATCH /campanhas/:id/testes-ab/:testeId/resultado
router.patch('/:testeId/resultado', async (req: Request, res: Response): Promise<void> => {
  const { resultado } = req.body;

  if (!resultado) {
    res.status(400).json({ error: 'resultado é obrigatório' });
    return;
  }

  try {
    const teste = await atualizarResultado(
      req.params.testeId,
      req.params.campanhaId,
      (req as AuthRequest).userId,
      resultado
    );
    res.json(teste);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'NOT_FOUND') {
      res.status(404).json({ error: 'Teste não encontrado' });
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
