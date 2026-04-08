// TODO: Implementar quando o middleware de auth existir
// Arquivo: src/middlewares/auth.middleware.ts
// Exportar: authMiddleware, AuthRequest

// Exemplo de estrutura esperada do teste:
//
// import { authMiddleware, AuthRequest } from '../auth.middleware';
// import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';
//
// describe('authMiddleware', () => {
//   let mockReq: Partial<AuthRequest>;
//   let mockRes: Partial<Response>;
//   let mockNext: jest.MockedFunction<NextFunction>;
//
//   beforeEach(() => {
//     mockReq = { headers: {} };
//     mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
//     mockNext = jest.fn();
//   });
//
//   it('should return 401 if no authorization header', () => { ... });
//   it('should return 401 if token is invalid', () => { ... });
//   it('should call next() and set userId with valid token', () => { ... });
// });

describe('auth.middleware', () => {
  it.todo('return 401 if no authorization header');
  it.todo('return 401 if token is invalid or expired');
  it.todo('call next() and attach userId to request with valid token');
});
