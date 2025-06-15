import { SaveGithubData } from "../utils/mongo_utils.js";
import { generateToken } from "../utils/jwt_utils.js";

async function handleGithubData(profile) {
  try {
    // Validate profile data before processing
    if (!profile || !profile.id) {
      throw new Error("Invalid GitHub profile: missing profile or githubId");
    }

    if (!profile.accessToken) {
      throw new Error("Invalid GitHub profile: missing access token");
    }

    if (!profile.username && !profile._json?.login) {
      throw new Error("Invalid GitHub profile: missing username");
    }

    console.log("Saving GitHub data for user:", profile.username || profile._json?.login);

    // Try to save or update user data
    const savedUser = await SaveGithubData(profile);

    // If user already exists, SaveGithubData should return the existing user
    // Generate JWT token with githubId
    const token = generateToken({ githubId: profile.id });

    if (!token) {
      throw new Error("Failed to generate JWT token");
    }

    console.log("GitHub data processed successfully for user:", savedUser.username);

    return {
      success: true,
      message: savedUser.isNewUser
        ? "GitHub data saved successfully."
        : "GitHub user already exists. New token generated.",
      token: token,
      githubId: profile.id
    };
  } catch (error) {
    console.error("Error in handleGithubData:", error);
    return {
      success: false,
      message: `Failed to save GitHub data: ${error.message}`,
      error: error.message
    };
  }
}

export { handleGithubData };