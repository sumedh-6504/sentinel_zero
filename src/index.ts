import express, { Request, Response } from 'express';
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
import { verifySupabaseToken, AuthRequest } from './middleware/auth';

const scanService = new ScanService();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});

// New Dashboard Routes - All protected by Supabase Auth
app.use('/api/v1/scans', verifySupabaseToken);

app.post('/api/v1/scans/scan', triggerScanHandler as any);
app.post('/api/v1/scans/review', triggerReviewHandler as any);
app.get('/api/v1/scans/vulnerabilities', listVulnerabilitiesHandler as any);
app.get('/api/v1/scans/vulnerabilities/:id', getVulnerabilityHandler as any);
app.get('/api/v1/scans/stats', getStatsHandler as any);
app.post('/api/v1/scans/deploy-pr/:vulnId', async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });
    const result = await scanService.deployPullRequest(req.params.vulnId as string, authReq.user.id);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Catch-all 404
app.use((req, res) => {
    console.log(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});
