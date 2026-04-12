import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { ScanService } from "./scan.service";
import { GithubService } from '../github/github.service';
import { supabase } from "../../db/supabase";

const scanService = new ScanService()
const githubService = new GithubService();

export const triggerScanHandler = async (req: AuthRequest, res: Response)=>{
    try{
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const job = await scanService.createScanJob(req.body, req.user.id)
        res.status(202).json(job)
    }catch(error: any){
        console.error("Scan Error: ", error)
        res.status(500).json({error: error.message})
    }
}

export const triggerReviewHandler = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const { vulnerability_id, decision, feedback } = req.body;
        const result = await scanService.submitHumanReview(vulnerability_id, decision, feedback, req.user.id);
        res.status(200).json(result);
    } catch (error: any) {
        console.error("Review Error: ", error);
        res.status(500).json({ error: error.message });
    }
}

export const deployPullRequestHandler = async (req: AuthRequest, res: Response) => {
    const vulnId = req.params.vulnId as string;
    
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const result = await scanService.deployPullRequest(vulnId, req.user.id);
        return res.status(200).json(result);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const listVulnerabilitiesHandler = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const data = await scanService.getAllVulnerabilities(req.user.id);
        res.status(200).json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getVulnerabilityHandler = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const id = req.params.id as string;
        const data = await scanService.getVulnerabilityById(id, req.user.id);
        res.status(200).json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getStatsHandler = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const data = await scanService.getStats(req.user.id);
        res.status(200).json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};