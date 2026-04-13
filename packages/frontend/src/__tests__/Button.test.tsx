import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renderiza o texto filho', () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
  });

  it('mostra "..." quando loading é true', () => {
    render(<Button loading>Salvar</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('...');
  });

  it('fica desabilitado quando loading é true', () => {
    render(<Button loading>Salvar</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('fica desabilitado quando disabled é true', () => {
    render(<Button disabled>Salvar</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('chama onClick ao clicar', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clique</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('não chama onClick quando desabilitado', async () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Clique</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('aplica type="submit" corretamente', () => {
    render(<Button type="submit">Enviar</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
