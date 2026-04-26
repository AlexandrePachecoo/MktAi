import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CampanhasPage } from '../pages/CampanhasPage';
import * as useCampanhasModule from '../hooks/useCampanhas';
import * as apiModule from '../lib/api';

const mockCampanha = {
  id: '1',
  nome: 'Campanha Teste',
  descricao: 'Descrição teste',
  objetivo: 'conversao',
  publico_alvo: 'Público teste',
  orcamento: 1000,
  plataforma: 'meta' as const,
  status: 'ativa' as const,
  estrategia: null,
  meta_campaign_id: null,
  meta_adset_id: null,
  google_campaign_id: null,
  created_at: '2024-01-01T00:00:00Z',
};

describe('CampanhasPage - Delete Button', () => {
  let mockRecarregar: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRecarregar = vi.fn();

    vi.spyOn(useCampanhasModule, 'useCampanhas').mockReturnValue({
      campanhas: [mockCampanha],
      loading: false,
      error: null,
      recarregar: mockRecarregar,
    });

    vi.spyOn(apiModule, 'api', 'get').mockReturnValue({
      delete: vi.fn().mockResolvedValue({}),
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render delete button for each campaign', () => {
    render(
      <BrowserRouter>
        <CampanhasPage />
      </BrowserRouter>
    );

    const deleteButton = screen.getByText('Excluir');
    expect(deleteButton).toBeInTheDocument();
  });

  it('should show confirmation dialog when delete button is clicked', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <BrowserRouter>
        <CampanhasPage />
      </BrowserRouter>
    );

    const deleteButton = screen.getByText('Excluir');
    deleteButton.click();

    expect(confirmSpy).toHaveBeenCalledWith(
      'Tem certeza que deseja excluir esta campanha? Essa ação não pode ser desfeita.'
    );
    confirmSpy.mockRestore();
  });

  it('should call api.delete and recarregar when user confirms deletion', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const deleteSpy = vi.fn().mockResolvedValue({});

    vi.spyOn(useCampanhasModule, 'useCampanhas').mockReturnValue({
      campanhas: [mockCampanha],
      loading: false,
      error: null,
      recarregar: mockRecarregar,
    });

    vi.spyOn(apiModule, 'api', 'get').mockReturnValue({
      delete: deleteSpy,
    } as any);

    render(
      <BrowserRouter>
        <CampanhasPage />
      </BrowserRouter>
    );

    const deleteButton = screen.getByText('Excluir');
    deleteButton.click();

    await waitFor(() => {
      expect(mockRecarregar).toHaveBeenCalled();
    });
  });

  it('should not delete if user cancels confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const deleteSpy = vi.fn();

    vi.spyOn(apiModule, 'api', 'get').mockReturnValue({
      delete: deleteSpy,
    } as any);

    render(
      <BrowserRouter>
        <CampanhasPage />
      </BrowserRouter>
    );

    const deleteButton = screen.getByText('Excluir');
    deleteButton.click();

    expect(deleteSpy).not.toHaveBeenCalled();
    expect(mockRecarregar).not.toHaveBeenCalled();
  });
});
