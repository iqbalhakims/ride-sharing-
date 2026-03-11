import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { errorMiddleware } from '@ride-sharing/shared';
import paymentRoutes from './routes/payment.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'payment-service' }));
app.use('/payments', paymentRoutes);
app.use(errorMiddleware);

export default app;
