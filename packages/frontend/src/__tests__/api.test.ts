import { api } from '@/lib/api';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.clear();
});

describe('api.get', () => {
  it('faz GET com header Authorization quando há token', async () => {
    localStorage.setItem('faro_token', 'tok-123');
    mockFetch.mockReturnValue(mockResponse({ items: [] }));

    await api.get('/campanhas');

    expect(mockFetch).toHaveBeenCalledWith('/api/campanhas', expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({ Authorization: 'Bearer tok-123' }),
    }));
  });

  it('faz GET sem Authorization quando não há token', async () => {
    mockFetch.mockReturnValue(mockResponse({}));

    await api.get('/health');

    const [, options] = mockFetch.mock.calls[0];
    expect((options.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('retorna os dados da resposta', async () => {
    mockFetch.mockReturnValue(mockResponse({ id: '1', nome: 'Teste' }));

    const result = await api.get<{ id: string; nome: string }>('/campanhas/1');

    expect(result).toEqual({ id: '1', nome: 'Teste' });
  });

  it('lança erro com a mensagem da API quando resposta não é ok', async () => {
    mockFetch.mockReturnValue(mockResponse({ error: 'Não autorizado' }, false, 401));

    await expect(api.get('/campanhas')).rejects.toThrow('Não autorizado');
  });

  it('lança "Erro desconhecido" quando resposta de erro não tem campo error', async () => {
    mockFetch.mockReturnValue(mockResponse({}, false, 500));

    await expect(api.get('/campanhas')).rejects.toThrow('Erro desconhecido');
  });
});

describe('api.post', () => {
  it('faz POST com body JSON', async () => {
    mockFetch.mockReturnValue(mockResponse({ id: '1' }));

    await api.post('/campanhas', { nome: 'Campanha' });

    expect(mockFetch).toHaveBeenCalledWith('/api/campanhas', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ nome: 'Campanha' }),
    }));
  });
});

describe('api.put', () => {
  it('faz PUT com body JSON', async () => {
    mockFetch.mockReturnValue(mockResponse({ id: '1' }));

    await api.put('/campanhas/1', { nome: 'Atualizada' });

    expect(mockFetch).toHaveBeenCalledWith('/api/campanhas/1', expect.objectContaining({
      method: 'PUT',
    }));
  });
});

describe('api.delete', () => {
  it('faz DELETE na URL correta', async () => {
    mockFetch.mockReturnValue(mockResponse({}));

    await api.delete('/campanhas/1');

    expect(mockFetch).toHaveBeenCalledWith('/api/campanhas/1', expect.objectContaining({
      method: 'DELETE',
    }));
  });
});
