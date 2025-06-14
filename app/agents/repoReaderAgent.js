// agents/repoReaderAgent.js
import { RunnableLambda } from "@langchain/core/runnables";
import axios from "axios";

// Helper function to estimate file size in tokens (rough approximation)
function estimateFileTokens(content) {
  return Math.ceil(content.length / 4);
}

// Helper function to filter out large files and binary files
function shouldSkipFile(path, size) {
  const maxSize = 100 * 1024; // 100KB limit
  const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg', 
                           '.woff', '.woff2', '.ttf', '.eot', '.otf', '.mp4', '.mp3',
                           '.wav', '.avi', '.mov', '.zip', '.tar', '.gz', '.rar',
                           '.exe', '.dll', '.so', '.dylib', '.bin', '.obj'];
  
  const extension = path.substring(path.lastIndexOf('.')).toLowerCase();
  
  return size > maxSize || binaryExtensions.includes(extension);
}

/**
 * Input: { repoUrl: string, accessToken: string }
 * Output: [{ path: string, content: string }]
 */
export const repoReaderAgent = RunnableLambda.from(async ({ repoUrl, accessToken }) => {
  try {
    console.log(`[repoReaderAgent] Starting to read repository: ${repoUrl}`);
    
    if (!repoUrl || !accessToken) {
      throw new Error("repoUrl and accessToken are required");
    }
    
    const [owner, repo] = extractOwnerAndRepo(repoUrl);
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;

    const treeRes = await axios.get(treeUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!treeRes.data.tree) {
      throw new Error("No files found in repository");
    }

    // Filter files and get their sizes
    const fileItems = treeRes.data.tree
      .filter(item => item.type === "blob" && !shouldSkipFile(item.path, item.size))
      .slice(0, 50); // Limit to 50 files to prevent token overflow

    console.log(`[repoReaderAgent] Found ${fileItems.length} files to process`);

    if (fileItems.length === 0) {
      throw new Error("No suitable files found in repository");
    }

    const fileContents = [];
    let totalTokens = 0;
    const maxTotalTokens = 5000; // Conservative limit

    for (const fileItem of fileItems) {
      try {
        const contentUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${fileItem.path}`;
        const res = await axios.get(contentUrl, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        const content = Buffer.from(res.data.content, 'base64').toString('utf-8');
        const fileTokens = estimateFileTokens(content);
        
        // Check if adding this file would exceed token limit
        if (totalTokens + fileTokens > maxTotalTokens) {
          console.log(`[repoReaderAgent] Token limit reached, stopping at ${fileContents.length} files`);
          break;
        }
        
        fileContents.push({ 
          path: fileItem.path, 
          content: content 
        });
        
        totalTokens += fileTokens;
        
      } catch (fileError) {
        console.warn(`[repoReaderAgent] Failed to fetch file ${fileItem.path}:`, fileError.message);
        // Continue with other files
      }
    }

    console.log(`[repoReaderAgent] Successfully processed ${fileContents.length} files, total estimated tokens: ${totalTokens}`);

    if (fileContents.length === 0) {
      throw new Error("No files could be successfully processed");
    }

    return fileContents;
  } catch (error) {
    console.error("[repoReaderAgent] Error:", error.message);
    
    // Return a special error object so downstream nodes can handle it
    // This ensures the flow doesn't break
    return [{ 
      path: "ERROR", 
      content: `Failed to fetch repo files: ${error.message}. Please check your repository URL and access token.` 
    }];
  }
});

function extractOwnerAndRepo(repoUrl) {
  const regex = /github\.com\/([^/]+)\/([^/]+)(\/)?$/;
  const match = repoUrl.match(regex);
  if (!match) throw new Error("Invalid GitHub repo URL");
  return [match[1], match[2]];
} 