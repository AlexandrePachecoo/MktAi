import { renderHook, waitFor } from '@testing-library/react';
import { useCampanha } from '@/hooks/useCampanha';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}));

import { api } from '@/lib/api';
const mockGet = api.get as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

const campanha = {
  id: 'camp-1',
  nome: 'Campanha Verão',
  descricao: 'Desc',
  objetivo: 'conversao',
  publico_alvo: '18-35',
  orcamento: 1000,
  plataforma: 'meta' as const,
  status: 'ativa' as const,
  estrategia: null,
  created_at: '2024-01-01T00:00:00Z',
};

describe('useCampanha', () => {
  it('busca e retorna a campanha pelo id', async () => {
    mockGet.mockResolvedValue(campanha);

    const { result } = renderHook(() => useCampanha('camp-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGet).toHaveBeenCalledWith('/campanhas/camp-1');
    expect(result.current.campanha).toEqual(campanha);
    expect(result.current.error).toBe('');
  });

  it('define loading como true durante o fetch', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useCampanha('camp-1'));
    expect(result.current.loading).toBe(true);
  });

  it('define error quando o fetch falha', async () => {
    mockGet.mockRejectedValue(new Error('Campanha não encontrada'));

    const { result } = renderHook(() => useCampanha('camp-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Campanha não encontrada');
    expect(result.current.campanha).toBeNull();
  });

  it('não faz requisição quando id é undefined', () => {
    renderHook(() => useCampanha(undefined));
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('recarregar chama o fetch novamente', async () => {
    mockGet.mockResolvedValue(campanha);

    const { result } = renderHook(() => useCampanha('camp-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGet).toHaveBeenCalledTimes(1);

    await waitFor(async () => {
      result.current.recarregar();
    });

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
  });
});
