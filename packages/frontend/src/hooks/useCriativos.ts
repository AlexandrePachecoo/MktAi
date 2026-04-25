import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface Criativo {
  id: string;
  campanha_id: string;
  url_imagem: string;
  tipo: string;
  meta_ad_id: string | null;
  created_at: string;
}

export function useCriativos(campanhaId: string | undefined) {
  const [criativos, setCriativos] = useState<Criativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const carregar = useCallback(async () => {
    if (!campanhaId) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.get<Criativo[]>(`/campanhas/${campanhaId}/criativos`);
      setCriativos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar criativos');
    } finally {
      setLoading(false);
    }
  }, [campanhaId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { criativos, loading, error, recarregar: carregar };
}
