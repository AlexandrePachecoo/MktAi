import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface PlanoDef {
  slug: string;
  nome: string;
  preco: number;
  precoFormatado: string;
  features: string[];
}

export function usePlanos() {
  const [planos, setPlanos] = useState<PlanoDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<PlanoDef[]>('/pagamentos/planos')
      .then(setPlanos)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar planos'))
      .finally(() => setLoading(false));
  }, []);

  async function assinar(plano: string, cpf: string, telefone: string): Promise<void> {
    const { url } = await api.post<{ url: string }>('/pagamentos/checkout', { plano, cpf, telefone });
    window.location.href = url;
  }

  return { planos, loading, error, assinar };
}
