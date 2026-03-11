import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { errorMiddleware } from '@ride-sharing/shared';
import driverRoutes from './routes/driver.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'driver-service' }));
app.use('/drivers', driverRoutes);
app.use(errorMiddleware);

export default app;
