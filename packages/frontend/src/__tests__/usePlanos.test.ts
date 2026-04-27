import { renderHook, waitFor, act } from '@testing-library/react';
import { usePlanos } from '@/hooks/usePlanos';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

import { api } from '@/lib/api';

const mockGet = api.get as ReturnType<typeof vi.fn>;
const mockPost = api.post as ReturnType<typeof vi.fn>;

const planos = [
  { slug: 'free', nome: 'Free', preco: 0, precoFormatado: 'Grátis', features: [] },
  { slug: 'pro', nome: 'Pro', preco: 6890, precoFormatado: 'R$ 68,90/mês', features: [] },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('usePlanos', () => {
  it('busca a lista de planos no mount', async () => {
    mockGet.mockResolvedValue(planos);

    const { result } = renderHook(() => usePlanos());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGet).toHaveBeenCalledWith('/pagamentos/planos');
    expect(result.current.planos).toEqual(planos);
    expect(result.current.error).toBe('');
  });

  it('preenche error quando o fetch falha', async () => {
    mockGet.mockRejectedValue(new Error('Falha de rede'));

    const { result } = renderHook(() => usePlanos());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Falha de rede');
    expect(result.current.planos).toEqual([]);
  });

  it('assinar redireciona para a URL de checkout', async () => {
    mockGet.mockResolvedValue(planos);
    mockPost.mockResolvedValue({ url: 'https://checkout.example/abc' });

    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { href: '' },
    });

    const { result } = renderHook(() => usePlanos());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.assinar('pro');
    });

    expect(mockPost).toHaveBeenCalledWith('/pagamentos/checkout', { plano: 'pro' });
    expect(window.location.href).toBe('https://checkout.example/abc');

    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  it('propaga erro quando assinar falha', async () => {
    mockGet.mockResolvedValue(planos);
    mockPost.mockRejectedValue(new Error('Pagamento indisponível'));

    const { result } = renderHook(() => usePlanos());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(result.current.assinar('pro')).rejects.toThrow('Pagamento indisponível');
  });
});
