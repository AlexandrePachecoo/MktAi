import OpenAI from 'openai';
import sharp from 'sharp';
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


function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Quebra texto em linhas de no máximo `maxChars` caracteres por linha
function quebrarLinhas(texto: string, maxChars: number): string[] {
  const words = texto.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

type Zona = 'top' | 'middle' | 'bottom';

function sortearZona(): Zona {
  const zonas: Zona[] = ['top', 'middle', 'bottom'];
  return zonas[Math.floor(Math.random() * zonas.length)];
}

// Configuração de cada zona: onde começa o gradiente e onde começa o título
const ZONA_CONFIG: Record<Zona, {
  gradienteRatio: number; // y do gradiente como fração da altura
  gradY1: string; gradY2: string; // direção do gradiente SVG
  tituloRatio: number;   // y do título como fração da altura
}> = {
  // Faixa superior: gradiente de cima para baixo, texto em cima
  top: {
    gradienteRatio: 0,
    gradY1: '0', gradY2: '1',
    tituloRatio: 0.10,
  },
  // Faixa central: gradiente do centro expandindo, texto no meio
  middle: {
    gradienteRatio: 0.30,
    gradY1: '0', gradY2: '1',
    tituloRatio: 0.40,
  },
  // Faixa inferior: gradiente de baixo para cima, texto embaixo
  bottom: {
    gradienteRatio: 0.55,
    gradY1: '1', gradY2: '0',
    tituloRatio: 0.64,
  },
};

// Analisa o brilho médio da faixa onde o texto vai ser posicionado.
// Retorna cores de texto que contrastem bem com o fundo real da imagem.
async function escolherCoresTexto(
  buffer: Buffer,
  width: number,
  height: number,
  zona: Zona,
): Promise<{ titulo: string; corpo: string }> {
  const top = Math.round(height * ZONA_CONFIG[zona].gradienteRatio);
  const h   = Math.min(Math.round(height * 0.38), height - top);

  const stats = await sharp(buffer)
    .extract({ left: 0, top, width, height: h })
    .greyscale()
    .stats();

  const mean = stats.channels[0].mean; // 0 = preto, 255 = branco

  // Fundo escuro → texto branco; fundo claro → texto escuro
  if (mean < 100) {
    return { titulo: '#FFFFFF', corpo: 'rgba(255,255,255,0.88)' };
  } else if (mean < 160) {
    // Zona intermediária: amarelo-creme contrasta bem com fundos médios
    return { titulo: '#FFF9E6', corpo: 'rgba(255,249,230,0.88)' };
  } else {
    // Fundo claro: usa texto escuro para garantir legibilidade
    return { titulo: '#1A1A2E', corpo: 'rgba(26,26,46,0.88)' };
  }
}

// Compõe headline + copy sobre a imagem base usando sharp + SVG.
// A zona (top/middle/bottom) é sorteada a cada geração e alinhada com o prompt.
// A cor do texto é escolhida analisando o brilho real da faixa da imagem.
async function compositeTexto(baseBuffer: Buffer, copy: Copy, zona: Zona): Promise<Buffer> {
  const { width = 1080, height = 1080 } = await sharp(baseBuffer).metadata();

  const cfg = ZONA_CONFIG[zona];

  const gradienteTop = Math.round(height * cfg.gradienteRatio);
  const gradienteH   = zona === 'top'
    ? Math.round(height * 0.45)
    : zona === 'middle'
      ? Math.round(height * 0.40)
      : height - gradienteTop;

  const cores = await escolherCoresTexto(baseBuffer, width, height, zona);

  const linhasCopy  = quebrarLinhas(copy.texto,  Math.floor(width / 22)).slice(0, 3);
  const tituloLines = quebrarLinhas(copy.titulo, Math.floor(width / 30)).slice(0, 2);

  const tituloFontSize = Math.round(height * 0.055);
  const copyFontSize   = Math.round(height * 0.032);
  const pad            = Math.round(width  * 0.06);

  const tituloY    = Math.round(height * cfg.tituloRatio);
  const lineGap    = Math.round(tituloFontSize * 1.25);
  const copyStartY = tituloY + tituloLines.length * lineGap + Math.round(height * 0.018);
  const copyLineH  = Math.round(copyFontSize * 1.5);

  const tituloTspans = tituloLines
    .map((l, i) => `<tspan x="${pad}" dy="${i === 0 ? 0 : lineGap}">${escapeXml(l)}</tspan>`)
    .join('');

  const copyTspans = linhasCopy
    .map((l, i) => `<tspan x="${pad}" dy="${i === 0 ? 0 : copyLineH}">${escapeXml(l)}</tspan>`)
    .join('');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="${cfg.gradY1}" x2="0" y2="${cfg.gradY2}">
      <stop offset="0%"   stop-color="#000000" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect x="0" y="${gradienteTop}" width="${width}" height="${gradienteH}" fill="url(#g)"/>

  <text
    x="${pad}" y="${tituloY}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${tituloFontSize}"
    font-weight="bold"
    fill="${cores.titulo}"
  >${tituloTspans}</text>

  <text
    x="${pad}" y="${copyStartY}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${copyFontSize}"
    fill="${cores.corpo}"
  >${copyTspans}</text>
</svg>`.trim();

  return sharp(baseBuffer)
    .composite([{ input: Buffer.from(svg), blend: 'over' }])
    .png()
    .toBuffer();
}

// Instruções de layout por zona — diz ao Ideogram onde deixar o espaço limpo
const ZONA_PROMPT: Record<Zona, string> = {
  top: `
LAYOUT STRUCTURE:
- Clean square 1:1 format
- TOP 40% must be a flat, solid dark surface: deep navy, dark charcoal, or very dark brand color — completely flat and dark, NO visual elements
- ALL visual elements (product, icon, graphic) confined to the BOTTOM 60% of the image
- Think of the top area as a reserved text panel`,

  middle: `
LAYOUT STRUCTURE:
- Clean square 1:1 format
- MIDDLE BAND (from 30% to 70% of height) must be a flat, solid dark surface — completely flat and dark, NO visual elements
- Visual elements in the top 30% and bottom 30%, leaving the center clear
- Think of the middle band as a reserved text panel`,

  bottom: `
LAYOUT STRUCTURE:
- Clean square 1:1 format
- ALL visual elements (product, icon, graphic, brand mark) confined to the TOP 55% of the image
- BOTTOM 45% must be a flat, solid dark surface: deep navy, dark charcoal, or very dark brand color — completely flat and dark, NO visual elements
- Think of the bottom area as a reserved text panel`,
};

function buildPrompt(campanha: {
  nome: string;
  descricao: string;
  objetivo: string | null;
  publico_alvo: string;
}, zona: Zona, extra?: string): string {
  const extraBlock = extra?.trim() ? `\nDesign notes: ${extra.trim()}` : '';

  return `
Graphic design layout for a professional social media advertisement.
This is a DESIGNED AD CREATIVE — not a photo, not a scene, not an illustration.

BRAND: ${campanha.nome}
PRODUCT: ${campanha.descricao}
TARGET AUDIENCE: ${campanha.publico_alvo}
${ZONA_PROMPT[zona]}

DESIGN STYLE:
- Professional advertising layout, like a polished Facebook or Instagram feed ad
- Flat design or minimal graphic style — NOT photorealistic, NOT illustrated scene
- High contrast between the visual area and the dark reserved panel
- Generous whitespace in the visual area

CRITICAL: Absolutely NO text, letters, or words anywhere in the image.
The reserved dark panel must be clean and flat — it will receive a text overlay programmatically.
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

  // Sorteia a zona uma vez — usada no prompt E no composite
  const zona = sortearZona();

  // PASSO 1 — gera imagem base via GPT Image
  const openai = getOpenAI();
  const generateRes = await openai.images.generate({
    model: 'chatgpt-image-latest',
    prompt: buildPrompt(campanha, zona, options.extra),
    quality: 'high',
    size: '1024x1024',
    n: 1,
  });

  const b64 = generateRes.data?.[0]?.b64_json;
  if (!b64) throw new Error('GPT Image não retornou imagem');
  let imageBuffer: Buffer = Buffer.from(b64, 'base64');

  // PASSO 3 — se há copy, compõe texto por cima com sharp (sem chamar Ideogram /edit)
  if (copy) {
    imageBuffer = await compositeTexto(imageBuffer as Buffer, copy, zona);
  }

  // PASSO 4 — upload no Supabase
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
