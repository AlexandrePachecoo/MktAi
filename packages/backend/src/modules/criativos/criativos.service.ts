import OpenAI, { toFile } from 'openai';
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

const PLACEMENT_SIZES: Record<string, { width: string; height: string; description: string }> = {
  feed_instagram: { width: '1024', height: '1024', description: 'Instagram feed (square 1:1)' },
  stories: { width: '1024', height: '1792', description: 'Stories (portrait 9:16)' },
  reels: { width: '1024', height: '1792', description: 'Reels (portrait 9:16)' },
  feed_facebook: { width: '1024', height: '1024', description: 'Facebook feed (square 1:1)' },
};

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
  paletaCores?: string[],
  placement?: string,
  hasReferencia?: boolean,
): string {
  const copyBlock = copy
    ? `\nAD COPY TO INCLUDE IN THE IMAGE:\nHeadline: "${copy.titulo}"\nBody: "${copy.texto}"`
    : '';
  const extraBlock = extra?.trim() ? `\nExtra instructions: ${extra.trim()}` : '';

  const paletaBlock =
    paletaCores && paletaCores.length > 0
      ? `\nCOLOR PALETTE (mandatory):\nUse exclusively these colors as the dominant palette: ${paletaCores.join(', ')}\nApply them to backgrounds, typography, accents, shapes, and all visual elements.`
      : '';

  const placementInfo = placement && PLACEMENT_SIZES[placement];
  const dimensionsText = placementInfo
    ? `${placementInfo.width}x${placementInfo.height}`
    : '1024x1024';
  const formatDescription = placementInfo
    ? placementInfo.description
    : 'square format';

  const platformLabel =
    campanha.plataforma === 'meta'
      ? 'Facebook/Instagram feed'
      : campanha.plataforma === 'google'
        ? 'Google Display'
        : 'social media feed';

  if (hasReferencia) {
    const colorDirective =
      paletaCores && paletaCores.length > 0
        ? `Use the mandatory palette (${paletaCores.join(', ')}) as the dominant palette across all elements.`
        : `Pull colors from the logo for brand harmony, then extend with complementary accent tones that feel premium and emotionally resonant.`;

    const placementTip =
      placement === 'stories' || placement === 'reels'
        ? `For this Stories/Reels (9:16) format: place the strongest visual in the top two-thirds; reserve the bottom third for headline text and the logo.`
        : `For this Feed (1:1) format: use a rule-of-thirds or strong center composition, balancing the hero visual with the text zone and logo placement.`;

    return `
You are an art director at a top-tier creative agency tasked with producing a stunning social media ad.

REFERENCE IMAGE INSTRUCTION:
The image provided is the CLIENT'S BRAND LOGO. DO NOT treat it as a scene to edit or a background to keep.
Use the canvas to create a completely FRESH, DYNAMIC advertising composition — as if you were given a blank canvas with the logo as brand reference.
INTEGRATE the logo naturally into the scene: render it as an emblem on a person's chest/uniform, as a patch on their jacket, as a badge or insignia they wear, as branded vehicle/building signage visible in the environment, or as a prominent screen/sign within the scene. The logo must feel PART OF THE SCENE — not pasted on top, not isolated in a corner.

CAMPAIGN BRIEF:
Brand: ${campanha.nome}
Product/Service: ${campanha.descricao}
Objective: ${campanha.objetivo || 'conversão'}
Target Audience: ${campanha.publico_alvo}
Platform: ${platformLabel}
Format: ${formatDescription} (${dimensionsText})
${copyBlock}
${paletaBlock}

VISUAL DIRECTION — CREATE A BOLD, AGENCY-QUALITY AD:
1. HERO VISUAL: Dominate 60-70% of the canvas with a powerful, evocative hero image — a person in action, lifestyle scene, or dramatic product shot. The brand logo appears naturally ON or IN this hero (on their clothing, equipment, signage, etc.).
2. ATMOSPHERE: Use rich, immersive backgrounds — deep gradients, cinematic lighting, atmospheric depth, bokeh, dramatic shadows or glows. Make the viewer feel something. NOT flat colors, NOT plain white backgrounds.
3. TYPOGRAPHY HIERARCHY: If copy is provided above, render it with intent — a massive bold headline using modern sans-serif or expressive display type, body text in a clean readable weight beneath. Create tension between large and small.
4. NEGATIVE SPACE: Use deliberate empty space to guide the viewer's eye toward the key message and CTA.
5. BRAND INTEGRATION: The logo appears as a natural part of the environment or person — chest emblem, uniform patch, badge, vehicle decal, building sign, or illuminated signage. It should look like it was always there.
6. COLOR LANGUAGE: ${colorDirective}
7. COMPOSITION MOVEMENT: The eye enters at the hero visual, travels to the headline, lands on the body/CTA, and the logo reinforces the brand as part of the scene.

PLATFORM OPTIMIZATION: ${platformLabel}
${placementTip}

QUALITY BAR: This must look like a real ad that would stop a thumb mid-scroll. The logo must appear organically within the scene, the way a Nike swoosh appears on an athlete's jersey — integrated, not added. NOT a logo floating on a plain background. NOT corporate clip-art.
${extraBlock}
`.trim();
  }

  return `
Create a professional social media ad image (${formatDescription}, ${dimensionsText}).

BRAND: ${campanha.nome}
PRODUCT/SERVICE: ${campanha.descricao}
OBJECTIVE: ${campanha.objetivo || 'conversão'}
TARGET AUDIENCE: ${campanha.publico_alvo}
PLATFORM: ${platformLabel}
${copyBlock}
${paletaBlock}

DESIGN REQUIREMENTS:
- High-end advertising agency quality
- Clean, modern layout with strong visual hierarchy
- Compelling hero image or graphic that represents the product/service
- Professional typography for the headline and body text (if provided above)
- Brand colors that feel premium and trustworthy
- Clear call-to-action area
- Optimized for ${platformLabel}
- Optimized for ${formatDescription} (${dimensionsText} dimensions)

STYLE: Polished, professional ad creative — NOT a photo dump, NOT cluttered. Think top-tier agency output.
${extraBlock}
`.trim();
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Falha ao buscar imagem de referência: ${response.statusText}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
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
  options: { copyIndex?: number; extra?: string; paletaCores?: string[]; referenciaUrl?: string; placement?: string },
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
  const prompt = buildPrompt(campanha, copy, options.extra, options.paletaCores, options.placement, !!options.referenciaUrl);

  // Determinar tamanho da imagem baseado no placement
  const placementInfo = options.placement && PLACEMENT_SIZES[options.placement];
  const imageSizeValue = placementInfo
    ? (`${placementInfo.width}x${placementInfo.height}` as const)
    : ('1024x1024' as const);

  let b64: string | undefined;

  if (options.referenciaUrl) {
    const refBuffer = await fetchImageBuffer(options.referenciaUrl);
    const refFile = await toFile(refBuffer, 'referencia.png', { type: 'image/png' });
    const editRes = await openai.images.edit({
      model: 'gpt-image-1',
      image: refFile,
      prompt,
      size: '1024x1024',
      quality: 'high',
      n: 1,
    });
    b64 = editRes.data?.[0]?.b64_json;
  } else {
    const generateRes = await openai.images.generate({
      model: 'chatgpt-image-latest',
      prompt,
      quality: 'high',
      size: imageSizeValue as '1024x1024' | '1024x1792' | '1792x1024',
      n: 1,
    });
    b64 = generateRes.data?.[0]?.b64_json;
  }

  if (!b64) throw new Error('GPT Image não retornou imagem');
  const imageBuffer = Buffer.from(b64, 'base64');

  const path = `${userId}/ia-${Date.now()}.png`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, imageBuffer, { contentType: 'image/png', upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return prisma.criativo.create({
    data: { campanha_id: campanhaId, url_imagem: data.publicUrl, tipo: 'gerado_ia', placement: options.placement },
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
