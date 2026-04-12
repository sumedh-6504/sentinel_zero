import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { 
  triggerScanHandler, 
  triggerReviewHandler, 
  listVulnerabilitiesHandler, 
  getVulnerabilityHandler, 
  getStatsHandler 
} from './modules/scans/scan.controller';
import { ScanService } from './modules/scans/scan.service';

const scanService = new ScanService();
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
app.post('/api/v1/scans/deploy-pr/:vulnId', async (req, res) => {
  try {
    const result = await scanService.deployPullRequest(req.params.vulnId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// New Dashboard Routes
app.get('/api/v1/scans/vulnerabilities', listVulnerabilitiesHandler);
app.get('/api/v1/scans/vulnerabilities/:id', getVulnerabilityHandler);
app.get('/api/v1/scans/stats', getStatsHandler);

// Catch-all 404
app.use((req, res) => {
    console.log(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});
