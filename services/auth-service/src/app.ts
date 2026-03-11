import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errorMiddleware } from '@ride-sharing/shared';
import authRoutes from './routes/auth.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }));
app.use('/auth', authRoutes);
app.use(errorMiddleware);

export default app;
