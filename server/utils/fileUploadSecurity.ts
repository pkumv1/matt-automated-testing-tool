import { Request } from 'express';
import path from 'path';
import crypto from 'crypto';

/**
 * Allowed file types for upload
 */
const ALLOWED_MIME_TYPES = new Set([
  // Source code files
  'text/plain',
  'text/x-python',
  'text/x-java-source',
  'text/x-c++src',
  'text/x-csrc',
  'text/x-script.python',
  'application/javascript',
  'text/javascript',
  'application/typescript',
  'text/typescript',
  'text/x-typescript',
  'application/json',
  'text/x-yaml',
  'application/x-yaml',
  'text/yaml',
  'application/xml',
  'text/xml',
  'text/html',
  'text/css',
  'text/markdown',
  
  // Documentation files
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  
  // Archive files (for source code repositories)
  'application/zip',
  'application/x-tar',
  'application/gzip',
  'application/x-gzip',
]);

/**
 * Allowed file extensions
 */
const ALLOWED_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.scss', '.sass',
  '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.php', '.rb', '.go',
  '.rs', '.swift', '.kt', '.scala', '.clj', '.hs', '.elm', '.dart', '.vue',
  '.md', '.txt', '.yml', '.yaml', '.xml', '.toml', '.ini', '.conf', '.config',
  '.sql', '.sh', '.bat', '.ps1', '.dockerfile', '.gitignore', '.env.example',
  '.pdf', '.doc', '.docx', '.zip', '.tar', '.gz', '.tar.gz'
]);

/**
 * Dangerous file extensions that should never be allowed
 */
const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.vbe', '.js', 
  '.jse', '.jar', '.msi', '.dll', '.sys', '.drv', '.app', '.deb', '.rpm',
  '.dmg', '.pkg', '.run', '.bin', '.ps1', '.psm1', '.psd1', '.ps1xml'
]);

/**
 * Maximum file size (10MB for individual files)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Maximum total upload size (50MB for all files combined)
 */
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Maximum number of files per upload
 */
const MAX_FILE_COUNT = 100;

/**
 * Validate file type and security
 */
export function validateFileUpload(file: Express.Multer.File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File "${file.originalname}" exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
    };
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Block dangerous extensions
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return { 
      valid: false, 
      error: `File type "${ext}" is not allowed for security reasons` 
    };
  }

  // Allow only specific extensions
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { 
      valid: false, 
      error: `File type "${ext}" is not supported. Allowed types: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}` 
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return { 
      valid: false, 
      error: `MIME type "${file.mimetype}" is not allowed` 
    };
  }

  // Check for null bytes (path traversal protection)
  if (file.originalname.includes('\x00')) {
    return { 
      valid: false, 
      error: 'Invalid file name contains null bytes' 
    };
  }

  // Check for path traversal attempts
  if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
    return { 
      valid: false, 
      error: 'File name contains invalid path characters' 
    };
  }

  // Check filename length
  if (file.originalname.length > 255) {
    return { 
      valid: false, 
      error: 'File name is too long (maximum 255 characters)' 
    };
  }

  // Basic content validation for text files
  if (file.mimetype.startsWith('text/')) {
    try {
      const content = file.buffer.toString('utf8');
      // Check for binary content in text files
      if (content.includes('\x00')) {
        return { 
          valid: false, 
          error: 'Text file contains binary data' 
        };
      }
    } catch (error) {
      return { 
        valid: false, 
        error: 'Unable to read file content as text' 
      };
    }
  }

  return { valid: true };
}

/**
 * Validate entire upload request
 */
export function validateUploadRequest(files: Express.Multer.File[]): { valid: boolean; error?: string } {
  // Check file count
  if (files.length > MAX_FILE_COUNT) {
    return { 
      valid: false, 
      error: `Too many files. Maximum ${MAX_FILE_COUNT} files allowed` 
    };
  }

  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    return { 
      valid: false, 
      error: `Total upload size exceeds maximum of ${MAX_TOTAL_SIZE / (1024 * 1024)}MB` 
    };
  }

  // Validate each file
  for (const file of files) {
    const validation = validateFileUpload(file);
    if (!validation.valid) {
      return validation;
    }
  }

  return { valid: true };
}

/**
 * Generate secure filename
 */
export function generateSecureFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  
  // Sanitize base name
  const safeName = baseName
    .replace(/[^a-zA-Z0-9\-_]/g, '_')
    .substring(0, 50); // Limit length
  
  return `${safeName}_${timestamp}_${randomBytes}${ext}`;
}

/**
 * Content-based file type detection
 */
export function detectFileType(buffer: Buffer): string | null {
  // Check for common file signatures
  const signatures = {
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/gif': [0x47, 0x49, 0x46],
    'application/pdf': [0x25, 0x50, 0x44, 0x46],
    'application/zip': [0x50, 0x4B, 0x03, 0x04],
    'application/x-executable': [0x4D, 0x5A] // PE executable
  };

  for (const [mimeType, signature] of Object.entries(signatures)) {
    if (buffer.length >= signature.length) {
      let matches = true;
      for (let i = 0; i < signature.length; i++) {
        if (buffer[i] !== signature[i]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        return mimeType;
      }
    }
  }

  return null;
}

/**
 * Validate file content matches declared type
 */
export function validateFileContent(file: Express.Multer.File): { valid: boolean; error?: string } {
  const detectedType = detectFileType(file.buffer);
  
  // For executable files, always reject
  if (detectedType === 'application/x-executable') {
    return { 
      valid: false, 
      error: 'Executable files are not allowed' 
    };
  }

  // For images in a code repository tool, reject
  if (detectedType && detectedType.startsWith('image/')) {
    return { 
      valid: false, 
      error: 'Image files are not supported for code analysis' 
    };
  }

  return { valid: true };
}

export {
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
  MAX_FILE_COUNT,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS
};