import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import integracoesRoutes from './modules/integracoes/integracoes.routes';
import campanhasRoutes from './modules/campanhas/campanhas.routes';
import criativosRoutes from './modules/criativos/criativos.routes';
import testesAbRoutes from './modules/testes-ab/testes-ab.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/integracoes', integracoesRoutes);
app.use('/campanhas', campanhasRoutes);
app.use('/upload', criativosRoutes);
app.use('/campanhas', criativosRoutes);
app.use('/campanhas/:campanhaId/testes-ab', testesAbRoutes);
app.use('/dashboard', dashboardRoutes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
}

export default app;
