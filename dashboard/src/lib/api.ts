import { createClient } from "@/utils/supabase/client";
import axios from "axios"

const API_BASE_URL = "http://localhost:3001/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptor to inject Supabase JWT
api.interceptors.request.use(async (config) => {
  try {
    const supabase = createClient();
    
    // Use getUser() instead of getSession() for more reliability in the interceptor
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    } else {
      // If no session, the backend will return 401, which is handled by the UI
      console.warn("Axios interceptor: No active session found for request", config.url);
    }
  } catch (err) {
    console.error("Error in Axios interceptor:", err);
  }
  
  return config;
});

export interface StatSummary {
  total_vulnerabilities: number;
  critical: number;
  high: number;
  fixed: number;
  repositories: number;
}

export interface Vulnerability {
  id: string;
  job_id: string;
  file_path: string;
  issue_type: string;
  severity: string;
  description: string;
  suggested_fix: string;
  status: string;
  human_review_status: string;
  trace_url?: string | null;
  created_at: string;
  scan_jobs?: {
    repositories: {
      full_name: string;
    };
  };
}

export const SentinelClient = {
  getStats: async (): Promise<StatSummary> => {
    const { data } = await api.get("/scans/stats");
    return data;
  },

  listVulnerabilities: async (): Promise<Vulnerability[]> => {
    const { data } = await api.get("/scans/vulnerabilities");
    return data;
  },

  getVulnerability: async (id: string): Promise<Vulnerability> => {
    const { data } = await api.get(`/scans/vulnerabilities/${id}`);
    return data;
  },

  triggerScan: async (githubUrl: string, fullName: string) => {
    const { data } = await api.post("/scans/scan", { github_url: githubUrl, full_name: fullName });
    return data;
  },

  submitReview: async (id: string, decision: string, feedback: string = "") => {
    const { data } = await api.post("/scans/review", { 
      vulnerability_id: id, 
      decision, 
      feedback 
    });
    return data;
  },

  deployPR: async (vulnId: string) => {
    const { data } = await api.post(`/scans/deploy-pr/${vulnId}`);
    return data;
  }
};
