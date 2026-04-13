// TODO: Implementar quando o hook useCampanhas existir
// Arquivo: src/hooks/useCampanhas.ts
// Mock de fetch com msw (Mock Service Worker)

// Padrão esperado:
// import { renderHook, waitFor } from '@testing-library/react';
// import { http, HttpResponse } from 'msw';
// import { setupServer } from 'msw/node';
// import { useCampanhas } from '../hooks/useCampanhas';
//
// const server = setupServer(
//   http.get('/campanhas', () => HttpResponse.json([{ id: '1', nome: 'Campanha Teste' }]))
// );
//
// beforeAll(() => server.listen());
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());

describe('useCampanhas', () => {
  it.todo('should fetch and return list of campaigns');
  it.todo('should set loading to true while fetching');
  it.todo('should handle fetch error gracefully');
});
