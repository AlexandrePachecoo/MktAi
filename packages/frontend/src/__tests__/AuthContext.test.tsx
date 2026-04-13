import { render, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

import { api } from '@/lib/api';
const mockApi = api as { post: ReturnType<typeof vi.fn> };

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

function TestConsumer({ onValue }: { onValue: (v: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth();
  onValue(auth);
  return null;
}

function renderWithAuth(onValue: (v: ReturnType<typeof useAuth>) => void) {
  render(
    <AuthProvider>
      <TestConsumer onValue={onValue} />
    </AuthProvider>
  );
}

describe('AuthContext', () => {
  it('inicia com user e token nulos quando localStorage está vazio', () => {
    let captured: ReturnType<typeof useAuth> | null = null;
    renderWithAuth((v) => { captured = v; });
    expect(captured!.user).toBeNull();
    expect(captured!.token).toBeNull();
  });

  it('inicia com user e token do localStorage quando existem', () => {
    const user = { id: '1', nome: 'João', email: 'joao@test.com', plano: 'free' };
    localStorage.setItem('faro_token', 'tok-abc');
    localStorage.setItem('faro_user', JSON.stringify(user));

    let captured: ReturnType<typeof useAuth> | null = null;
    renderWithAuth((v) => { captured = v; });
    expect(captured!.token).toBe('tok-abc');
    expect(captured!.user).toEqual(user);
  });

  it('login salva token e user no localStorage e no estado', async () => {
    const user = { id: '1', nome: 'João', email: 'joao@test.com', plano: 'free' };
    mockApi.post.mockResolvedValue({ token: 'tok-xyz', user });

    let captured: ReturnType<typeof useAuth> | null = null;
    renderWithAuth((v) => { captured = v; });

    await act(async () => {
      await captured!.login('joao@test.com', '123456');
    });

    expect(localStorage.getItem('faro_token')).toBe('tok-xyz');
    expect(JSON.parse(localStorage.getItem('faro_user')!)).toEqual(user);
    expect(captured!.token).toBe('tok-xyz');
    expect(captured!.user).toEqual(user);
  });

  it('logout limpa token e user do localStorage e do estado', async () => {
    const user = { id: '1', nome: 'João', email: 'joao@test.com', plano: 'free' };
    localStorage.setItem('faro_token', 'tok-abc');
    localStorage.setItem('faro_user', JSON.stringify(user));

    let captured: ReturnType<typeof useAuth> | null = null;
    renderWithAuth((v) => { captured = v; });

    act(() => { captured!.logout(); });

    expect(localStorage.getItem('faro_token')).toBeNull();
    expect(localStorage.getItem('faro_user')).toBeNull();
    expect(captured!.token).toBeNull();
    expect(captured!.user).toBeNull();
  });

  it('register chama api.post para register e depois login', async () => {
    const user = { id: '1', nome: 'Ana', email: 'ana@test.com', plano: 'free' };
    mockApi.post
      .mockResolvedValueOnce({}) // register
      .mockResolvedValueOnce({ token: 'tok-reg', user }); // login

    let captured: ReturnType<typeof useAuth> | null = null;
    renderWithAuth((v) => { captured = v; });

    await act(async () => {
      await captured!.register('Ana', 'ana@test.com', '123456');
    });

    expect(mockApi.post).toHaveBeenCalledWith('/auth/register', {
      nome: 'Ana',
      email: 'ana@test.com',
      password: '123456',
    });
    expect(captured!.token).toBe('tok-reg');
  });

  it('useAuth lança erro fora do AuthProvider', () => {
    // Suprime o erro esperado do console para não poluir a saída do teste
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      render(<TestConsumer onValue={() => {}} />);
    }).toThrow('useAuth must be used inside AuthProvider');
    spy.mockRestore();
  });
});
