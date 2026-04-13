import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('renderiza o label quando fornecido', () => {
    render(<Input label="E-mail" />);
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
  });

  it('não renderiza label quando omitido', () => {
    render(<Input placeholder="Digite aqui" />);
    expect(screen.queryByRole('label')).not.toBeInTheDocument();
  });

  it('exibe mensagem de erro quando error é fornecido', () => {
    render(<Input label="Nome" error="Campo obrigatório" />);
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument();
  });

  it('exibe hint quando fornecido e não há erro', () => {
    render(<Input label="Orçamento" hint="Valor em reais" />);
    expect(screen.getByText('Valor em reais')).toBeInTheDocument();
  });

  it('não exibe hint quando há erro', () => {
    render(<Input label="Orçamento" hint="Valor em reais" error="Inválido" />);
    expect(screen.queryByText('Valor em reais')).not.toBeInTheDocument();
    expect(screen.getByText('Inválido')).toBeInTheDocument();
  });

  it('chama onChange ao digitar', async () => {
    const handleChange = vi.fn();
    render(<Input label="Nome" onChange={handleChange} />);
    await userEvent.type(screen.getByLabelText('Nome'), 'João');
    expect(handleChange).toHaveBeenCalled();
  });

  it('usa o id fornecido para associar label e input', () => {
    render(<Input label="Senha" id="senha-field" />);
    expect(screen.getByLabelText('Senha')).toHaveAttribute('id', 'senha-field');
  });
});
