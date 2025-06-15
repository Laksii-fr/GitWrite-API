import express from 'express';
import { generateReadme } from '../controllers/readmeGenerator.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
const router = express.Router(); 

// Health check route (no authentication required)
router.get("/health", (req, res) => {
    console.log('Health check route called');
    return res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Simple test route without auth middleware
router.get("/simple-test", (req, res) => {
    console.log('Simple test route called');
    return res.status(200).json({
        success: true,
        message: 'Simple test route working'
    });
});

// Test route to verify JWT authentication
router.get("/test-auth", authMiddleware, (req, res) => {
    console.log('Test auth route called');
    return res.status(200).json({
        success: true,
        message: 'JWT authentication working',
        githubId: req.user.githubId
    });
});

// Generate README for a repository
router.post("/generate-readme", authMiddleware, async (req, res) => {
    console.log('Generate README route called');
    const { repoUrl } = req.body;
    const { githubId } = req.user;
    
    console.log('Request body:', req.body);
    console.log('User githubId:', githubId);
    
    if (!repoUrl) {
        console.log('Missing repoUrl in request');
        return res.status(400).json({ error: "repoUrl is required" });
    }
    
    try {
        console.log("Generating README for repo:", repoUrl, "by user:", githubId);
        const readme = await generateReadme(repoUrl, githubId);
        console.log('README generation successful');
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