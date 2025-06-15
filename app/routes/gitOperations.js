import express from 'express';
const router = express.Router();
import { getUserRepos, CommitGitReadme, getUserReadmes } from '../controllers/gitOperations.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

// Simple test route to verify git operations routes are working
router.get("/test", (req, res) => {
    console.log('Git operations test route called');
    return res.status(200).json({
        success: true,
        message: 'Git operations routes are working'
    });
});

// Test repository access
router.post("/test-repo-access", authMiddleware, async (req, res) => {
    console.log('test-repo-access route called');
    console.log('Request body:', req.body);
    
    if (!req.body) {
        return res.status(400).json({ 
            error: "Request body is missing. Please ensure Content-Type is set to application/json" 
        });
    }
    
    const { repoUrl } = req.body;
    const { githubId } = req.user;
    
    if (!repoUrl) {
        return res.status(400).json({ error: "repoUrl is required" });
    }
    
    try {
        // Extract owner and repo
        const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
            return res.status(400).json({ error: "Invalid GitHub repository URL format" });
        }
        
        const [owner, repo] = [match[1], match[2].replace('.git', '')];
        console.log(`Testing access to: ${owner}/${repo}`);
        
        // Test repository access
        const { GetAccessToken } = await import('../utils/mongo_utils.js');
        const accessToken = await GetAccessToken(githubId);
        
        const axios = (await import('axios')).default;
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: { 
                Authorization: `token ${accessToken}`,
                Accept: "application/vnd.github.v3+json"
            },
        });
        
        return res.status(200).json({
            success: true,
            message: 'Repository access verified',
            data: {
                owner,
                repo,
                defaultBranch: response.data.default_branch,
                private: response.data.private,
                permissions: response.data.permissions
            }
        });
    } catch (err) {
        console.error("Repository access test failed:", err.response?.data || err.message);
        return res.status(400).json({
            success: false,
            error: "Repository access failed",
            details: err.response?.data || err.message
        });
    }
});

// List All user repositories
router.post("/get-all-repo", authMiddleware, async (req, res) => {
    console.log('get-all-repo route called');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    const { githubId } = req.user;
    
    try {
        const data = await getUserRepos(githubId);
        return res.status(201).json({
      Status: 'Success',
      message: 'Repositories fetched successfully',
      Data: data
    });
    } catch (err) {
        console.error("Error fetching repos:", err.message);
        return res.status(500).json({ error: "Failed to fetch repositories" });
    }
});

router.post("/commit-readme", authMiddleware, async (req, res) => {
    console.log('commit-readme route called');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    // Check if req.body exists
    if (!req.body) {
        console.error('req.body is undefined');
        return res.status(400).json({ 
            error: "Request body is missing. Please ensure Content-Type is set to application/json" 
        });
    }
    
    const { repoUrl, readmeContent } = req.body;
    const { githubId } = req.user;
    
    if (!repoUrl || !readmeContent) {
        return res.status(400).json({ error: "repoUrl and readmeContent are required" });
    }
    try {
        const result = await CommitGitReadme(repoUrl, readmeContent, githubId);
        return res.status(201).json({
      Status: 'Success',
      message: 'README committed successfully',
      Data: result
    });
    } catch (err) {
        console.error("Error committing README:", err.message);
        return res.status(500).json({ error: "Failed to commit README" });
    }
});

// router.get("/get-all-readmes", authMiddleware, async (req, res) => {
//     console.log('get-all-readmes route called');
//     console.log('Request query:', req.query);
//     console.log('Request headers:', req.headers);
    
//     const { githubId } = req.user;
    
//     try {
//         const repos = await getUserReadmes(githubId);
//         if (!repos || repos.length === 0) {
//             return res.status(404).json({ message: "No repositories found for this user." });
//         }
//         return res.status(200).json({
//       Status: 'Success',
//       message: 'Repositories fetched successfully',
//       Data: repos
//     });
//     } catch (err) {
//         console.error("Error fetching repos:", err.message);
//         return res.status(500).json({ error: "Failed to fetch repositories" });
//     }
// });

export default router;
