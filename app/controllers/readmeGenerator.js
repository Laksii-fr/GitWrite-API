// controllers/generateReadmeController.js
import { repoReaderAgent } from "../agents/repoReaderAgent.js";
import { featureExtractorAgent } from "../agents/featureExtractorAgent.js";
import { readmeGeneratorAgent } from "../agents/readmeGeneratorAgent.js";
import { GetAccessToken, SaveReadmeForRepo } from "../utils/mongo_utils.js";

export async function generateReadme(repoUrl, githubId) {
    try {
        console.log(`[generateReadme] Called with repoUrl: ${repoUrl}, githubId: ${githubId}`);

        const accessToken = await GetAccessToken(githubId);
        if (!accessToken) {
            console.error("[generateReadme] No access token found for user:", githubId);
            throw new Error("Access token is required");
        }
        console.log("[generateReadme] Access token retrieved successfully");

        // Step 1: Read repository files
        console.log("[generateReadme] Step 1: Reading repository files...");
        const repoFiles = await repoReaderAgent.invoke({
            repoUrl,
            accessToken: accessToken
        });
        console.log("[generateReadme] Repository files read:", repoFiles.length, "files");

        // Step 2: Extract features
        console.log("[generateReadme] Step 2: Extracting features...");
        const features = await featureExtractorAgent.invoke(repoFiles);
        console.log("[generateReadme] Features extracted:", features);

        // Step 3: Generate README
        console.log("[generateReadme] Step 3: Generating README...");
        const readmeResult = await readmeGeneratorAgent.invoke(features);
        console.log("[generateReadme] README generated successfully");

        if (!readmeResult || !readmeResult.readme) {
            throw new Error("README generation failed - no content returned");
        }

        console.log("[generateReadme] README length:", readmeResult.readme.length);
        await SaveReadmeForRepo(repoUrl, githubId, readmeResult.readme);
        return { success: true, readme: readmeResult.readme };

    } catch (err) {
        console.error("Error generating README:", err);
        throw new Error(`Failed to generate README: ${err.message}`);
    }
}