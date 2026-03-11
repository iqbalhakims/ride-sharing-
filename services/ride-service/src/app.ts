import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { errorMiddleware } from '@ride-sharing/shared';
import rideRoutes from './routes/ride.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'ride-service' }));
app.use('/rides', rideRoutes);
app.use(errorMiddleware);

export default app;
