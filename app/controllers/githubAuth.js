import { SaveGithubData } from "../utils/mongo_utils.js";

async function handleGithubData(profile) {
  try {
    console.log("Saving GitHub data...");
    await SaveGithubData(profile);
    return { success: true, message: "GitHub data saved successfully." };
  } catch (error) {
    console.error("Error saving GitHub data:", error);
    return { success: false, message: "Failed to save GitHub data." };
  }
}

export { handleGithubData };