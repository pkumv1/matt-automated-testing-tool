# GitHub Integration Implementation Guide

## Overview

The MATT application already has Google Drive and JIRA integrations working. This guide shows how to complete the GitHub integration by updating the backend routes.

## Backend Implementation

### 1. Update server/routes.ts

Add the GitHub service import at the top of the file:

```typescript
import { githubService } from "./services/github-integration";
```

### 2. Add GitHub handling in project creation

In the `/api/projects` POST endpoint, add the GitHub case after the JIRA section (around line 120):

```typescript
} else if (validatedData.sourceType === 'github') {
  // Acquiring project from GitHub
  const githubData = validatedData.repositoryData as any;
  const githubResult = await githubService.acquireProject({
    owner: githubData.owner,
    repo: githubData.repo,
    branch: githubData.branch,
    path: githubData.path,
    accessToken: githubData.accessToken
  });
  
  if (!githubResult.success) {
    return res.status(400).json({ 
      message: `GitHub acquisition failed: ${githubResult.error}` 
    });
  }
  
  // Store GitHub acquisition results
  enhancedProject.repositoryData = {
    ...githubData,
    acquisitionResult: githubResult,
    fileCount: githubResult.files.length,
    repository: githubResult.repository
  };
  // Successfully acquired GitHub repository
}
```

### 3. Add GitHub-specific endpoints

Add these endpoints at the end of the routes file (before the `createServer` call):

```typescript
// Test GitHub connection
app.post("/api/integrations/github/test", async (req, res) => {
  try {
    const { accessToken } = req.body;
    const result = await githubService.testConnection(accessToken);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Failed to test GitHub connection" });
  }
});

// Search GitHub repositories
app.post("/api/integrations/github/search", async (req, res) => {
  try {
    const { query, accessToken } = req.body;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }
    
    const result = await githubService.searchRepositories(query, { accessToken });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Failed to search GitHub repositories" });
  }
});
```

## Frontend Updates (Already Implemented)

The frontend already supports GitHub integration through the `code-acquisition.tsx` component. The component needs to be updated to use the correct repository data structure:

For GitHub projects, the `repositoryData` should contain:
- `owner`: GitHub username or organization
- `repo`: Repository name
- `branch`: Branch name (optional)
- `path`: Path within repository (optional)
- `accessToken`: GitHub personal access token (optional, for private repos)

## Testing the Integration

1. **Public Repository Test**:
   - Use URL: `https://github.com/facebook/react`
   - Leave access token empty
   - Should successfully import the repository

2. **Private Repository Test**:
   - Generate a GitHub personal access token at: https://github.com/settings/tokens
   - Use a private repository URL
   - Provide the access token
   - Should successfully import with authentication

3. **Connection Test**:
   - Provide a valid GitHub token
   - Click "Test Connection"
   - Should show connected status with user info

## Environment Variables

Make sure `GITHUB_TOKEN` is set in your `.env` file if you want to use a default token:

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

## Troubleshooting

1. **Rate Limiting**: GitHub API has rate limits. Authenticated requests have higher limits (5000/hour vs 60/hour).

2. **Large Repositories**: The service limits file downloads to prevent overwhelming the system. Only files under 1MB are downloaded by default.

3. **Access Errors**: Ensure the token has the necessary scopes:
   - `repo` for private repositories
   - `public_repo` for public repositories only

## Complete Integration Checklist

- [x] GitHub service implementation (`server/services/github-integration.ts`)
- [x] Frontend component implementation (already in `code-acquisition.tsx`)
- [ ] Update `server/routes.ts` with GitHub handling
- [ ] Test with public repository
- [ ] Test with private repository
- [ ] Test connection endpoint
- [ ] Add GITHUB_TOKEN to production environment