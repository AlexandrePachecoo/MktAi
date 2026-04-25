import OpenAI from 'openai';
import { supabase } from '../../lib/supabase';
import { prisma } from '../../lib/prisma';
import { getLimites, planLimitError } from '../../lib/planos';

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const BUCKET = 'criativos';

interface Copy {
  titulo: string;
  texto: string;
}

interface Estrategia {
  copies?: Copy[];
}

function buildPrompt(
  campanha: {
    nome: string;
    descricao: string;
    objetivo: string | null;
    publico_alvo: string;
    plataforma: string;
  },
  copy?: Copy,
  extra?: string,
): string {
  const copyBlock = copy
    ? `\nAD COPY TO INCLUDE IN THE IMAGE:\nHeadline: "${copy.titulo}"\nBody: "${copy.texto}"`
    : '';
  const extraBlock = extra?.trim() ? `\nExtra instructions: ${extra.trim()}` : '';

  const platformLabel =
    campanha.plataforma === 'meta'
      ? 'Facebook/Instagram feed'
      : campanha.plataforma === 'google'
        ? 'Google Display'
        : 'social media feed';

  return `
Create a professional social media ad image (1:1 square format, 1024x1024).

BRAND: ${campanha.nome}
PRODUCT/SERVICE: ${campanha.descricao}
OBJECTIVE: ${campanha.objetivo || 'conversão'}
TARGET AUDIENCE: ${campanha.publico_alvo}
PLATFORM: ${platformLabel}
${copyBlock}

DESIGN REQUIREMENTS:
- High-end advertising agency quality
- Clean, modern layout with strong visual hierarchy
- Compelling hero image or graphic that represents the product/service
- Professional typography for the headline and body text (if provided above)
- Brand colors that feel premium and trustworthy
- Clear call-to-action area
- Optimized for ${platformLabel}

STYLE: Polished, professional ad creative — NOT a photo dump, NOT cluttered. Think top-tier agency output.
${extraBlock}
`.trim();
}

async function contarCriativosDoUsuario(userId: string): Promise<number> {
  const campanhas = await prisma.campanha.findMany({
    where: { user_id: userId },
    select: { id: true },
  });
  const campanhaIds = campanhas.map((c) => c.id);
  return prisma.criativo.count({ where: { campanha_id: { in: campanhaIds } } });
}

export async function gerarCriativoIA(
  campanhaId: string,
  userId: string,
  options: { copyIndex?: number; extra?: string },
) {
  const campanha = await prisma.campanha.findUnique({ where: { id: campanhaId } });

  if (!campanha) {
    const err = new Error('NOT_FOUND');
    err.name = 'NOT_FOUND';
    throw err;
  }
  if (campanha.user_id !== userId) {
    const err = new Error('FORBIDDEN');
    err.name = 'FORBIDDEN';
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const limites = getLimites(user!.plano, user!.admin);

  if (isFinite(limites.criativos)) {
    const total = await contarCriativosDoUsuario(userId);
    if (total >= limites.criativos) {
      throw planLimitError('criativos');
    }
  }

  const estrategia = campanha.estrategia as Estrategia | null;
  const copy =
    options.copyIndex != null ? estrategia?.copies?.[options.copyIndex] : undefined;

  const openai = getOpenAI();
  const generateRes = await openai.images.generate({
    model: 'chatgpt-image-latest',
    prompt: buildPrompt(campanha, copy, options.extra),
    quality: 'high',
    size: '1024x1024',
    n: 1,
  });

  const b64 = generateRes.data?.[0]?.b64_json;
  if (!b64) throw new Error('GPT Image não retornou imagem');
  const imageBuffer = Buffer.from(b64, 'base64');

  const path = `${userId}/ia-${Date.now()}.png`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, imageBuffer, { contentType: 'image/png', upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return prisma.criativo.create({
    data: { campanha_id: campanhaId, url_imagem: data.publicUrl, tipo: 'gerado_ia' },
  });
}

export async function uploadImagem(file: Express.Multer.File, userId: string): Promise<string> {
  const ext = file.originalname.split('.').pop();
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function associarCriativo(campanhaId: string, userId: string, url_imagem: string) {
  const campanha = await prisma.campanha.findUnique({ where: { id: campanhaId } });

  if (!campanha) {
    const err = new Error('NOT_FOUND');
    err.name = 'NOT_FOUND';
    throw err;
  }
  if (campanha.user_id !== userId) {
    const err = new Error('FORBIDDEN');
    err.name = 'FORBIDDEN';
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const limites = getLimites(user!.plano, user!.admin);

  if (isFinite(limites.criativos)) {
    const total = await contarCriativosDoUsuario(userId);
    if (total >= limites.criativos) {
      throw planLimitError('criativos');
    }
  }

  return prisma.criativo.create({
    data: { campanha_id: campanhaId, url_imagem, tipo: 'upload' },
  });
}

export async function listarCriativos(campanhaId: string, userId: string) {
  const campanha = await prisma.campanha.findUnique({ where: { id: campanhaId } });

  if (!campanha) {
    const err = new Error('NOT_FOUND');
    err.name = 'NOT_FOUND';
    throw err;
  }
  if (campanha.user_id !== userId) {
    const err = new Error('FORBIDDEN');
    err.name = 'FORBIDDEN';
    throw err;
  }

  return prisma.criativo.findMany({
    where: { campanha_id: campanhaId },
    orderBy: { created_at: 'desc' },
  });
}
