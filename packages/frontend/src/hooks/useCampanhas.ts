import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface Campanha {
  id: string;
  nome: string;
  descricao: string;
  objetivo: string | null;
  publico_alvo: string;
  orcamento: number;
  plataforma: 'meta' | 'google' | 'ambos';
  status: 'ativa' | 'pausada' | 'encerrada';
  estrategia: unknown | null;
  created_at: string;
}

export function useCampanhas() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<Campanha[]>('/campanhas');
      setCampanhas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { campanhas, loading, error, recarregar: carregar };
}
