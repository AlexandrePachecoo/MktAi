import { authMiddleware, AuthRequest } from '../auth.middleware';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-secret';

function makeRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe('authMiddleware', () => {
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockNext = jest.fn();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  it('should return 401 if no authorization header', () => {
    const req = { headers: {} } as AuthRequest;
    const res = makeRes();

    authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid or expired', () => {
    const req = { headers: { authorization: 'Bearer invalid.token.here' } } as AuthRequest;
    const res = makeRes();

    authMiddleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() and attach userId to request with valid token', () => {
    const token = jwt.sign({ userId: 'uuid-1' }, JWT_SECRET, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = makeRes();

    authMiddleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(req.userId).toBe('uuid-1');
  });
});
