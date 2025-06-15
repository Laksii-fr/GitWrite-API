import User from '../models/UserModels.js'; // Adjust path as needed
import GitRepo from '../models/GitModels.js';

// Get user by githubId
export const getUserByGithubId = async (githubId) => {
  try {
    const user = await User.findOne({ githubId });
    if (!user) {
      throw new Error(`User with githubId ${githubId} not found`);
    }
    return user;
  } catch (error) {
    throw new Error(`Error retrieving user: ${error.message}`);
  }
};

//get github id by username (keeping for backward compatibility if needed)
export const getGithubIdByUsername = async (username) => {
  try {
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error(`User with username ${username} not found`);
    }
    return user.githubId;
  } catch (error) {
    throw new Error(`Error retrieving GitHub ID: ${error.message}`);
  }
};

export async function SaveGithubData(profile) {
  try {
    const { _json } = profile;

    console.log("Saving GitHub data for user:", profile);

    // Check if user already exists
    let user = await User.findOne({ githubId: profile.id });

    if (user) {
      // Update existing user with new data and token
      user.username = profile.username || _json.login;
      user.name = profile.displayName || _json.name || "";
      user.email = _json.email;
      user.profileUrl = _json.html_url;
      user.avatarUrl = _json.avatar_url;
      user.accessToken = profile.accessToken;
      // Optionally update credit_tokens if you want to reset or increment
      await user.save();
      console.log("GitHub data updated successfully:", user);
      return user;
    } else {
      // Create new user
      const newUser = new User({
        githubId: profile.id,
        username: profile.username || _json.login,
        name: profile.displayName || _json.name || "",
        email: _json.email,
        profileUrl: _json.html_url,
        avatarUrl: _json.avatar_url,
        accessToken: profile.accessToken,
        credit_tokens: 5,
      });

      const savedUser = await newUser.save();
      console.log("GitHub data saved successfully:", savedUser);
      return savedUser;
    }
  } catch (error) {
    console.error("Error saving GitHub data:", error.message);
    throw new Error(`Error saving GitHub data: ${error.message}`);
  }
};

export async function GetAccessToken(githubId) {
  try {
    const user = await User.findOne({ githubId });
    if (!user) {
      throw new Error(`User with githubId ${githubId} not found`);
    }
    const accessToken = user.accessToken;
    if (!accessToken) {
      throw new Error(`Access token for user ${githubId} not found`);
    }
    return accessToken;
  }
  catch (error) {
    console.error("Error retrieving access token:", error.message);
    throw new Error(`Error retrieving access token: ${error.message}`);
  }
};

export async function SaveReadmeForRepo(repoUrl, githubId, readme) {
  try {
    // Check if the repo already exists if not create a new one
    const existingRepo = await GitRepo.findOne({ repoUrl, githubId });
    if (!existingRepo) {
      const newRepo = new GitRepo({
        githubId: githubId,
        repoUrl: repoUrl,
        readme: readme,
      });
      await newRepo.save();
      console.log("New repository saved successfully:", newRepo);
    } else {
      // If the repo already exists, update the readme
      existingRepo.readme = readme;
      await existingRepo.save();
      console.log("Repository updated successfully:", existingRepo);
    }
  } catch (error) {
  console.error("Error saving README for repository:", error.message);
  throw new Error(`Error saving README for repository: ${error.message}`);
}};

export async function DeductCreditTokens(githubId, tokens) {
  try {
    const user = await User.findOne({ githubId });
    if (!user) {
      throw new Error(`User with githubId ${githubId} not found`);
    }
    if (user.credit_tokens < tokens) {
      throw new Error(`Insufficient credit tokens for user ${githubId}`);
    }
    user.credit_tokens -= tokens;
    await user.save();
    console.log(`Deducted ${tokens} credit tokens from user ${githubId}. Remaining: ${user.credit_tokens}`);
    return user.credit_tokens;
  }catch (error) {
    console.error("Error deducting credit tokens:", error.message);
    throw new Error(`Error deducting credit tokens: ${error.message}`);
}};

export async function GetReadmeForRepo(githubId) {
  try {
    // Find All repository for the user
    const repos = await GitRepo.find({ githubId }).select('repoUrl readme');
    if (!repos) {
      throw new Error(`No repository found for user ${githubId}`);
    }
    return repos;
  } catch (error) {
    console.error("Error retrieving README for repository:", error.message);
    throw new Error(`Error retrieving README for repository: ${error.message}`);
  }
};

export async function GetUserProfile(githubId) {
  try {
    const user = await User.findOne({ githubId });
    if (!user) {
      throw new Error(`User with githubId ${githubId} not found`);
    }
    return user;
  } catch (error) {
    throw new Error(`Error retrieving user profile: ${error.message}`);
  }
}