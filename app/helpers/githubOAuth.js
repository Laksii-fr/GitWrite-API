import passport from "passport";
import GitHubStrategy from "passport-github2";
import axios from "axios";
import settings from "../config.js"; // correct relative path

// Function to revoke GitHub access token
async function revokeGitHubAccess(accessToken) {
  try {
    if (!accessToken) {
      console.warn("No access token provided for revocation");
      return;
    }

    // Method 1: Revoke the access token by making a DELETE request to GitHub API
    try {
      const response = await axios.delete('https://api.github.com/applications/tokens', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        auth: {
          username: settings.GITHUB_CLIENT_ID,
          password: settings.GITHUB_CLIENT_SECRET
        }
      });

      if (response.status === 204) {
        console.log("GitHub access token successfully revoked");
      } else {
        console.warn("Failed to revoke GitHub access token:", response.status);
      }
    } catch (deleteError) {
      console.warn("DELETE method failed, trying alternative revocation:", deleteError.message);
      
      // Method 2: Alternative approach - revoke application authorization
      try {
        const revokeResponse = await axios.delete(`https://api.github.com/applications/${settings.GITHUB_CLIENT_ID}/grant`, {
          headers: {
            'Authorization': `token ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json'
          },
          auth: {
            username: settings.GITHUB_CLIENT_ID,
            password: settings.GITHUB_CLIENT_SECRET
          }
        });

        if (revokeResponse.status === 204) {
          console.log("GitHub application authorization successfully revoked");
        } else {
          console.warn("Failed to revoke GitHub application authorization:", revokeResponse.status);
        }
      } catch (revokeError) {
        console.error("Alternative revocation method also failed:", revokeError.message);
      }
    }
  } catch (error) {
    console.error("Error revoking GitHub access token:", error.message);
    // Don't throw here as we don't want to break the flow
  }
}

// Function to completely revoke user's GitHub app access
async function revokeUserGitHubAccess(accessToken, githubId) {
  try {
    console.log(`Revoking GitHub access for user ID: ${githubId}`);
    
    // Revoke the access token
    await revokeGitHubAccess(accessToken);
    
    // Additional cleanup: Remove user from database if needed
    // This could be implemented based on your requirements
    console.log(`GitHub access revocation completed for user ID: ${githubId}`);
    
  } catch (error) {
    console.error("Error in complete GitHub access revocation:", error.message);
  }
}

// Function to handle OAuth errors and revoke access
async function handleOAuthError(error, accessToken, profile) {
  console.error("GitHub OAuth Error:", {
    error: error.message,
    githubId: profile?.id,
    username: profile?.username
  });

  // Revoke the access token if we have one
  if (accessToken) {
    await revokeGitHubAccess(accessToken);
  }

  // Log the error for monitoring
  console.error("OAuth Error Details:", {
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    githubId: profile?.id,
    username: profile?.username
  });
}

passport.use(
  new GitHubStrategy(
    {
      clientID: settings.GITHUB_CLIENT_ID,
      clientSecret: settings.GITHUB_CLIENT_SECRET,
      callbackURL: settings.GITHUB_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Validate the profile data
        if (!profile || !profile.id) {
          const error = new Error("Invalid GitHub profile received");
          await handleOAuthError(error, accessToken, profile);
          return done(error, null);
        }

        // Validate access token
        if (!accessToken) {
          const error = new Error("No access token received from GitHub");
          await handleOAuthError(error, null, profile);
          return done(error, null);
        }

        // Test the access token by making a simple API call
        try {
          const testResponse = await axios.get('https://api.github.com/user', {
            headers: {
              'Authorization': `token ${accessToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });

          if (testResponse.status !== 200) {
            const error = new Error("GitHub access token validation failed");
            await handleOAuthError(error, accessToken, profile);
            return done(error, null);
          }
        } catch (apiError) {
          const error = new Error(`GitHub API validation failed: ${apiError.message}`);
          await handleOAuthError(error, accessToken, profile);
          return done(error, null);
        }

        // If everything is valid, attach the access token to profile
        profile.accessToken = accessToken;
        console.log(`GitHub OAuth successful for user: ${profile.username} (ID: ${profile.id})`);
        return done(null, profile);

      } catch (error) {
        await handleOAuthError(error, accessToken, profile);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  try {
    done(null, user);
  } catch (error) {
    console.error("Error serializing user:", error);
    done(error, null);
  }
});

passport.deserializeUser((user, done) => {
  try {
    done(null, user);
  } catch (error) {
    console.error("Error deserializing user:", error);
    done(error, null);
  }
});

export { revokeGitHubAccess, revokeUserGitHubAccess, handleOAuthError };
export default passport;
