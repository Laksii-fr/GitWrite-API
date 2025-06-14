import express from 'express';
import { generateReadme } from '../controllers/readmeGenerator.js';
import { authMiddleware } from '../middlewares/authmiddleware.js';
const router = express.Router();

// Generate README for a repository
router.post("/generate-readme", authMiddleware, async (req, res) => {
    const { repoUrl, Username } = req.body;
    if (!repoUrl || !Username) {
    return res.status(400).json({ error: "repoUrl and username are required" });
    }
    try {
        console.log("Generating README for repo:", repoUrl, "by user:", Username);
        const readme = await generateReadme(repoUrl, Username);
        return res.status(201).json({
            Status: 'Success',
            message: 'README generated successfully',
            Data: readme
        });
    } catch (err) {
        console.error("Error generating README:", err.message);
        return res.status(500).json({
            status: 'Error',
            message: 'Failed to generate README',
            error: err.message});
    }
});

export default router;