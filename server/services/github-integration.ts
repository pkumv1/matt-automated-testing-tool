/**
 * GitHub Integration Service
 * Handles code acquisition from GitHub repositories
 */

import { ENV } from '../config';

interface GitHubConfig {
  owner: string;
  repo: string;
  branch?: string;
  path?: string;
  accessToken?: string;
}

interface GitHubFile {
  path: string;
  name: string;
  type: 'file' | 'dir';
  content?: string;
  sha: string;
  size: number;
  url: string;
  download_url?: string;
}

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  private: boolean;
  default_branch: string;
  language?: string;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  created_at: string;
  updated_at: string;
}

export class GitHubIntegrationService {
  private static readonly GITHUB_API_BASE = 'https://api.github.com';

  /**
   * Acquire project files from GitHub repository
   */
  async acquireProject(config: GitHubConfig): Promise<{
    repository: GitHubRepository;
    files: GitHubFile[];
    metadata: any;
    success: boolean;
    error?: string;
  }> {
    try {
      console.log(`🔄 Acquiring project from GitHub: ${config.owner}/${config.repo}`);

      // Get repository metadata
      const repository = await this.getRepository(config);
      console.log(`📦 Found repository: ${repository.full_name} (${repository.language || 'Unknown language'})`);

      // Get repository content
      const branch = config.branch || repository.default_branch;
      const path = config.path || '';
      
      console.log(`🌿 Fetching content from branch: ${branch}`);
      const files = await this.getRepositoryContent(config, path, branch);
      
      // Filter and download code files
      const codeFiles = await this.downloadCodeFiles(config, files, branch);
      
      console.log(`✅ Successfully acquired ${codeFiles.length} code files from GitHub`);

      return {
        repository,
        files: codeFiles,
        metadata: {
          branch,
          path,
          totalFiles: codeFiles.length,
          languages: await this.getRepositoryLanguages(config),
          readme: await this.getReadme(config, branch)
        },
        success: true
      };

    } catch (error) {
      console.error('❌ GitHub acquisition failed:', error);
      return {
        repository: {} as GitHubRepository,
        files: [],
        metadata: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get repository information
   */
  private async getRepository(config: GitHubConfig): Promise<GitHubRepository> {
    const response = await this.makeGitHubRequest(
      config,
      `/repos/${config.owner}/${config.repo}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get repository: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get repository content (files and directories)
   */
  private async getRepositoryContent(
    config: GitHubConfig, 
    path: string = '', 
    branch: string
  ): Promise<GitHubFile[]> {
    const url = `/repos/${config.owner}/${config.repo}/contents/${path}`;
    const params = new URLSearchParams({ ref: branch });
    
    const response = await this.makeGitHubRequest(config, `${url}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get repository content: ${response.status} ${response.statusText}`);
    }

    const content = await response.json();
    
    // If it's a single file, return it as an array
    if (!Array.isArray(content)) {
      return [content];
    }

    // Recursively get content from subdirectories
    const allFiles: GitHubFile[] = [];
    
    for (const item of content) {
      if (item.type === 'file') {
        allFiles.push(item);
      } else if (item.type === 'dir') {
        // Recursively get directory contents
        const subFiles = await this.getRepositoryContent(config, item.path, branch);
        allFiles.push(...subFiles);
      }
    }

    return allFiles;
  }

  /**
   * Download code files
   */
  private async downloadCodeFiles(
    config: GitHubConfig,
    files: GitHubFile[],
    branch: string
  ): Promise<GitHubFile[]> {
    const codeFiles = files.filter(file => 
      this.isCodeFile(file.name) && 
      file.size < 1024 * 1024 // Skip files larger than 1MB
    );

    const downloadedFiles: GitHubFile[] = [];

    // Limit concurrent downloads
    const batchSize = 10;
    for (let i = 0; i < codeFiles.length; i += batchSize) {
      const batch = codeFiles.slice(i, i + batchSize);
      
      const downloads = batch.map(async (file) => {
        try {
          const content = await this.downloadFile(config, file.path, branch);
          return {
            ...file,
            content: Buffer.from(content, 'base64').toString('utf-8')
          };
        } catch (error) {
          console.warn(`⚠️ Failed to download file ${file.path}:`, error);
          return file;
        }
      });

      const results = await Promise.all(downloads);
      downloadedFiles.push(...results);
    }

    return downloadedFiles;
  }

  /**
   * Download a single file
   */
  private async downloadFile(
    config: GitHubConfig,
    path: string,
    branch: string
  ): Promise<string> {
    const url = `/repos/${config.owner}/${config.repo}/contents/${path}`;
    const params = new URLSearchParams({ ref: branch });
    
    const response = await this.makeGitHubRequest(config, `${url}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.content;
  }

  /**
   * Get repository languages
   */
  private async getRepositoryLanguages(config: GitHubConfig): Promise<Record<string, number>> {
    try {
      const response = await this.makeGitHubRequest(
        config,
        `/repos/${config.owner}/${config.repo}/languages`
      );

      if (!response.ok) {
        return {};
      }

      return response.json();
    } catch (error) {
      console.warn('Failed to get repository languages:', error);
      return {};
    }
  }

  /**
   * Get README content
   */
  private async getReadme(config: GitHubConfig, branch: string): Promise<string | null> {
    try {
      const response = await this.makeGitHubRequest(
        config,
        `/repos/${config.owner}/${config.repo}/readme?ref=${branch}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return Buffer.from(data.content, 'base64').toString('utf-8');
    } catch (error) {
      console.warn('Failed to get README:', error);
      return null;
    }
  }

  /**
   * Test GitHub connection
   */
  async testConnection(accessToken?: string): Promise<{
    connected: boolean;
    userInfo?: any;
    rateLimit?: any;
    error?: string;
  }> {
    try {
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'MATT-Automated-Testing-Tool'
      };

      const token = accessToken || ENV.GITHUB_TOKEN;
      if (token) {
        headers['Authorization'] = `token ${token}`;
      }

      // Get user info
      const userResponse = await fetch(`${GitHubIntegrationService.GITHUB_API_BASE}/user`, {
        headers
      });

      // Get rate limit info
      const rateLimitResponse = await fetch(`${GitHubIntegrationService.GITHUB_API_BASE}/rate_limit`, {
        headers
      });

      if (!userResponse.ok && userResponse.status !== 401) {
        throw new Error(`Connection test failed: ${userResponse.status} ${userResponse.statusText}`);
      }

      const userInfo = userResponse.ok ? await userResponse.json() : null;
      const rateLimit = rateLimitResponse.ok ? await rateLimitResponse.json() : null;

      return {
        connected: true,
        userInfo,
        rateLimit,
        error: userResponse.status === 401 ? 'Invalid token or unauthorized' : undefined
      };

    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Search repositories
   */
  async searchRepositories(query: string, config?: Partial<GitHubConfig>): Promise<{
    repositories: GitHubRepository[];
    total_count: number;
    success: boolean;
    error?: string;
  }> {
    try {
      const params = new URLSearchParams({
        q: query,
        sort: 'stars',
        order: 'desc',
        per_page: '10'
      });

      const response = await this.makeGitHubRequest(
        config || {},
        `/search/repositories?${params}`
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        repositories: data.items,
        total_count: data.total_count,
        success: true
      };

    } catch (error) {
      return {
        repositories: [],
        total_count: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Make authenticated request to GitHub API
   */
  private async makeGitHubRequest(config: GitHubConfig, endpoint: string): Promise<Response> {
    const url = `${GitHubIntegrationService.GITHUB_API_BASE}${endpoint}`;
    
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MATT-Automated-Testing-Tool'
    };

    // Use provided token or fall back to environment token
    const token = config.accessToken || ENV.GITHUB_TOKEN;
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    return fetch(url, { headers });
  }

  /**
   * Check if file is a code file
   */
  private isCodeFile(filename: string): boolean {
    const codeExtensions = [
      '.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte', '.py', '.java', '.c', '.cpp', 
      '.cs', '.php', '.rb', '.go', '.rs', '.kt', '.swift', '.dart', '.scala', '.clj',
      '.html', '.css', '.scss', '.sass', '.less', '.xml', '.json', '.yaml', '.yml',
      '.sql', '.sh', '.ps1', '.bat', '.dockerfile', '.md', '.txt', '.env.example',
      '.properties', '.ini', '.cfg', '.conf', '.toml', '.lock', '.gitignore',
      '.eslintrc', '.prettierrc', '.babelrc', 'Makefile', 'Gemfile', 'Pipfile'
    ];
    
    const lowerFilename = filename.toLowerCase();
    
    // Check extensions
    if (codeExtensions.some(ext => lowerFilename.endsWith(ext))) {
      return true;
    }
    
    // Check specific filenames
    const codeFilenames = [
      'dockerfile', 'makefile', 'gemfile', 'pipfile', 'rakefile',
      'package.json', 'tsconfig.json', 'webpack.config.js', 'vite.config.ts'
    ];
    
    return codeFilenames.includes(lowerFilename);
  }
}

export const githubService = new GitHubIntegrationService();