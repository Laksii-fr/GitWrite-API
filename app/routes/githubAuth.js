import express from "express";
const router = express.Router();
import passport from "../helpers/githubOAuth.js";
import { handleGithubData } from "../controllers/githubAuth.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";  

// Step 1: Redirect user to GitHub login
router.get(
  "/auth", authMiddleware,
  passport.authenticate("github", { scope: ["repo"] })
);

// Step 2: GitHub redirects back to this route after login
router.get("/auth/callback", passport.authenticate("github", { failureRedirect: "/", session: false }), async (req, res) => {
    try {
      const profile = req.user;
      if (!profile) {
        return res.status(400).json({
          success: false,
          message: "Access token and profile are missing.",
        });
      }
      Data = await handleGithubData(profile);
      return res.status(200).json({
        success: true,
        message: "GitHub OAuth successful",
        accessToken: profile.accessToken,
      });
    } catch (error) {
      console.error("GitHub callback error:", error);
      return res.status(500).json({
        success: false,
        message: "GitHub callback failed.",
      });
    }
  }
);

export default router;
