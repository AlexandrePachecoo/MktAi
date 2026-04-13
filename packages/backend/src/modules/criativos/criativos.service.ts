import { supabase } from '../../lib/supabase';
import { prisma } from '../../lib/prisma';

const BUCKET = 'criativos';

interface Copy {
  titulo: string;
  texto: string;
}

interface Estrategia {
  copies?: Copy[];
}

function buildPrompt(campanha: {
  nome: string;
  descricao: string;
  objetivo: string | null;
  publico_alvo: string;
  estrategia: unknown;
}, copy?: Copy, extra?: string): string {
  let prompt = `Crie uma imagem de anúncio digital profissional com as seguintes características:\n\n`;
  prompt += `PRODUTO/MARCA: ${campanha.nome}\n`;
  prompt += `DESCRIÇÃO: ${campanha.descricao}\n`;
  prompt += `OBJETIVO DA CAMPANHA: ${campanha.objetivo ?? 'conversão'}\n`;
  prompt += `PÚBLICO-ALVO: ${campanha.publico_alvo}\n`;

  if (copy) {
    prompt += `\nCOPY DO ANÚNCIO:\nTítulo: "${copy.titulo}"\nTexto: "${copy.texto}"\n`;
  }

  prompt += `\nESTILO VISUAL: composição limpa e moderna, tipografia bold, contraste alto, adequado para redes sociais, proporção quadrada 1:1.\n`;
  prompt += `REQUISITOS TÉCNICOS: sem texto sobreposto na imagem, foco no elemento visual principal, cores vibrantes e chamativas.`;

  if (extra?.trim()) {
    prompt += `\n\nOBSERVAÇÕES ADICIONAIS: ${extra.trim()}`;
  }

  return prompt;
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

  const estrategia = campanha.estrategia as Estrategia | null;
  const copy =
    options.copyIndex != null ? estrategia?.copies?.[options.copyIndex] : undefined;

  const prompt = buildPrompt(campanha, copy, options.extra);

  const apiKey = process.env.IDEOGRAM_API_KEY;
  if (!apiKey) throw new Error('IDEOGRAM_API_KEY não configurada');

  const ideogramRes = await fetch('https://api.ideogram.ai/generate', {
    method: 'POST',
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_request: {
        prompt,
        aspect_ratio: 'ASPECT_1_1',
        model: 'V_2',
        magic_prompt_option: 'AUTO',
      },
    }),
  });

  if (!ideogramRes.ok) {
    const body = await ideogramRes.text();
    throw new Error(`Ideogram API error: ${ideogramRes.status} — ${body}`);
  }

  const ideogramData = await ideogramRes.json() as { data: { url: string }[] };
  const imageUrl = ideogramData.data?.[0]?.url;
  if (!imageUrl) throw new Error('Ideogram não retornou URL de imagem');

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error('Falha ao baixar imagem do Ideogram');

  const buffer = Buffer.from(await imgRes.arrayBuffer());
  const path = `${userId}/ia-${Date.now()}.png`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: 'image/png', upsert: false });

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
