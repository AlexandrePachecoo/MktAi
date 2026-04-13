import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { NovaCampanhaPage } from '@/pages/NovaCampanhaPage';
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

vi.mock('@/contexts/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('@/contexts/AuthContext')>('@/contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: { id: '1', nome: 'João', email: 'joao@test.com', plano: 'free' },
      token: 'tok-123',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    }),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <NovaCampanhaPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

async function preencherFormulario() {
  await userEvent.type(screen.getByLabelText('Nome da campanha'), 'Campanha Verão');
  await userEvent.type(screen.getByPlaceholderText(/descreva o objetivo/i), 'Promoção de verão para aumentar vendas');
  await userEvent.type(screen.getByLabelText('Público-alvo'), 'Homens 25-40, tecnologia');
  await userEvent.type(screen.getByLabelText('Orçamento (R$)'), '1500');
}

describe('NovaCampanhaPage', () => {
  it('renderiza os campos do formulário', () => {
    renderPage();
    expect(screen.getByLabelText('Nome da campanha')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/descreva o objetivo/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Público-alvo')).toBeInTheDocument();
    expect(screen.getByLabelText('Orçamento (R$)')).toBeInTheDocument();
  });

  it('mostra erros de validação quando campos obrigatórios estão vazios', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /criar campanha/i }));

    expect(screen.getByText('Informe o nome da campanha')).toBeInTheDocument();
    expect(screen.getByText('Informe a descrição')).toBeInTheDocument();
    expect(screen.getByText('Informe o público-alvo')).toBeInTheDocument();
    expect(screen.getByText('Informe um orçamento válido')).toBeInTheDocument();
  });

  it('cria campanha e navega para /campanhas quando formulário é válido', async () => {
    mockPost.mockResolvedValue({ id: 'camp-1', nome: 'Campanha Verão' });
    renderPage();

    await preencherFormulario();
    await userEvent.click(screen.getByRole('button', { name: /criar campanha/i }));

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith(
      '/campanhas',
      expect.objectContaining({
        nome: 'Campanha Verão',
        publico_alvo: 'Homens 25-40, tecnologia',
        orcamento: 1500,
        plataforma: 'meta',
      })
    ));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/campanhas'));
  });

  it('exibe erro da API quando criação falha', async () => {
    mockPost.mockRejectedValue(new Error('Erro interno do servidor'));
    renderPage();

    await preencherFormulario();
    await userEvent.click(screen.getByRole('button', { name: /criar campanha/i }));

    await waitFor(() => expect(screen.getByText('Erro interno do servidor')).toBeInTheDocument());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('seleciona plataforma Google ao clicar no botão', async () => {
    mockPost.mockResolvedValue({ id: 'camp-1' });
    renderPage();

    // Clica no botão "Google" (exato, não "Meta + Google")
    const googleBtn = screen.getAllByRole('button').find(
      (b) => b.textContent?.trim() === 'GoogleSearch e Display'
    );
    await userEvent.click(googleBtn!);

    await preencherFormulario();
    await userEvent.click(screen.getByRole('button', { name: /criar campanha/i }));

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith(
      '/campanhas',
      expect.objectContaining({ plataforma: 'google' })
    ));
  });
});
