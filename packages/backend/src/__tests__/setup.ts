// Carrega variáveis de ambiente de teste
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL || '';
