import { supabase } from '../../db/supabase';

export class ScanService {
  async createScanJob(data: { github_url: string; full_name: string }) {
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
        status: 'queued' 
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

  async submitHumanReview(vuln_id: string, decision: 'approved_real_bug' | 'rejected_false_positive', feedback: string = "") {
    // 1. Update the database
    const { data, error } = await supabase
      .from('vulnerabilities')
      .update({ 
        human_review_status: decision,
        human_feedback: feedback,
        status: decision === 'rejected_false_positive' ? 'closed' : 'fixing' 
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
}
