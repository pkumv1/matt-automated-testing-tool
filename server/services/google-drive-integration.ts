/**
 * Google Drive Integration Service
 * Handles code acquisition from Google Drive files and folders
 */

interface GoogleDriveConfig {
  fileId: string;
  accessToken: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  content?: string;
  downloadUrl?: string;
}

export class GoogleDriveIntegrationService {
  private static readonly DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
  private static readonly DOWNLOAD_BASE = 'https://www.googleapis.com/drive/v3/files';

  /**
   * Acquire project files from Google Drive
   */
  async acquireProject(config: GoogleDriveConfig): Promise<{
    files: DriveFile[];
    metadata: any;
    success: boolean;
    error?: string;
  }> {
    try {
      console.log(`🔄 Acquiring project from Google Drive file: ${config.fileId}`);

      // Get file metadata
      const metadata = await this.getFileMetadata(config.fileId, config.accessToken);
      
      if (!metadata) {
        throw new Error('File not found or access denied');
      }

      console.log(`📄 Found file: ${metadata.name} (${metadata.mimeType})`);

      // Handle different file types
      let files: DriveFile[] = [];

      if (metadata.mimeType === 'application/vnd.google-apps.folder') {
        // Handle folder - get all files recursively
        files = await this.getFolderContents(config.fileId, config.accessToken);
      } else if (metadata.mimeType === 'application/zip' || 
                 metadata.name?.endsWith('.zip') || 
                 metadata.name?.endsWith('.tar.gz')) {
        // Handle archive files
        const content = await this.downloadFile(config.fileId, config.accessToken);
        files = [{
          id: metadata.id,
          name: metadata.name,
          mimeType: metadata.mimeType,
          content: content
        }];
      } else {
        // Handle single file
        const content = await this.downloadFile(config.fileId, config.accessToken);
        files = [{
          id: metadata.id,
          name: metadata.name,
          mimeType: metadata.mimeType,
          content: content
        }];
      }

      console.log(`✅ Successfully acquired ${files.length} files from Google Drive`);

      return {
        files,
        metadata,
        success: true
      };

    } catch (error) {
      console.error('❌ Google Drive acquisition failed:', error);
      return {
        files: [],
        metadata: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get file metadata from Google Drive
   */
  private async getFileMetadata(fileId: string, accessToken: string): Promise<any> {
    const response = await fetch(
      `${GoogleDriveIntegrationService.DRIVE_API_BASE}/files/${fileId}?fields=id,name,mimeType,size,parents,createdTime,modifiedTime`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get file metadata: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Download file content from Google Drive
   */
  private async downloadFile(fileId: string, accessToken: string): Promise<string> {
    const response = await fetch(
      `${GoogleDriveIntegrationService.DOWNLOAD_BASE}/${fileId}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Get all files in a folder recursively
   */
  private async getFolderContents(folderId: string, accessToken: string): Promise<DriveFile[]> {
    const files: DriveFile[] = [];
    let pageToken: string | undefined;

    do {
      const url = new URL(`${GoogleDriveIntegrationService.DRIVE_API_BASE}/files`);
      url.searchParams.set('q', `'${folderId}' in parents and trashed=false`);
      url.searchParams.set('fields', 'nextPageToken,files(id,name,mimeType,parents)');
      
      if (pageToken) {
        url.searchParams.set('pageToken', pageToken);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to list folder contents: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      for (const file of data.files || []) {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          // Recursively get folder contents
          const subFiles = await this.getFolderContents(file.id, accessToken);
          files.push(...subFiles);
        } else {
          // Download file content
          try {
            const content = await this.downloadFile(file.id, accessToken);
            files.push({
              id: file.id,
              name: file.name,
              mimeType: file.mimeType,
              content: content
            });
          } catch (error) {
            console.warn(`⚠️ Failed to download file ${file.name}:`, error);
            // Continue with other files
          }
        }
      }

      pageToken = data.nextPageToken;
    } while (pageToken);

    return files;
  }

  /**
   * Test Google Drive connection
   */
  async testConnection(accessToken: string): Promise<{
    connected: boolean;
    userInfo?: any;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `${GoogleDriveIntegrationService.DRIVE_API_BASE}/about?fields=user,storageQuota`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

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
}

export const googleDriveService = new GoogleDriveIntegrationService();