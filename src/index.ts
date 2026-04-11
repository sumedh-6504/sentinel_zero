import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { triggerScanHandler, triggerReviewHandler } from './modules/scans/scan.controller';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});

// Routes
app.post('/api/v1/scans/scan', triggerScanHandler);
app.post('/api/v1/scans/review', triggerReviewHandler);

// Catch-all 404
app.use((req, res) => {
    console.log(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});
