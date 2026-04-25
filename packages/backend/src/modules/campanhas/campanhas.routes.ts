import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middlewares/auth.middleware';
import {
  listarCampanhas,
  criarCampanha,
  buscarCampanha,
  atualizarCampanha,
  deletarCampanha,
} from './campanhas.service';
import { gerarEstrategia } from './estrategia.service';

const router = Router();

router.use(authMiddleware as any);

function planLimitMessage(message: string): string {
  if (message.includes('CAMPANHAS')) return 'Limite de campanhas do seu plano atingido. Faça upgrade para criar mais campanhas.';
  if (message.includes('COPIES')) return 'Limite de copies do seu plano atingido. Faça upgrade para gerar mais copies.';
  if (message.includes('CRIATIVOS')) return 'Limite de criativos do seu plano atingido. Faça upgrade para gerar mais criativos.';
  return 'Limite do plano atingido. Faça upgrade para continuar.';
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const campanhas = await listarCampanhas((req as AuthRequest).userId);
  res.json(campanhas);
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { nome, descricao, publico_alvo, orcamento, plataforma } = req.body;
  if (!nome || !descricao || !publico_alvo || !orcamento || !plataforma) {
    res.status(400).json({ error: 'nome, descricao, publico_alvo, orcamento e plataforma são obrigatórios' });
    return;
  }

  try {
    const campanha = await criarCampanha((req as AuthRequest).userId, {
      nome, descricao, publico_alvo, orcamento, plataforma,
    });
    res.status(201).json(campanha);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'PLAN_LIMIT') {
      res.status(403).json({ error: planLimitMessage(err.message), code: 'PLAN_LIMIT' });
      return;
    }
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const campanha = await buscarCampanha(req.params.id, (req as AuthRequest).userId);
    res.json(campanha);
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

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const campanha = await atualizarCampanha(req.params.id, (req as AuthRequest).userId, req.body);
    res.json(campanha);
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

router.post('/:id/estrategia', async (req: Request, res: Response): Promise<void> => {
  try {
    const estrategia = await gerarEstrategia(req.params.id, (req as AuthRequest).userId);
    res.json(estrategia);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'NOT_FOUND') {
      res.status(404).json({ error: 'Campanha não encontrada' });
      return;
    }
    if (err instanceof Error && err.name === 'FORBIDDEN') {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }
    if (err instanceof Error && err.name === 'PLAN_LIMIT') {
      res.status(403).json({ error: planLimitMessage(err.message), code: 'PLAN_LIMIT' });
      return;
    }
    res.status(500).json({ error: 'Erro ao gerar estratégia' });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await deletarCampanha(req.params.id, (req as AuthRequest).userId);
    res.status(204).send();
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
