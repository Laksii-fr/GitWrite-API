import express from 'express';
const router = express.Router();
import { getUserRepos, CommitGitReadme, getUserReadmes } from '../controllers/gitOperations.js';
import { authMiddleware } from "../middlewares/authmiddleware.js"; 

// List All user repositories
router.post("/get-all-repo", authMiddleware, async (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ error: "username is required" });
    }
    try {
        const data = await getUserRepos(username);
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
    const { repoUrl, readmeContent, username } = req.body;
    if (!repoUrl || !readmeContent || !username) {
        return res.status(400).json({ error: "repoUrl, readmeContent and username are required" });
    }
    try {
        const result = await CommitGitReadme(repoUrl, readmeContent, username);
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

router.get("/get-all-readmes", authMiddleware, async (req, res) => {
    const { username } = req.query;
    if (!username) {
        return res.status(400).json({ error: "username is required" });
    }
    try {
        const repos = await getUserReadmes(username);
        if (!repos || repos.length === 0) {
            return res.status(404).json({ message: "No repositories found for this user." });
        }
        return res.status(200).json({
      Status: 'Success',
      message: 'Repositories fetched successfully',
      Data: repos
    });
    } catch (err) {
        console.error("Error fetching repos:", err.message);
        return res.status(500).json({ error: "Failed to fetch repositories" });
    }
});

export default router;
