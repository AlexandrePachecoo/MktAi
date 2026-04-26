import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../../middlewares/auth.middleware';
import {
  listarCampanhas,
  criarCampanha,
  buscarCampanha,
  atualizarCampanha,
  deletarCampanha,
} from './campanhas.service';
import { gerarEstrategia } from './estrategia.service';

const criarCampanhaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  publico_alvo: z.string().min(1, 'Público-alvo é obrigatório'),
  orcamento: z.number({ invalid_type_error: 'Orçamento deve ser um número' }).positive('Orçamento deve ser positivo'),
  plataforma: z.string().min(1, 'Plataforma é obrigatória'),
});

const atualizarCampanhaSchema = criarCampanhaSchema.partial();

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
  const parsed = criarCampanhaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { nome, descricao, publico_alvo, orcamento, plataforma } = parsed.data;
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
  const parsed = atualizarCampanhaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  try {
    const campanha = await atualizarCampanha(req.params.id, (req as AuthRequest).userId, parsed.data);
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
