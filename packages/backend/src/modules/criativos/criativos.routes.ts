import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware, AuthRequest } from '../../middlewares/auth.middleware';
import { uploadImagem, associarCriativo, listarCriativos } from './criativos.service';

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
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
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
    res.status(500).json({ error: 'Erro interno' });
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
