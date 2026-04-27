import { LIMITES_POR_PLANO, getLimites, planLimitError } from '../planos';

describe('LIMITES_POR_PLANO', () => {
  it('define limites para o plano free', () => {
    expect(LIMITES_POR_PLANO.free).toEqual({
      campanhas: 2,
      criativos: 0,
      copies: 10,
    });
  });

  it('define limites para o plano basico com copies infinitas', () => {
    expect(LIMITES_POR_PLANO.basico.campanhas).toBe(5);
    expect(LIMITES_POR_PLANO.basico.criativos).toBe(25);
    expect(LIMITES_POR_PLANO.basico.copies).toBe(Infinity);
  });

  it('define limites maiores para o plano pro', () => {
    expect(LIMITES_POR_PLANO.pro.campanhas).toBe(10);
    expect(LIMITES_POR_PLANO.pro.criativos).toBe(50);
    expect(LIMITES_POR_PLANO.pro.copies).toBe(Infinity);
  });
});

describe('getLimites', () => {
  it('retorna limites infinitos quando usuário é admin', () => {
    const limites = getLimites('free', true);
    expect(limites).toEqual({
      campanhas: Infinity,
      criativos: Infinity,
      copies: Infinity,
    });
  });

  it('ignora plano quando admin é true', () => {
    const limites = getLimites('plano-inexistente', true);
    expect(limites.campanhas).toBe(Infinity);
  });

  it('retorna limites do plano free para usuário comum free', () => {
    expect(getLimites('free', false)).toEqual(LIMITES_POR_PLANO.free);
  });

  it('retorna limites do plano basico para usuário basico', () => {
    expect(getLimites('basico', false)).toEqual(LIMITES_POR_PLANO.basico);
  });

  it('retorna limites do plano pro para usuário pro', () => {
    expect(getLimites('pro', false)).toEqual(LIMITES_POR_PLANO.pro);
  });

  it('cai para plano free quando plano é desconhecido', () => {
    expect(getLimites('inexistente', false)).toEqual(LIMITES_POR_PLANO.free);
  });
});

describe('planLimitError', () => {
  it('cria erro com nome PLAN_LIMIT e mensagem por campo', () => {
    const err = planLimitError('campanhas');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('PLAN_LIMIT');
    expect(err.message).toBe('PLAN_LIMIT_CAMPANHAS');
  });

  it('cria erro de criativos', () => {
    expect(planLimitError('criativos').message).toBe('PLAN_LIMIT_CRIATIVOS');
  });

  it('cria erro de copies', () => {
    expect(planLimitError('copies').message).toBe('PLAN_LIMIT_COPIES');
  });
});
