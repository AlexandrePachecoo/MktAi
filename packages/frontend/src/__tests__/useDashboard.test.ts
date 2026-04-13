import { renderHook, waitFor } from '@testing-library/react';
import { useDashboard } from '@/hooks/useDashboard';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}));

import { api } from '@/lib/api';
const mockGet = api.get as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

const dashboardData = {
  campanha_id: 'camp-1',
  nome: 'Campanha Verão',
  status: 'ativa',
  plataforma: 'meta',
  meta: {
    plataforma: 'meta',
    impressoes: 5000,
    cliques: 200,
    gasto: 150.0,
    alcance: 4800,
    ctr: 4.0,
    cpc: 0.75,
  },
};

describe('useDashboard', () => {
  it('busca e retorna métricas pelo campanhaId', async () => {
    mockGet.mockResolvedValue(dashboardData);

    const { result } = renderHook(() => useDashboard('camp-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGet).toHaveBeenCalledWith('/dashboard/camp-1');
    expect(result.current.data).toEqual(dashboardData);
    expect(result.current.error).toBe('');
  });

  it('define loading como true durante o fetch', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useDashboard('camp-1'));
    expect(result.current.loading).toBe(true);
  });

  it('define error quando o fetch falha', async () => {
    mockGet.mockRejectedValue(new Error('Conta não configurada'));

    const { result } = renderHook(() => useDashboard('camp-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Conta não configurada');
    expect(result.current.data).toBeNull();
  });

  it('não faz requisição quando campanhaId é null', () => {
    renderHook(() => useDashboard(null));
    expect(mockGet).not.toHaveBeenCalled();
    expect(vi.mocked(api.get)).not.toHaveBeenCalled();
  });

  it('refaz o fetch quando campanhaId muda', async () => {
    mockGet.mockResolvedValue(dashboardData);

    const { result, rerender } = renderHook(
      ({ id }: { id: string | null }) => useDashboard(id),
      { initialProps: { id: 'camp-1' } }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGet).toHaveBeenCalledWith('/dashboard/camp-1');

    rerender({ id: 'camp-2' });

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/dashboard/camp-2'));
  });
});
