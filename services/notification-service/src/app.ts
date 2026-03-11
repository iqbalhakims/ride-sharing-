import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { errorMiddleware } from '@ride-sharing/shared';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'notification-service' }));
app.use(errorMiddleware);

export default app;
