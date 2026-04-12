import { Octokit } from 'octokit';
import { env } from '../../config/env';

export class GithubService {
  private octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({ auth: env.GITHUB_PAT });
  }

  async createFixPullRequest(
    upstreamOwner: string, 
    repo: string, 
    filePath: string, 
    fixedCode: string, 
    vulnId: string, 
    aiExplanation: string
  ) {
    const branchName = `sentinel-fix/${vulnId.substring(0, 8)}`;
    const commitMessage = `🔒 Automated Security Patch for ${filePath}`;

    try {
      // 1. Get our own username (who owns the PAT)
      const { data: user } = await this.octokit.rest.users.getAuthenticated();
      const myUsername = user.login;

      // 2. Determine if we need to Fork
      let targetOwner = upstreamOwner;
      const { data: repoInfo } = await this.octokit.rest.repos.get({ owner: upstreamOwner, repo });
      
      if (!repoInfo.permissions?.push) {
        console.log(`⚠️ No push access to ${upstreamOwner}/${repo}. Creating a fork...`);
        // Create Fork (This is asynchronous on GitHub's end)
        await this.octokit.rest.repos.createFork({ owner: upstreamOwner, repo });
        targetOwner = myUsername; // We will now push code to OUR fork
        
        // Wait 3 seconds for GitHub to finish creating the fork before proceeding
        await new Promise(resolve => setTimeout(resolve, 3000)); 
      }

      // 3. Get the base SHA from our target repository
      const defaultBranch = repoInfo.default_branch;
      const { data: refData } = await this.octokit.rest.git.getRef({
        owner: targetOwner, repo, ref: `heads/${defaultBranch}`
      });
      const baseSha = refData.object.sha;

      // 4. Create a new branch on OUR repo/fork
      await this.octokit.rest.git.createRef({
        owner: targetOwner, repo, ref: `refs/heads/${branchName}`, sha: baseSha
      });

      // 5. Get file SHA and Commit
      const { data: fileData } = await this.octokit.rest.repos.getContent({
        owner: targetOwner, repo, path: filePath, ref: branchName
      });
      if (Array.isArray(fileData)) throw new Error("Path is a directory.");
      
      const encodedContent = Buffer.from(fixedCode).toString('base64');
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: targetOwner, repo, path: filePath, message: commitMessage,
        content: encodedContent, branch: branchName, sha: fileData.sha
      });

    // 5.5 Create the GitHub Issue FIRST
    const { data: issueData } = await this.octokit.rest.issues.create({
        owner: upstreamOwner,
        repo: repo,
        title: `🚨 Security Vulnerability Detected: ${filePath}`,
        body: `## Sentinel-Zero Automated Report\n\n**Issue:**\n${aiExplanation}\n\n*A patch is being generated and a PR will be linked shortly.*`
    });

    console.log(`✅ Issue Created: ${issueData.html_url}`);



      // 6. Open the Cross-Repo Pull Request
      // We open the PR on the UPSTREAM owner, but the HEAD is our fork's branch
      const headString = targetOwner === upstreamOwner ? branchName : `${targetOwner}:${branchName}`;

      const { data: prData } = await this.octokit.rest.pulls.create({
        owner: upstreamOwner, 
        repo: repo,
        title: commitMessage,
        head: headString, // Format: "myUsername:sentinel-fix/12345"
        base: defaultBranch,
        body: `## 🛡️ Sentinel-Zero Automated Remediation\n\n${aiExplanation}`
      });

      return prData.html_url;

    } catch (error: any) {
      console.error("❌ GitHub API Error Details:", error.response?.data || error.message || error);
      throw new Error("Failed to create Pull Request");
    }
  }
}