import { ChatOpenAI } from "@langchain/openai";
import { RunnableLambda } from "@langchain/core/runnables";
import { HumanMessage } from "@langchain/core/messages";

// Check if OpenAI API key is available
const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '';

const llm = hasOpenAIKey ? new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.3
}) : null;

// Helper function to estimate tokens (rough approximation: 1 token ≈ 4 characters)
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// Helper function to filter and prioritize files
function filterAndPrioritizeFiles(files) {
  const importantExtensions = [
    '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs',
    '.php', '.rb', '.cs', '.swift', '.kt', '.scala', '.clj', '.hs', '.ml',
    '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
    '.md', '.txt', '.rst', '.adoc'
  ];
  
  const importantFiles = [
    'package.json', 'requirements.txt', 'pom.xml', 'build.gradle', 'Cargo.toml',
    'go.mod', 'composer.json', 'Gemfile', 'pubspec.yaml', 'package.yaml',
    'README.md', 'README.txt', 'CHANGELOG.md', 'LICENSE', 'Makefile',
    'Dockerfile', 'docker-compose.yml', '.env.example', 'config.json'
  ];

  return files.filter(file => {
    const extension = file.path.substring(file.path.lastIndexOf('.'));
    const fileName = file.path.split('/').pop();
    
    return importantExtensions.includes(extension) || 
           importantFiles.includes(fileName) ||
           file.path.includes('src/') ||
           file.path.includes('app/') ||
           file.path.includes('lib/') ||
           file.path.includes('main/');
  });
}

// Helper function to truncate content
function truncateContent(content, maxChars = 2000) {
  if (content.length <= maxChars) return content;
  return content.substring(0, maxChars) + '\n\n... [Content truncated for brevity]';
}

// Mock feature extraction for testing
function mockFeatureExtraction(files) {
  console.log("[featureExtractorAgent] Using mock feature extraction (no OpenAI API key)");
  
  // Check if we have error files
  const errorFiles = files.filter(file => file.path === "ERROR");
  if (errorFiles.length > 0) {
    console.log("[featureExtractorAgent] Detected error files, returning error summary");
    return {
      features: ["Repository access failed"],
      techStack: ["Unknown"],
      summary: errorFiles[0].content || "Failed to access repository"
    };
  }
  
  const features = [];
  const techStack = [];
  
  // Analyze files for features and tech stack
  files.forEach(file => {
    if (file.path.includes('package.json')) {
      techStack.push('Node.js');
      try {
        const pkg = JSON.parse(file.content);
        if (pkg.dependencies) {
          Object.keys(pkg.dependencies).forEach(dep => {
            if (dep.includes('express')) techStack.push('Express.js');
            if (dep.includes('react')) techStack.push('React');
            if (dep.includes('vue')) techStack.push('Vue.js');
            if (dep.includes('angular')) techStack.push('Angular');
            if (dep.includes('axios')) techStack.push('Axios');
            if (dep.includes('mongoose')) techStack.push('MongoDB');
            if (dep.includes('prisma')) techStack.push('Prisma');
          });
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }
    
    if (file.path.includes('requirements.txt') || file.path.includes('pyproject.toml')) {
      techStack.push('Python');
    }
    
    if (file.path.includes('pom.xml') || file.path.includes('build.gradle')) {
      techStack.push('Java');
    }
    
    if (file.path.includes('Cargo.toml')) {
      techStack.push('Rust');
    }
    
    if (file.path.includes('go.mod')) {
      techStack.push('Go');
    }
    
    if (file.path.includes('Dockerfile')) {
      features.push('Docker containerization');
    }
    
    if (file.path.includes('docker-compose')) {
      features.push('Multi-container deployment');
    }
    
    if (file.path.includes('test') || file.path.includes('spec')) {
      features.push('Testing framework');
    }
    
    if (file.path.includes('api') || file.path.includes('routes')) {
      features.push('REST API');
    }
    
    if (file.path.includes('auth') || file.path.includes('login')) {
      features.push('Authentication system');
    }
  });
  
  // Remove duplicates
  const uniqueFeatures = [...new Set(features)];
  const uniqueTechStack = [...new Set(techStack)];
  
  // Default features if none found
  if (uniqueFeatures.length === 0) {
    uniqueFeatures.push('Web application');
  }
  
  if (uniqueTechStack.length === 0) {
    uniqueTechStack.push('JavaScript');
  }
  
  return {
    features: uniqueFeatures,
    techStack: uniqueTechStack,
    summary: `A ${uniqueTechStack.join(', ')} project with ${uniqueFeatures.join(', ').toLowerCase()} capabilities.`
  };
}

/**
 * Input: [{ path: string, content: string }]
 * Output: { features: string[], techStack: string[], summary: string }
 */
export const featureExtractorAgent = RunnableLambda.from(async (repoFiles) => {
  try {
    // Filter and prioritize important files
    const filteredFiles = filterAndPrioritizeFiles(repoFiles);
    
    // Truncate content and estimate tokens
    const processedFiles = filteredFiles.map(file => ({
      path: file.path,
      content: truncateContent(file.content)
    }));
    
    // Calculate total tokens
    const totalContent = processedFiles.map(f => `### ${f.path}\n${f.content}`).join("\n\n");
    const estimatedTokens = estimateTokens(totalContent);
    
    console.log(`[featureExtractorAgent] Processing ${processedFiles.length} files, estimated tokens: ${estimatedTokens}`);
    
    // If still too large, take only the most important files
    let filesToProcess = processedFiles;
    if (estimatedTokens > 6000) { // Leave room for prompt and response
      console.log("[featureExtractorAgent] Content too large, taking top files only");
      filesToProcess = processedFiles.slice(0, Math.min(10, processedFiles.length));
    }
    
    // Use mock extraction if no OpenAI API key
    if (!hasOpenAIKey) {
      return mockFeatureExtraction(filesToProcess);
    }
    
    const prompt = `
You are a software analyst AI.
Analyze the following repo files and extract:

1. Key Features
2. Technology Stack  
3. Brief Summary
4. Noteworthy Functionalities

Respond in JSON format with:
{
  "features": [...],
  "techStack": [...],
  "summary": "..."
}

Repo Files:
${filesToProcess.map(f => `### ${f.path}\n${f.content}`).join("\n\n")}
`;

    const response = await llm.invoke([new HumanMessage(prompt)]);
    
    try {
      const parsed = JSON.parse(response.content);
      return parsed;
    } catch (parseError) {
      console.error("[featureExtractorAgent] Failed to parse JSON response:", parseError);
      // Fallback: return a basic structure
      return {
        features: ["Feature extraction failed - repository analysis incomplete"],
        techStack: ["Technology stack could not be determined"],
        summary: "Unable to generate summary due to parsing error"
      };
    }
  } catch (error) {
    console.error("[featureExtractorAgent] Error:", error);
    throw new Error(`Failed to extract features: ${error.message}`);
  }
}); 