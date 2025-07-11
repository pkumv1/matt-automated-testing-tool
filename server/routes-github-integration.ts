// GitHub Integration Routes - Add these to your existing routes.ts file

import { githubService } from "./services/github-integration";

// Add this import at the top of your routes.ts file:
// import { githubService } from "./services/github-integration";

// Add this in the project creation endpoint after the JIRA section:
if (validatedData.sourceType === 'github') {
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

// Add these new endpoints at the end of your routes.ts file:

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