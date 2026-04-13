import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface MetricasMeta {
  plataforma: 'meta';
  impressoes: number;
  cliques: number;
  gasto: number;
  alcance: number;
  ctr: number;
  cpc: number;
}

export interface MetricasGoogle {
  plataforma: 'google';
  impressoes: number;
  cliques: number;
  gasto: number;
  ctr: number;
  cpc: number;
}

export interface DashboardData {
  campanha_id: string;
  nome: string;
  status: string;
  plataforma: string;
  meta?: MetricasMeta | { erro: string };
  google?: MetricasGoogle | { erro: string };
}

export function useDashboard(campanhaId: string | null) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!campanhaId) return;

    setLoading(true);
    setError('');
    setData(null);

    api
      .get<DashboardData>(`/dashboard/${campanhaId}`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar métricas'))
      .finally(() => setLoading(false));
  }, [campanhaId]);

  return { data, loading, error };
}
