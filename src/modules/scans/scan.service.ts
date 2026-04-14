import { supabase } from '../../db/supabase';
import { GithubService } from '../github/github.service';

export class ScanService {
  async createScanJob(data: { github_url: string; full_name: string }, userId: string) {
    // 1. Get or Create Repository
    const { data: repo, error: repoError } = await supabase
      .from('repositories')
      .upsert(
        { 
          full_name: data.full_name, 
          github_id: data.github_url 
        }, 
        { onConflict: 'github_id' } // Use github_id to resolve conflicts
      )
      .select()
      .single();

    if (repoError) {
        throw new Error(`Repository upsert failed: ${repoError.message}`);
    }

    // 2. Create Scan Job
    const { data: job, error: jobError } = await supabase
      .from('scan_jobs')
      .insert({ 
        repo_id: repo.id, 
        status: 'queued',
        user_id: userId,
        trace_url: `https://smith.langchain.com/o/default/projects/p/sentinel-zero?tab=traces`
      })
      .select()
      .single();

    if (jobError) {
        throw new Error(`Job creation failed: ${jobError.message}`);
    }

    // 3. TRIGGER MODAL (The Bridge)
    const MODAL_WEBHOOK_URL = "https://jb23cs163--sentinel-zero-worker-trigger-scan-webhook.modal.run";

    console.log(`🚀 Dispatching Job ${job.id} to Modal...`);

    // Non-blocking fetch
    fetch(MODAL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repo_url: data.github_url,
        job_id: job.id
      })
    }).catch(err => console.error("❌ Modal Trigger Failed:", err));

    return job;
  }

  async submitHumanReview(vuln_id: string, decision: 'approved_real_bug' | 'rejected_false_positive', feedback: string = "", userId: string) {
    // 1. Verify ownership
    const { data: vuln, error: checkError } = await supabase
      .from('vulnerabilities')
      .select('id, scan_jobs!inner(user_id)')
      .eq('id', vuln_id)
      .eq('scan_jobs.user_id', userId)
      .single();

    if (checkError || !vuln) throw new Error("Vulnerability not found or access denied.");

    // 2. Update the database
    const { data, error } = await supabase
      .from('vulnerabilities')
      .update({ 
        human_review_status: decision,
        human_feedback: feedback,
        status: decision === 'rejected_false_positive' ? 'closed' : 'fixing',
        trace_url: decision === 'approved_real_bug' ? `https://smith.langchain.com/o/default/projects/p/sentinel-zero?tab=traces` : null
      })
      .eq('id', vuln_id)
      .select()
      .single();

    if (error) throw error;

    // 2. If approved, trigger Modal Phase 2 (The Fixer)
    if (decision === 'approved_real_bug') {
      const MODAL_FIX_WEBHOOK = "https://jb23cs163--sentinel-zero-worker-trigger-fix-webhook.modal.run";
      
      console.log(`🚀 Human Approved! Dispatching Fixer Agent for Vuln ${vuln_id}...`);
      
      fetch(MODAL_FIX_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vulnerability_id: vuln_id })
      }).catch(err => console.error("❌ Modal Fix Trigger Failed:", err));
    }

    return data;
  }

  async deployPullRequest(vulnId: string, userId: string) {
    // 1. Get the Vulnerability and Repo details from Supabase with ownership check
    const { data: vuln, error } = await supabase
      .from('vulnerabilities')
      .select('*, scan_jobs!inner(user_id, repositories(*))')
      .eq('id', vulnId)
      .eq('scan_jobs.user_id', userId)
      .single();

    if (error || !vuln) throw new Error("Vulnerability not found");
    if (vuln.status !== 'fix_ready') throw new Error("Fix is not ready yet.");

    // Parse the repo full name (e.g., "fastapi/fastapi" -> owner="fastapi", repo="fastapi")
    const fullName = vuln.scan_jobs.repositories.full_name;
    const [owner, repo] = fullName.split('/');

    // Clean the file path (Modal prefix /repos/repo_name/ must be stripped)
    const relativeFilePath = vuln.file_path.replace(/^\/repos\/[^\/]+\//, '');

    // 2. Initialize GitHub Service and deploy!
    const githubService = new GithubService();
    console.log(`🚀 Opening PR on ${fullName}...`);
    
    const prUrl = await githubService.createFixPullRequest(
      owner,
      repo,
      relativeFilePath,
      vuln.suggested_fix,
      vulnId,
      vuln.description
    );

    // 3. Update DB with the success
    await supabase.from('vulnerabilities').update({
      status: 'pr_opened',
      github_issue_url: prUrl
    }).eq('id', vulnId);

    return { success: true, pr_url: prUrl };
  }

  async getAllVulnerabilities(userId: string) {
    const { data, error } = await supabase
      .from('vulnerabilities')
      .select('*, scan_jobs!inner(repositories(*))')
      .eq('scan_jobs.user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getVulnerabilityById(id: string, userId: string) {
    const { data, error } = await supabase
      .from('vulnerabilities')
      .select('*, scan_jobs!inner(repositories(*))')
      .eq('id', id)
      .eq('scan_jobs.user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async getStats(userId: string) {
    const { data: vulns, error: vError } = await supabase
      .from('vulnerabilities')
      .select('status, severity, scan_jobs!inner(user_id)')
      .eq('scan_jobs.user_id', userId);
    
    // Count distinct repositories scanned by this user
    const { data: userJobs, error: rError } = await supabase
      .from('scan_jobs')
      .select('repo_id')
      .eq('user_id', userId);
    
    if (vError || rError) throw vError || rError;

    const uniqueRepos = new Set(userJobs?.map(j => j.repo_id) || []);

    const stats = {
      total_vulnerabilities: vulns.length,
      critical: vulns.filter(v => v.severity?.toLowerCase() === 'critical').length,
      high: vulns.filter(v => v.severity?.toLowerCase() === 'high').length,
      fixed: vulns.filter(v => v.status === 'pr_opened' || v.status === 'closed').length,
      repositories: uniqueRepos.size
    };

    return stats;
  }
}
