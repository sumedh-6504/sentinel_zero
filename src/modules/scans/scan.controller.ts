import { Request, Response } from "express";
import { ScanService } from "./scan.service";
import { GithubService } from '../github/github.service';
import { supabase } from "../../db/supabase";

const scanService = new ScanService()
const githubService = new GithubService();

export const triggerScanHandler = async (req: Request, res: Response)=>{
    try{
        const job = await scanService.createScanJob(req.body)
        res.status(202).json(job)
    }catch(error: any){
        console.error("Scan Error: ", error)
        res.status(500).json({error: error.message})
    }
}

export const triggerReviewHandler = async (req: Request, res: Response) => {
    try {
        const { vulnerability_id, decision, feedback } = req.body;
        const result = await scanService.submitHumanReview(vulnerability_id, decision, feedback);
        res.status(200).json(result);
    } catch (error: any) {
        console.error("Review Error: ", error);
        res.status(500).json({ error: error.message });
    }
}

export const deployPullRequestHandler = async (req: Request, res: Response) => {
    const vulnId = req.params.vulnId as string;
    
    try {
        // 1. Fetch vuln data from Supabase
        const { data: vuln } = await supabase
            .from('vulnerabilities')
            .select('*, scan_jobs(repositories(*))')
            .eq('id', vulnId)
            .single();

        if (!vuln || vuln.status !== 'fix_ready') {
            return res.status(400).json({ error: "Fix not ready or not found." });
        }

        // 2. Execute PR Logic
        const result = await githubService.createFixPullRequest(
            vuln.scan_jobs.repositories.full_name.split('/')[0], // owner
            vuln.scan_jobs.repositories.full_name.split('/')[1], // repo
            vuln.file_path,
            vuln.suggested_fix,
            vulnId,
            vuln.description
        );

        return res.status(200).json({ success: true, pr_url: result });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const listVulnerabilitiesHandler = async (req: Request, res: Response) => {
    try {
        const data = await scanService.getAllVulnerabilities();
        res.status(200).json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getVulnerabilityHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const data = await scanService.getVulnerabilityById(id);
        res.status(200).json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getStatsHandler = async (req: Request, res: Response) => {
    try {
        const data = await scanService.getStats();
        res.status(200).json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};