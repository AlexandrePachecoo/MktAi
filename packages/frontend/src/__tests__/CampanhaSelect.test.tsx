import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CampanhaSelect } from '@/components/ui/CampanhaSelect';
import type { Campanha } from '@/hooks/useCampanhas';

const campanhas: Campanha[] = [
  {
    id: '1',
    nome: 'Campanha Verão',
    descricao: 'Desc',
    objetivo: 'conversao',
    publico_alvo: '18-35',
    orcamento: 1000,
    plataforma: 'meta',
    status: 'ativa',
    estrategia: null,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    nome: 'Campanha Inverno',
    descricao: 'Desc',
    objetivo: null,
    publico_alvo: '25-50',
    orcamento: 500,
    plataforma: 'google',
    status: 'pausada',
    estrategia: null,
    created_at: '2024-01-02T00:00:00Z',
  },
];

describe('CampanhaSelect', () => {
  it('mostra placeholder quando nenhum valor selecionado', () => {
    render(<CampanhaSelect campanhas={campanhas} value="" onChange={vi.fn()} />);
    expect(screen.getByText('Selecione uma campanha')).toBeInTheDocument();
  });

  it('mostra o nome da campanha selecionada', () => {
    render(<CampanhaSelect campanhas={campanhas} value="1" onChange={vi.fn()} />);
    expect(screen.getByText('Campanha Verão')).toBeInTheDocument();
  });

  it('abre o dropdown ao clicar no trigger', async () => {
    render(<CampanhaSelect campanhas={campanhas} value="" onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /selecione uma campanha/i }));
    expect(screen.getByText('Campanha Verão')).toBeInTheDocument();
    expect(screen.getByText('Campanha Inverno')).toBeInTheDocument();
  });

  it('chama onChange com o id correto ao selecionar opção', async () => {
    const handleChange = vi.fn();
    render(<CampanhaSelect campanhas={campanhas} value="" onChange={handleChange} />);
    await userEvent.click(screen.getByRole('button', { name: /selecione uma campanha/i }));
    const buttons = screen.getAllByRole('button');
    const optionBtn = buttons.find((b) => b.textContent?.includes('Campanha Inverno'));
    await userEvent.click(optionBtn!);
    expect(handleChange).toHaveBeenCalledWith('2');
  });

  it('mostra "Nenhuma campanha encontrada" quando lista está vazia', async () => {
    render(<CampanhaSelect campanhas={[]} value="" onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Nenhuma campanha encontrada.')).toBeInTheDocument();
  });

  it('fecha dropdown ao selecionar opção', async () => {
    render(<CampanhaSelect campanhas={campanhas} value="" onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /selecione uma campanha/i }));
    const buttons = screen.getAllByRole('button');
    const optionBtn = buttons.find((b) => b.textContent?.includes('Campanha Verão'));
    await userEvent.click(optionBtn!);
    expect(screen.queryByText('Campanha Inverno')).not.toBeInTheDocument();
  });
});
