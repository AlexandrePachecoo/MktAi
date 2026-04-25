export interface LimitesPlano {
  campanhas: number;
  criativos: number;
  copies: number;
}

export const LIMITES_POR_PLANO: Record<string, LimitesPlano> = {
  free: {
    campanhas: 2,
    criativos: 0,
    copies: 10,
  },
  basico: {
    campanhas: 5,
    criativos: 25,
    copies: Infinity,
  },
  pro: {
    campanhas: 10,
    criativos: 50,
    copies: Infinity,
  },
};

export function getLimites(plano: string, admin: boolean): LimitesPlano {
  if (admin) {
    return { campanhas: Infinity, criativos: Infinity, copies: Infinity };
  }
  return LIMITES_POR_PLANO[plano] ?? LIMITES_POR_PLANO.free;
}

export function planLimitError(campo: 'campanhas' | 'criativos' | 'copies'): Error {
  const err = new Error(`PLAN_LIMIT_${campo.toUpperCase()}`);
  err.name = 'PLAN_LIMIT';
  return err;
}
