# GitWrite-API

A Node.js API for automatically generating professional README files for GitHub repositories using AI.

## Recent Fixes (June 2025)

### Context Length Error Resolution
- **Issue**: The API was failing with "context_length_exceeded" errors when processing large repositories
- **Root Cause**: The feature extractor was sending all repository files to the LLM at once, exceeding the 8,192 token limit
- **Solution**: Implemented intelligent file filtering, content truncation, and token management

### LangGraph Removal
- **Issue**: LangGraph was causing complex debugging issues and returning undefined results
- **Solution**: Replaced LangGraph with a simple, direct agent chain for better reliability and debugging

### Key Improvements

#### 1. Repository Reader Agent (`app/agents/repoReaderAgent.js`)
- Added file size limits (100KB max per file)
- Implemented binary file filtering
- Limited total files to 50 per repository
- Added token estimation and limits (5,000 tokens max)
- Improved error handling and logging
- Always returns an array (even on errors) to prevent flow breaks

#### 2. Feature Extractor Agent (`app/agents/featureExtractorAgent.js`)
- Added intelligent file prioritization (important extensions and files)
- Implemented content truncation (2,000 chars max per file)
- Added token estimation and dynamic file selection
- Enhanced error handling with fallback responses
- Added comprehensive logging
- Handles error files gracefully

#### 3. README Generator Agent (`app/agents/readmeGeneratorAgent.js`)
- Added input validation and sanitization
- Implemented fallback README generation on errors
- Enhanced error handling and logging
- Added data validation for features, tech stack, and summary

#### 4. Direct Flow Controller (`app/controllers/readmeGenerator.js`)
- Replaced LangGraph with simple, direct agent chain
- Clear step-by-step logging for easy debugging
- Robust error handling at each step
- Simplified data flow: repoReader → featureExtractor → readmeGenerator

## Features

- **Intelligent File Processing**: Automatically filters and prioritizes important repository files
- **Token Management**: Prevents context length errors through smart content management
- **Robust Error Handling**: Graceful fallbacks and comprehensive error reporting
- **Professional README Generation**: Creates well-structured, informative README files
- **GitHub Integration**: Seamless integration with GitHub repositories
- **Simple Architecture**: Direct agent chain without complex orchestration

## Tech Stack

- **Node.js** with ES modules
- **LangChain Core** for AI agent framework
- **OpenAI GPT-4** for content generation
- **Express.js** for API endpoints
- **MongoDB** for user data storage
- **GitHub API** for repository access

## Installation

```bash
npm install
```

## Usage

```bash
# Start the server
npm start

# Test the API
curl -X POST http://localhost:3000/api/generate-readme \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/username/repo",
    "Username": "username"
  }'
```

## API Endpoints

- `POST /api/generate-readme` - Generate README for a repository

### Request Body
```json
{
  "repoUrl": "https://github.com/username/repository",
  "Username": "github-username"
}
```

### Response
```json
{
  "success": true,
  "readme": "# Generated README content..."
}
```

## Environment Variables

- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `OPENAI_API_KEY` - OpenAI API key
- `DATABASE_URL` - MongoDB connection string

## Architecture

The API now uses a simple, direct flow:

1. **Repository Reader**: Fetches and filters repository files from GitHub
2. **Feature Extractor**: Analyzes files to extract features, tech stack, and summary
3. **README Generator**: Creates a professional README based on extracted information

Each step has robust error handling and logging for easy debugging.