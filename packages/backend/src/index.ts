import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import integracoesRoutes from './modules/integracoes/integracoes.routes';
import campanhasRoutes from './modules/campanhas/campanhas.routes';
import criativosRoutes from './modules/criativos/criativos.routes';

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

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
}

export default app;
