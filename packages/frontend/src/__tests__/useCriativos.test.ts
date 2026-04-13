import { renderHook, waitFor } from '@testing-library/react';
import { useCriativos } from '@/hooks/useCriativos';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}));

import { api } from '@/lib/api';
const mockGet = api.get as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

const criativos = [
  { id: 'c1', campanha_id: 'camp-1', url_imagem: 'https://img/1.png', tipo: 'upload', created_at: '2024-01-01T00:00:00Z' },
  { id: 'c2', campanha_id: 'camp-1', url_imagem: 'https://img/2.png', tipo: 'gerado_ia', created_at: '2024-01-02T00:00:00Z' },
];

describe('useCriativos', () => {
  it('busca e retorna a lista de criativos', async () => {
    mockGet.mockResolvedValue(criativos);

    const { result } = renderHook(() => useCriativos('camp-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGet).toHaveBeenCalledWith('/campanhas/camp-1/criativos');
    expect(result.current.criativos).toEqual(criativos);
    expect(result.current.error).toBe('');
  });

  it('define loading como true durante o fetch', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useCriativos('camp-1'));
    expect(result.current.loading).toBe(true);
  });

  it('define error quando o fetch falha', async () => {
    mockGet.mockRejectedValue(new Error('Erro ao carregar criativos'));

    const { result } = renderHook(() => useCriativos('camp-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Erro ao carregar criativos');
    expect(result.current.criativos).toEqual([]);
  });

  it('não faz requisição quando campanhaId é undefined', () => {
    renderHook(() => useCriativos(undefined));
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('recarregar chama o fetch novamente', async () => {
    mockGet.mockResolvedValue(criativos);

    const { result } = renderHook(() => useCriativos('camp-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await waitFor(async () => {
      result.current.recarregar();
    });

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
  });
});
