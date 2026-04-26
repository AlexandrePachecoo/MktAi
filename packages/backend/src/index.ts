import * as Sentry from '@sentry/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRoutes from './modules/auth/auth.routes';
import integracoesRoutes from './modules/integracoes/integracoes.routes';
import campanhasRoutes from './modules/campanhas/campanhas.routes';
import criativosRoutes from './modules/criativos/criativos.routes';
import testesAbRoutes from './modules/testes-ab/testes-ab.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import pagamentosRoutes from './modules/pagamentos/pagamentos.routes';
import './queue/optimization.worker';
import { iniciarScheduler } from './queue/optimization.scheduler';
import { prisma } from './lib/prisma';

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';

async function garantirAdmin() {
  try {
    await prisma.user.updateMany({
      where: { email: ADMIN_EMAIL },
      data: { admin: true, plano: 'pro' },
    });
  } catch {
    // Silencioso: tabela pode não existir ainda durante primeira migration
  }
}

const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL'] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[startup] Variável de ambiente obrigatória não definida: ${key}`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/integracoes', integracoesRoutes);
app.use('/api/campanhas', campanhasRoutes);
app.use('/api/upload', criativosRoutes);
app.use('/api/campanhas', criativosRoutes);
app.use('/api/campanhas/:campanhaId/testes-ab', testesAbRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/pagamentos', pagamentosRoutes);

Sentry.setupExpressErrorHandler(app);

app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const status = (err as { status?: number }).status ?? 500;
  const message = err instanceof Error ? err.message : 'Erro interno do servidor';
  res.status(status).json({ error: message });
});

if (require.main === module) {
  garantirAdmin().then(() => {
    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });
    iniciarScheduler();
  });
}

export default app;
