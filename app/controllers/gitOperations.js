import axios from "axios";
import settings from "../config.js";
import { GetAccessToken, GetReadmeForRepo } from "../utils/mongo_utils.js";

// Helper function to extract owner and repo from GitHub URL
function extractOwnerAndRepo(repoUrl) {
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub repository URL');
  }
  return [match[1], match[2].replace('.git', '')];
}

export async function getUserRepos(githubId) {
  try {
    const accessToken = await GetAccessToken(githubId);
    if (!accessToken) {
      throw new Error("Access token is required");
    }
    const REPO_URL = settings.GET_REPO_URL;
    const response = await axios.get(REPO_URL, {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    if (response.status !== 200) {
      throw new Error(`Failed to fetch repositories: ${response.statusText}`);
    }
    const repos = response.data.map(repo => ({
      name: repo.name,
      private: repo.private,
      html_url: repo.html_url,
      description: repo.description,
      updated_at: repo.updated_at,
    }));
    if (repos.length === 0) {
      return { message: "No repositories found for this user." };
    }
    return repos;
  } catch (err) {
    console.error("Error fetching repos:", err.message);
    throw new Error("Failed to fetch repositories.", err.message);
  }
}

export async function CommitGitReadme(repoUrl, readmeContent, githubId) {
  try {
    console.log(`[CommitGitReadme] Starting commit process for repoUrl: ${repoUrl}, githubId: ${githubId}`);

    const accessToken = await GetAccessToken(githubId);
    if (!accessToken) throw new Error("Access token is required");
    console.log("[CommitGitReadme] Access token retrieved successfully");

    const [owner, repo] = extractOwnerAndRepo(repoUrl);
    console.log(`[CommitGitReadme] Extracted owner: ${owner}, repo: ${repo}`);

    // 1. First, verify the repository exists and we have access
    console.log(`[CommitGitReadme] Verifying repository access: https://api.github.com/repos/${owner}/${repo}`);
    try {
      const repoInfo = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { 
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github.v3+json"
        },
      });
      console.log(`[CommitGitReadme] Repository verified successfully. Default branch: ${repoInfo.data.default_branch}`);
      const defaultBranch = repoInfo.data.default_branch || "main";
    } catch (repoError) {
      console.error(`[CommitGitReadme] Repository verification failed:`, repoError.response?.data || repoError.message);
      if (repoError.response?.status === 404) {
        throw new Error(`Repository not found: ${owner}/${repo}. Please check the repository URL and ensure you have access to it.`);
      } else if (repoError.response?.status === 403) {
        throw new Error(`Access denied to repository: ${owner}/${repo}. Please check your GitHub permissions.`);
      } else {
        throw new Error(`Failed to access repository: ${repoError.response?.data?.message || repoError.message}`);
      }
    }

    // 2. Get default branch
    const repoInfo = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Authorization: `token ${accessToken}` },
    });
    const defaultBranch = repoInfo.data.default_branch || "main";

    const commitUrl = `https://api.github.com/repos/${owner}/${repo}/contents/README.md`;

    // 3. Get existing README SHA (if any)
    let sha = undefined;
    try {
      console.log(`[CommitGitReadme] Checking for existing README.md at: ${commitUrl}`);
      const existing = await axios.get(commitUrl, {
        headers: { Authorization: `token ${accessToken}` },
      });
      sha = existing.data.sha;
      console.log(`[CommitGitReadme] Existing README.md found, SHA: ${sha}`);
    } catch (err) {
      if (err.response?.status === 404) {
        console.log("[CommitGitReadme] README.md does not exist, will create new one");
      } else {
        console.error("[CommitGitReadme] Error checking existing README:", err.response?.data || err.message);
        throw new Error(`Failed to check existing README: ${err.response?.data?.message || err.message}`);
      }
    }

    // 4. Commit the README
    console.log(`[CommitGitReadme] Committing README.md to branch: ${defaultBranch}`);
    const response = await axios.put(
      commitUrl,
      {
        message: "README.md added via GitWriter",
        content: Buffer.from(readmeContent).toString("base64"),
        branch: defaultBranch,
        ...(sha && { sha }), // only include SHA if updating
      },
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (![200, 201].includes(response.status)) {
      console.error(`[CommitGitReadme] Unexpected response status: ${response.status}`);
      throw new Error(`Failed to commit README: ${response.statusText}`);
    }

    console.log("[CommitGitReadme] README committed successfully");
    return { success: true, message: "README committed successfully." };
  } catch (err) {
    console.error("[CommitGitReadme] Error details:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      statusText: err.response?.statusText
    });
    throw new Error(`Failed to commit README: ${err.message}`);
  }
}

export async function getUserReadmes(githubId) {
  try {
    const data = await GetReadmeForRepo(githubId);
    if (!data || data.length === 0) {
      return { message: "No repositories found for this user." };
    }
    return data;
  } catch (err) {
    console.error("Error fetching repos:", err.message);
    throw new Error("Failed to fetch repositories.", err.message);
  }
}