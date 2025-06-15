import express from "express";
const router = express.Router();
import passport, { revokeGitHubAccess, revokeUserGitHubAccess } from "../helpers/githubOAuth.js";
import { handleGithubData } from "../controllers/githubAuth.js";

// Step 1: Redirect user to GitHub login
router.get(
  "/auth",
  (req, res, next) => {
    console.log("GitHub OAuth initiated");
    passport.authenticate("github", { scope: ["repo"] })(req, res, next);
  }
);

// Step 2: GitHub redirects back to this route after login
router.get("/auth/callback", 
  (req, res, next) => {
    passport.authenticate("github", { 
      failureRedirect: "/", 
      session: false,
      failWithError: true // This allows us to handle errors in the next middleware
    })(req, res, next);
  },
  async (req, res) => {
    try {
      const profile = req.user;
      
      // Check if authentication failed
      if (!profile) {
        console.error("GitHub OAuth failed: No profile received");
        return res.status(401).json({
          success: false,
          message: "GitHub authentication failed. Please try again.",
          error: "AUTH_FAILED"
        });
      }

      // Validate required profile fields
      if (!profile.id || !profile.accessToken) {
        console.error("GitHub OAuth failed: Invalid profile data", {
          hasId: !!profile.id,
          hasAccessToken: !!profile.accessToken
        });
        
        // Revoke access if we have a token
        if (profile.accessToken) {
          await revokeUserGitHubAccess(profile.accessToken, profile.id);
        }
        
        return res.status(400).json({
          success: false,
          message: "Invalid GitHub profile data received. Access has been revoked.",
          error: "INVALID_PROFILE"
        });
      }

      // Try to save GitHub data and generate JWT
      let data;
      try {
        data = await handleGithubData(profile);
      } catch (saveError) {
        console.error("Error saving GitHub data:", saveError);
        
        // Revoke access since we couldn't save the data
        await revokeUserGitHubAccess(profile.accessToken, profile.id);
        
        return res.status(500).json({
          success: false,
          message: "Failed to save user data. Access has been revoked. Please try again.",
          error: "SAVE_FAILED"
        });
      }

      // Check if data saving was successful
      if (!data.success) {
        console.error("GitHub data save failed:", data.message);
        
        // Revoke access since data saving failed
        await revokeUserGitHubAccess(profile.accessToken, profile.id);
        
        return res.status(500).json({
          success: false,
          message: "Failed to process user data. Access has been revoked.",
          error: "PROCESSING_FAILED"
        });
      }

      // Success - return JWT token and user data
      console.log(`GitHub OAuth successful for user: ${profile.username} (ID: ${profile.id})`);
      res.cookie("token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // set to true in production
      sameSite: "Lax", // or "Strict" / "None" depending on frontend-backend domain
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Redirect or send a success page/message
    return res.redirect("http://localhost:3000/dashboard");

    } catch (error) {
      console.error("GitHub callback error:", error);
      
      // Try to revoke access if we have a profile with token
      if (req.user && req.user.accessToken) {
        try {
          await revokeUserGitHubAccess(req.user.accessToken, req.user.id);
        } catch (revokeError) {
          console.error("Failed to revoke access token:", revokeError);
        }
      }
      
      return res.status(500).json({
        success: false,
        message: "GitHub authentication failed. Access has been revoked. Please try again.",
        error: "CALLBACK_ERROR"
      });
    }
  }
);

// Error handling middleware for OAuth failures
router.use((error, req, res, next) => {
  if (error) {
    console.error("GitHub OAuth error middleware:", error);
    
    // Try to revoke access if we have a profile with token
    if (req.user && req.user.accessToken) {
      revokeUserGitHubAccess(req.user.accessToken, req.user.id).catch(revokeError => {
        console.error("Failed to revoke access token in error middleware:", revokeError);
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "GitHub authentication failed. Access has been revoked.",
      error: "OAUTH_ERROR"
    });
  }
  next();
});

export default router;
