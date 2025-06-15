import express from 'express';
import { authMiddleware } from '../middlewares/authmiddleware.js';
import { getUserProfile } from '../controllers/profile.js';

const router = express.Router();

router.get("/get-user-profile", authMiddleware, async (req, res) => {
    const { githubId } = req.user;
    if (!githubId) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
        });
    }
    try {
        const data = await getUserProfile(githubId);
        return res.status(200).json({
            success: true,
            message: 'User profile fetched successfully',
            data: data
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching user profile',
            error: error.message
        });
    }
});

export default router;

