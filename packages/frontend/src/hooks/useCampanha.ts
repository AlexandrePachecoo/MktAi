import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Campanha } from './useCampanhas';

export function useCampanha(id: string | undefined) {
  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const carregar = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.get<Campanha>(`/campanhas/${id}`);
      setCampanha(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar campanha');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { campanha, loading, error, recarregar: carregar };
}
