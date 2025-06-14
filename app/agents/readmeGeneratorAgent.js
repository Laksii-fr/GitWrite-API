import { ChatOpenAI } from "@langchain/openai";
import { RunnableLambda } from "@langchain/core/runnables";
import { HumanMessage } from "@langchain/core/messages";
import settings from "../config.js"; // Ensure this path is correct

// Check if OpenAI API key is available
const hasOpenAIKey = settings.OPENAI_API_KEY && settings.OPENAI_API_KEY.trim() !== '';

const llm = hasOpenAIKey ? new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.4
}) : null;

// Mock README generation for testing
function mockReadmeGeneration(data) {
  console.log("[readmeGeneratorAgent] Using mock README generation (no OpenAI API key)");
  
  const { features = [], techStack = [], summary = "A software project" } = data;
  
  const readme = `# ${summary.split(' ').slice(0, 3).join(' ')} Project

## Description
${summary}

## Features
${features.map(f => `- ${f}`).join('\n')}

## Tech Stack
${techStack.map(t => `- ${t}`).join('\n')}

## Installation

\`\`\`bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Start the application
npm start
\`\`\`

## Usage

\`\`\`bash
# Run the application
npm start
\`\`\`

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- Project Link: [https://github.com/username/project](https://github.com/username/project)
`;

  return { readme };
}

/**
 * Input: {
 *   features: string[],
 *   techStack: string[],
 *   summary: string
 * }
 * Output: { readme: string }
 */
export const readmeGeneratorAgent = RunnableLambda.from(async (data) => {
  try {
    console.log("[readmeGeneratorAgent] Starting README generation");
    
    // Validate input data
    if (!data || typeof data !== 'object') {
      throw new Error("Invalid input data provided");
    }
    
    if (!data.summary || typeof data.summary !== 'string') {
      console.warn("[readmeGeneratorAgent] Missing or invalid summary, using default");
      data.summary = "A software project with various features and technologies.";
    }
    
    if (!Array.isArray(data.features) || data.features.length === 0) {
      console.warn("[readmeGeneratorAgent] Missing or empty features array, using default");
      data.features = ["Feature list could not be determined"];
    }
    
    if (!Array.isArray(data.techStack) || data.techStack.length === 0) {
      console.warn("[readmeGeneratorAgent] Missing or empty techStack array, using default");
      data.techStack = ["Technology stack could not be determined"];
    }
    
    // Use mock generation if no OpenAI API key
    if (!hasOpenAIKey) {
      return mockReadmeGeneration(data);
    }
    
    const prompt = `
You are a senior developer AI assistant.
Using the following project information, generate a professional README.md file in GitHub Markdown format.

### Summary:
${data.summary}

### Features:
${data.features.map(f => `- ${f}`).join("\n")}

### Tech Stack:
${data.techStack.map(t => `- ${t}`).join("\n")}

Format:
- Title
- Short Description
- Features (bullet points)
- Tech Stack (bullet points)
- Installation steps
- Usage
- Optional: Contribution, License, Contact

Return only the markdown content as a string.
`;

    console.log("[readmeGeneratorAgent] Sending request to LLM");
    const response = await llm.invoke([new HumanMessage(prompt)]);
    
    if (!response || !response.content) {
      throw new Error("No response received from LLM");
    }
    
    console.log("[readmeGeneratorAgent] README generated successfully");
    return { readme: response.content };
    
  } catch (error) {
    console.error("[readmeGeneratorAgent] Error:", error.message);
    
    // Return a fallback README if generation fails
    const fallbackReadme = `# Project README

## Description
This is a software project. Due to an error during README generation, a basic template is provided.

## Features
- Feature extraction was incomplete

## Tech Stack
- Technology stack could not be determined

## Installation
\`\`\`bash
# Installation steps would go here
\`\`\`

## Usage
Please refer to the project documentation for usage instructions.

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License.
`;
    
    return { readme: fallbackReadme };
  }
}); 