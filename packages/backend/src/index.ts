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
import './queue/optimization.worker';
import { iniciarScheduler } from './queue/optimization.scheduler';

const app = express();
const PORT = process.env.PORT || 3000;

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

app.use('/auth', authLimiter, authRoutes);
app.use('/integracoes', integracoesRoutes);
app.use('/campanhas', campanhasRoutes);
app.use('/upload', criativosRoutes);
app.use('/campanhas', criativosRoutes);
app.use('/campanhas/:campanhaId/testes-ab', testesAbRoutes);
app.use('/dashboard', dashboardRoutes);

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
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
  iniciarScheduler();
}

export default app;
