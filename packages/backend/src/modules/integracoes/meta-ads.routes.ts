import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middlewares/auth.middleware';
import {
  buscarPerfilMeta,
  listarPaginasMeta,
  listarCampanhasMeta,
  criarCampanhaMeta,
  atualizarCampanhaMeta,
  deletarCampanhaMeta,
  listarAdSetsMeta,
  criarAdSetMeta,
  atualizarAdSetMeta,
  listarCriativosMeta,
  criarCriativoMeta,
  listarAnunciosMeta,
  criarAnuncioMeta,
  atualizarAnuncioMeta,
  buscarInsightsMeta,
  listarFormulariosLeadsMeta,
  buscarLeadsMeta,
  criarFormularioLeadsMeta,
  buscarAppsAnunciadosMeta,
} from './meta-ads.service';

const router = Router();

function uid(req: Request): string {
  return (req as AuthRequest).userId;
}

// ─── Perfil / Pages ───────────────────────────────────────────────────────────

router.get('/perfil', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await buscarPerfilMeta(uid(req)));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro' });
  }
});

router.get('/paginas', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await listarPaginasMeta(uid(req)));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro' });
  }
});

// ─── Apps anunciados ──────────────────────────────────────────────────────────

router.get('/apps', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await buscarAppsAnunciadosMeta(uid(req)));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro' });
  }
});

// ─── Campanhas ────────────────────────────────────────────────────────────────

router.get('/campanhas', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await listarCampanhasMeta(uid(req)));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro' });
  }
});

router.post('/campanhas', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(201).json(await criarCampanhaMeta(uid(req), req.body));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro' });
  }
});

router.patch('/campanhas/:id', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await atualizarCampanhaMeta(uid(req), req.params.id, req.body));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro' });
  }
});

router.delete('/campanhas/:id', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await deletarCampanhaMeta(uid(req), req.params.id));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro' });
  }
});

// ─── Ad Sets ──────────────────────────────────────────────────────────────────

router.get('/adsets', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  const campaignId = req.query.campaign_id as string | undefined;
  try {
    res.json(await listarAdSetsMeta(uid(req), campaignId));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro' });
  }
});

router.post('/adsets', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(201).json(await criarAdSetMeta(uid(req), req.body));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro' });
  }
});

router.patch('/adsets/:id', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await atualizarAdSetMeta(uid(req), req.params.id, req.body));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro' });
  }
});

// ─── Criativos ────────────────────────────────────────────────────────────────

router.get('/criativos', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await listarCriativosMeta(uid(req)));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro' });
  }
});

router.post('/criativos', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(201).json(await criarCriativoMeta(uid(req), req.body));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro' });
  }
});

// ─── Anúncios ─────────────────────────────────────────────────────────────────

router.get('/anuncios', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  const adsetId = req.query.adset_id as string | undefined;
  try {
    res.json(await listarAnunciosMeta(uid(req), adsetId));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro' });
  }
});

router.post('/anuncios', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(201).json(await criarAnuncioMeta(uid(req), req.body));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro' });
  }
});

router.patch('/anuncios/:id', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await atualizarAnuncioMeta(uid(req), req.params.id, req.body));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro' });
  }
});

// ─── Insights ─────────────────────────────────────────────────────────────────

router.get('/insights', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  const { level, date_preset, since, until, fields, object_id } = req.query;
  try {
    res.json(
      await buscarInsightsMeta(uid(req), {
        level: (level as 'account' | 'campaign' | 'adset' | 'ad') ?? 'campaign',
        date_preset: (date_preset as string) ?? 'last_30d',
        time_range: since && until ? { since: since as string, until: until as string } : undefined,
        fields: fields ? (fields as string).split(',') : undefined,
        objectId: object_id as string | undefined,
      })
    );
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro' });
  }
});

// ─── Leads ────────────────────────────────────────────────────────────────────

router.get('/leads/formularios', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  const { page_id } = req.query;
  if (!page_id) {
    res.status(400).json({ error: 'page_id é obrigatório' });
    return;
  }
  try {
    res.json(await listarFormulariosLeadsMeta(uid(req), page_id as string));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro' });
  }
});

router.post('/leads/formularios', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  const { page_id, ...payload } = req.body;
  if (!page_id) {
    res.status(400).json({ error: 'page_id é obrigatório' });
    return;
  }
  try {
    res.status(201).json(await criarFormularioLeadsMeta(uid(req), page_id, payload));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro' });
  }
});

router.get('/leads/:formId', authMiddleware as any, async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await buscarLeadsMeta(uid(req), req.params.formId));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro' });
  }
});

export default router;
