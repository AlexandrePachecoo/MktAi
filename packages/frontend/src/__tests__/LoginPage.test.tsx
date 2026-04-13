import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { AuthProvider } from '@/contexts/AuthContext';

vi.mock('@/lib/api', () => ({
  api: { post: vi.fn() },
}));

import { api } from '@/lib/api';
const mockPost = api.post as ReturnType<typeof vi.fn>;

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  it('renderiza o campo de e-mail e senha', () => {
    renderLoginPage();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });

  it('renderiza o botão de entrar', () => {
    renderLoginPage();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('navega para /dashboard após login bem-sucedido', async () => {
    mockPost.mockResolvedValue({
      token: 'tok-123',
      user: { id: '1', nome: 'João', email: 'joao@test.com', plano: 'free' },
    });

    renderLoginPage();

    await userEvent.type(screen.getByLabelText('E-mail'), 'joao@test.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'senha123');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'));
  });

  it('exibe mensagem de erro quando login falha', async () => {
    mockPost.mockRejectedValue(new Error('Credenciais inválidas'));

    renderLoginPage();

    await userEvent.type(screen.getByLabelText('E-mail'), 'joao@test.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'senha-errada');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('desabilita o botão enquanto o login está em andamento', async () => {
    mockPost.mockReturnValue(new Promise(() => {})); // pendente

    renderLoginPage();

    await userEvent.type(screen.getByLabelText('E-mail'), 'joao@test.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'senha123');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('possui link para a página de cadastro', () => {
    renderLoginPage();
    expect(screen.getByRole('link', { name: /criar conta/i })).toBeInTheDocument();
  });
});
