import User from '../models/UserModels.js'; // Adjust path as needed
import GitRepo from '../models/GitModels.js';
import bcrypt from 'bcryptjs';
import { generate_recoveryToken } from '../helpers/auth_helper.js';

export const SaveUser = async ({ subId, username, password }) => {
  try {
    const newUser = new User({ subId, username, password, recoveryToken: await generate_recoveryToken() });
    const savedUser = await newUser.save();
    return savedUser;
  } catch (error) {
    throw new Error(`Error saving user: ${error.message}`);
  }
};

export const checkUserCredentials = async ({ username, password }) => {
  try {
    const user = await User.findOne({ username });
    if (!user) return false;

    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch;
  } catch (error) {
    throw new Error(`Error checking credentials: ${error.message}`);
  }
};

export const get_subid_by_username = async (username) => {
  try {
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error('User not found');
    }
    return user.subId;
  } catch (error) {
    throw new Error(`Error retrieving subId: ${error.message}`);
  }
};

export const checkUserReoveryToken = async (username, recovery_token) => {
  try {
    const user = await User.findOne({ username, recoveryToken: recovery_token });
    if (!user) {
      throw new Error('Invalid recovery token');
    } else {
      console.log(`Recovery token for user ${username} is valid.`); 
      return true;
    }
  } catch (error) {
    throw new Error(`Error checking recovery token: ${error.message}`);
  }
};

//get github id by username
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

export const updateUserPassword = async (payload) => {
  try {
    username = payload.username;
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error('User not found');
    }
    user.password = newPassword;
    await user.save();
    console.log(`Password for user ${username} updated successfully.`);
    return { message: 'Password updated successfully' };
  } catch (error) {
    throw new Error(`Error updating password: ${error.message}`);
  }
};

export async function SaveGithubData(profile) {
  try {
    const { _json } = profile;

    const newUser = new User({
      githubId: profile.id,
      username: profile.username || _json.login,
      name: profile.displayName || _json.name || "",
      email: _json.email || null,
      profileUrl: _json.html_url,
      avatarUrl: _json.avatar_url,
      accessToken: profile.accessToken,
      credit_tokens: 5,
    });

    const savedUser = await newUser.save();
    console.log("GitHub data saved successfully:", savedUser);
    return savedUser;

  } catch (error) {
    console.error("Error saving GitHub data:", error.message);
    throw new Error(`Error saving GitHub data: ${error.message}`);
  }
};

export async function GetAccessToken(username) {
  try {
    const user = await User.find({ username });
    if (!user || user.length === 0) {
      throw new Error(`User with username ${username} not found`);
    }
    const accessToken = user[0].accessToken;
    if (!accessToken) {
      throw new Error(`Access token for user ${username} not found`);
    }
    return accessToken;
  }
  catch (error) {
    console.error("Error retrieving access token:", error.message);
    throw new Error(`Error retrieving access token: ${error.message}`);
  }
};

export async function SaveReadmeForRepo(repoUrl, username, readme) {
  try {
    // Check if the repo already exists if not create a new one
    const existingRepo = await GitRepo.findOne({ repoUrl, username });
    if (!existingRepo) {
      const newRepo = new GitRepo({
        username: username,
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

export async function DeductCreditTokens(username, tokens) {
  try {
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error(`User with username ${username} not found`);
    }
    if (user.credit_tokens < tokens) {
      throw new Error(`Insufficient credit tokens for user ${username}`);
    }
    user.credit_tokens -= tokens;
    await user.save();
    console.log(`Deducted ${tokens} credit tokens from user ${username}. Remaining: ${user.credit_tokens}`);
    return user.credit_tokens;
  }catch (error) {
    console.error("Error deducting credit tokens:", error.message);
    throw new Error(`Error deducting credit tokens: ${error.message}`);
}};

export async function GetReadmeForRepo( username) {
  try {
    // Find All repository for the user
    const repos = await GitRepo.find({ username }).select('repoUrl readme');
    if (!repos) {
      throw new Error(`No repository found for user ${username}`);
    }
    return repos;
  } catch (error) {
    console.error("Error retrieving README for repository:", error.message);
    throw new Error(`Error retrieving README for repository: ${error.message}`);
  }
};