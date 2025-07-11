import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Github, Loader2, CheckCircle, AlertCircle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GitHubIntegrationProps {
  onProjectCreated: (project: any) => void;
}

export default function GitHubIntegration({ onProjectCreated }: GitHubIntegrationProps) {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('');
  const [path, setPath] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAcquiring, setIsAcquiring] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const testConnection = async () => {
    setIsConnecting(true);
    setConnectionStatus('testing');
    
    try {
      const response = await fetch('/api/integrations/github/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken })
      });
      
      const data = await response.json();
      
      if (data.connected) {
        setConnectionStatus('connected');
        toast({
          title: "Connected to GitHub",
          description: data.userInfo ? `Logged in as ${data.userInfo.login}` : "Connection successful",
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "Connection Failed",
          description: data.error || "Unable to connect to GitHub",
          variant: "destructive"
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Connection Error",
        description: "Failed to test GitHub connection",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const searchRepositories = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch('/api/integrations/github/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, accessToken })
      });
      
      const data = await response.json();
      
      if (data.success && data.repositories) {
        setSearchResults(data.repositories);
        if (data.repositories.length === 0) {
          toast({
            title: "No Results",
            description: "No repositories found matching your search",
          });
        }
      } else {
        toast({
          title: "Search Failed",
          description: data.error || "Unable to search repositories",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to search GitHub repositories",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const selectRepository = (repository: any) => {
    const [ownerName, repoName] = repository.full_name.split('/');
    setOwner(ownerName);
    setRepo(repoName);
    setProjectName(repository.name);
    setDescription(repository.description || `GitHub repository: ${repository.full_name}`);
    setBranch(repository.default_branch);
    setSearchResults([]);
    setSearchQuery('');
  };

  const acquireProject = async () => {
    if (!owner || !repo || !projectName) {
      toast({
        title: "Missing Information",
        description: "Please provide owner, repository name, and project name",
        variant: "destructive"
      });
      return;
    }

    setIsAcquiring(true);
    
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          description: description || `GitHub repository ${owner}/${repo}`,
          sourceType: 'github',
          sourceUrl: `https://github.com/${owner}/${repo}`,
          repositoryData: {
            owner,
            repo,
            branch: branch || undefined,
            path: path || undefined,
            accessToken: accessToken || undefined
          }
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create project');
      }
      
      const project = await response.json();
      
      toast({
        title: "Project Created",
        description: `Successfully acquired GitHub repository ${owner}/${repo}`,
      });
      
      onProjectCreated(project);
    } catch (error) {
      toast({
        title: "Acquisition Failed",
        description: error instanceof Error ? error.message : "Failed to acquire GitHub repository",
        variant: "destructive"
      });
    } finally {
      setIsAcquiring(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="w-5 h-5" />
          GitHub Repository
        </CardTitle>
        <CardDescription>
          Import code from a GitHub repository for analysis and testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Access Token Section */}
        <div className="space-y-2">
          <Label htmlFor="github-token">GitHub Access Token (Optional)</Label>
          <div className="flex gap-2">
            <Input
              id="github-token"
              type="password"
              placeholder="ghp_xxxxx (for private repos)"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
            <Button 
              variant="outline" 
              onClick={testConnection}
              disabled={isConnecting || !accessToken}
            >
              {isConnecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : connectionStatus === 'connected' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                'Test'
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Leave empty for public repositories. For private repos, generate a token at GitHub Settings → Developer settings → Personal access tokens
          </p>
        </div>

        {connectionStatus === 'connected' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Successfully connected to GitHub. You can now access private repositories.
            </AlertDescription>
          </Alert>
        )}

        {/* Repository Search */}
        <div className="space-y-2">
          <Label>Search Repositories</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Search GitHub repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchRepositories()}
            />
            <Button
              variant="outline"
              onClick={searchRepositories}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="border rounded-lg p-4 space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map((repo) => (
              <div
                key={repo.id}
                className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer"
                onClick={() => selectRepository(repo)}
              >
                <div className="flex-1">
                  <div className="font-medium">{repo.full_name}</div>
                  <div className="text-sm text-muted-foreground">{repo.description}</div>
                  <div className="text-xs text-muted-foreground">
                    ⭐ {repo.stargazers_count} • {repo.language || 'Unknown'}
                  </div>
                </div>
                <Button variant="ghost" size="sm">Select</Button>
              </div>
            ))}
          </div>
        )}

        {/* Manual Repository Input */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="github-owner">Owner/Organization *</Label>
            <Input
              id="github-owner"
              placeholder="e.g., facebook"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github-repo">Repository Name *</Label>
            <Input
              id="github-repo"
              placeholder="e.g., react"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="github-branch">Branch (Optional)</Label>
            <Input
              id="github-branch"
              placeholder="e.g., main, develop"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github-path">Path (Optional)</Label>
            <Input
              id="github-path"
              placeholder="e.g., src/components"
              value={path}
              onChange={(e) => setPath(e.target.value)}
            />
          </div>
        </div>

        {/* Project Details */}
        <div className="space-y-2">
          <Label htmlFor="project-name">Project Name *</Label>
          <Input
            id="project-name"
            placeholder="Enter a name for your project"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="project-desc">Description</Label>
          <Input
            id="project-desc"
            placeholder="Brief description of the project"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <Button 
          onClick={acquireProject} 
          disabled={isAcquiring || !owner || !repo || !projectName}
          className="w-full"
        >
          {isAcquiring ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Acquiring Repository...
            </>
          ) : (
            <>
              <Github className="mr-2 h-4 w-4" />
              Import GitHub Repository
            </>
          )}
        </Button>

        {owner && repo && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Repository URL: https://github.com/{owner}/{repo}
              {branch && ` (branch: ${branch})`}
              {path && ` (path: ${path})`}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}