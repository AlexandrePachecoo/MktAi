import { render, screen } from '@testing-library/react';
import { Card } from '@/components/ui/Card';

describe('Card', () => {
  it('renderiza os filhos', () => {
    render(<Card>Conteúdo do card</Card>);
    expect(screen.getByText('Conteúdo do card')).toBeInTheDocument();
  });

  it('aplica padding padrão de 24px via atributo style', () => {
    render(<Card>Texto</Card>);
    const el = screen.getByText('Texto');
    expect(el.getAttribute('style')).toContain('padding: 24px');
  });

  it('aplica padding customizado quando fornecido', () => {
    render(<Card padding="12px">Texto</Card>);
    const el = screen.getByText('Texto');
    expect(el.getAttribute('style')).toContain('padding: 12px');
  });

  it('aplica estilos customizados via prop style', () => {
    render(<Card style={{ maxWidth: '400px' }}>Texto</Card>);
    const el = screen.getByText('Texto');
    expect(el.getAttribute('style')).toContain('max-width: 400px');
  });
});
