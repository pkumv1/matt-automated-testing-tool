/**
 * JIRA Integration Service
 * Handles code acquisition from JIRA projects, issues, and attachments
 */

interface JiraConfig {
  serverUrl: string;
  projectKey: string;
  email: string;
  apiToken: string;
}

interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  description?: string;
  issueType: string;
  status: string;
  priority: string;
  attachments: JiraAttachment[];
  components: string[];
  fixVersions: string[];
}

interface JiraAttachment {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  content?: string;
  downloadUrl: string;
}

interface JiraProject {
  id: string;
  key: string;
  name: string;
  description?: string;
  projectTypeKey: string;
  components: any[];
  versions: any[];
}

export class JiraIntegrationService {
  /**
   * Acquire project data from JIRA
   */
  async acquireProject(config: JiraConfig): Promise<{
    project: JiraProject;
    issues: JiraIssue[];
    attachments: JiraAttachment[];
    success: boolean;
    error?: string;
  }> {
    try {
      console.log(`🔄 Acquiring project from JIRA: ${config.projectKey} at ${config.serverUrl}`);

      // Test connection first
      const connectionTest = await this.testConnection(config);
      if (!connectionTest.connected) {
        throw new Error(`JIRA connection failed: ${connectionTest.error}`);
      }

      // Get project metadata
      const project = await this.getProject(config);
      console.log(`📋 Found project: ${project.name}`);

      // Get all issues in the project
      const issues = await this.getProjectIssues(config);
      console.log(`🎫 Found ${issues.length} issues`);

      // Collect all attachments
      const allAttachments: JiraAttachment[] = [];
      for (const issue of issues) {
        allAttachments.push(...issue.attachments);
      }

      console.log(`📎 Found ${allAttachments.length} total attachments`);

      // Download code-related attachments
      const codeAttachments = allAttachments.filter(att => 
        this.isCodeFile(att.filename) || 
        this.isArchiveFile(att.filename)
      );

      for (const attachment of codeAttachments.slice(0, 50)) { // Limit to prevent overwhelming
        try {
          attachment.content = await this.downloadAttachment(config, attachment.id);
        } catch (error) {
          console.warn(`⚠️ Failed to download attachment ${attachment.filename}:`, error);
        }
      }

      console.log(`✅ Successfully acquired JIRA project with ${issues.length} issues and ${codeAttachments.length} code attachments`);

      return {
        project,
        issues,
        attachments: allAttachments,
        success: true
      };

    } catch (error) {
      console.error('❌ JIRA acquisition failed:', error);
      return {
        project: {} as JiraProject,
        issues: [],
        attachments: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get project information
   */
  private async getProject(config: JiraConfig): Promise<JiraProject> {
    const response = await this.makeJiraRequest(
      config,
      `/rest/api/3/project/${config.projectKey}?expand=components,versions`
    );

    if (!response.ok) {
      throw new Error(`Failed to get project: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all issues in a project
   */
  private async getProjectIssues(config: JiraConfig): Promise<JiraIssue[]> {
    const issues: JiraIssue[] = [];
    let startAt = 0;
    const maxResults = 100;

    do {
      const jql = `project = ${config.projectKey} ORDER BY created DESC`;
      const url = `/rest/api/3/search?jql=${encodeURIComponent(jql)}&startAt=${startAt}&maxResults=${maxResults}&expand=attachments`;
      
      const response = await this.makeJiraRequest(config, url);
      
      if (!response.ok) {
        throw new Error(`Failed to get issues: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      for (const issue of data.issues || []) {
        const attachments: JiraAttachment[] = (issue.fields.attachment || []).map((att: any) => ({
          id: att.id,
          filename: att.filename,
          size: att.size,
          mimeType: att.mimeType,
          downloadUrl: att.content
        }));

        issues.push({
          id: issue.id,
          key: issue.key,
          summary: issue.fields.summary,
          description: issue.fields.description?.content?.[0]?.content?.[0]?.text || '',
          issueType: issue.fields.issuetype?.name || '',
          status: issue.fields.status?.name || '',
          priority: issue.fields.priority?.name || '',
          attachments,
          components: (issue.fields.components || []).map((c: any) => c.name),
          fixVersions: (issue.fields.fixVersions || []).map((v: any) => v.name)
        });
      }

      startAt += maxResults;
      
      // Break if we've got all issues
      if (startAt >= data.total) {
        break;
      }
      
    } while (issues.length < 1000); // Safety limit

    return issues;
  }

  /**
   * Download attachment content
   */
  private async downloadAttachment(config: JiraConfig, attachmentId: string): Promise<string> {
    const response = await this.makeJiraRequest(
      config,
      `/rest/api/3/attachment/content/${attachmentId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to download attachment: ${response.status} ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Test JIRA connection
   */
  async testConnection(config: JiraConfig): Promise<{
    connected: boolean;
    userInfo?: any;
    error?: string;
  }> {
    try {
      const response = await this.makeJiraRequest(config, '/rest/api/3/myself');
      
      if (!response.ok) {
        throw new Error(`Connection test failed: ${response.status} ${response.statusText}`);
      }

      const userInfo = await response.json();

      return {
        connected: true,
        userInfo
      };

    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Make authenticated request to JIRA API
   */
  private async makeJiraRequest(config: JiraConfig, endpoint: string): Promise<Response> {
    const url = `${config.serverUrl.replace(/\/+$/, '')}${endpoint}`;
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');

    return fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Check if file is a code file
   */
  private isCodeFile(filename: string): boolean {
    const codeExtensions = [
      '.js', '.ts', '.jsx', '.tsx', '.vue', '.py', '.java', '.c', '.cpp', '.cs',
      '.php', '.rb', '.go', '.rs', '.kt', '.swift', '.dart', '.scala', '.clj',
      '.html', '.css', '.scss', '.sass', '.less', '.xml', '.json', '.yaml', '.yml',
      '.sql', '.sh', '.ps1', '.bat', '.dockerfile', '.md', '.txt', '.log',
      '.properties', '.ini', '.cfg', '.conf', '.toml'
    ];
    
    return codeExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  /**
   * Check if file is an archive
   */
  private isArchiveFile(filename: string): boolean {
    const archiveExtensions = ['.zip', '.tar', '.tar.gz', '.tgz', '.rar', '.7z'];
    return archiveExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }
}

export const jiraService = new JiraIntegrationService();