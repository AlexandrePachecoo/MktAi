import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware, AuthRequest } from '../../middlewares/auth.middleware';
import { uploadImagem, associarCriativo, listarCriativos, gerarCriativoIA } from './criativos.service';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Apenas imagens são permitidas'));
      return;
    }
    cb(null, true);
  },
});

router.use(authMiddleware as any);

function planLimitMessage(message: string): string {
  if (message.includes('CRIATIVOS')) return 'Limite de criativos do seu plano atingido. Faça upgrade para adicionar mais criativos.';
  return 'Limite do plano atingido. Faça upgrade para continuar.';
}

// POST /upload — faz upload e retorna URL pública
router.post('/upload', upload.single('imagem'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'Nenhuma imagem enviada' });
    return;
  }

  try {
    const url = await uploadImagem(req.file, (req as AuthRequest).userId);
    res.status(201).json({ url });
  } catch (err: unknown) {
    console.error('[upload] Erro:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao fazer upload da imagem' });
  }
});

// POST /campanhas/:id/criativos — associa criativo à campanha
router.post('/:campanhaId/criativos', async (req: Request, res: Response): Promise<void> => {
  const { url_imagem } = req.body;
  if (!url_imagem) {
    res.status(400).json({ error: 'url_imagem é obrigatório' });
    return;
  }

  try {
    const criativo = await associarCriativo(req.params.campanhaId, (req as AuthRequest).userId, url_imagem);
    res.status(201).json(criativo);
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
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /campanhas/:id/criativos/gerar — gera criativo via IA
router.post('/:campanhaId/criativos/gerar', async (req: Request, res: Response): Promise<void> => {
  const { copy_index, extra, paleta_cores, referencia_url, placement } = req.body;

  try {
    const criativo = await gerarCriativoIA(req.params.campanhaId, (req as AuthRequest).userId, {
      copyIndex: typeof copy_index === 'number' ? copy_index : undefined,
      extra: typeof extra === 'string' ? extra : undefined,
      paletaCores: Array.isArray(paleta_cores) ? paleta_cores : undefined,
      referenciaUrl: typeof referencia_url === 'string' ? referencia_url : undefined,
      placement: typeof placement === 'string' ? placement : undefined,
    });
    res.status(201).json(criativo);
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
    console.error('[criativos/gerar] Erro:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao gerar criativo' });
  }
});

// GET /campanhas/:id/criativos — lista criativos da campanha
router.get('/:campanhaId/criativos', async (req: Request, res: Response): Promise<void> => {
  try {
    const criativos = await listarCriativos(req.params.campanhaId, (req as AuthRequest).userId);
    res.json(criativos);
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
