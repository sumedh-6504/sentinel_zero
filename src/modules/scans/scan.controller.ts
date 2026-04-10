import { Request, Response } from "express";
import { ScanService } from "./scan.service";

const scanService = new ScanService()

export const triggerScanHandler = async (req: Request, res: Response)=>{
    try{
        const job = await scanService.createScanJob(req.body)
        res.status(202).json(job)
    }catch(error: any){
        console.error("Scan Error: ", error)
        res.status(500).json({error: error.message})
    }
}