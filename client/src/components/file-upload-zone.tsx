import React, { useCallback, useState } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, FolderOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileItem {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
  secureFilename?: string;
}

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  onUploadComplete: (results: any[]) => void;
  onUploadError: (error: string) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  disabled?: boolean;
}

const ALLOWED_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.scss', '.sass',
  '.py', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.php', '.rb', '.go',
  '.rs', '.swift', '.kt', '.scala', '.clj', '.hs', '.elm', '.dart', '.vue',
  '.md', '.txt', '.yml', '.yaml', '.xml', '.toml', '.ini', '.conf', '.config',
  '.sql', '.sh', '.dockerfile', '.gitignore', '.env.example',
  '.pdf', '.doc', '.docx', '.zip', '.tar', '.gz'
];

export function FileUploadZone({
  onFilesSelected,
  onUploadComplete,
  onUploadError,
  maxFiles = 100,
  maxFileSize = 10, // 10MB default
  acceptedTypes = ALLOWED_EXTENSIONS,
  disabled = false
}: FileUploadZoneProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileExtension = (filename: string) => {
    return '.' + filename.split('.').pop()?.toLowerCase();
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    // Check file extension
    const extension = getFileExtension(file.name);
    if (!acceptedTypes.includes(extension)) {
      return `File type ${extension} is not supported`;
    }

    // Check for dangerous filenames
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      return 'Invalid file name';
    }

    return null;
  };

  const handleFiles = (newFiles: File[]) => {
    if (disabled) return;

    const validFiles: FileItem[] = [];
    const errors: string[] = [];

    // Check total file count
    if (files.length + newFiles.length > maxFiles) {
      errors.push(`Cannot upload more than ${maxFiles} files`);
      return;
    }

    newFiles.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9),
          status: 'pending',
          progress: 0
        });
      }
    });

    if (errors.length > 0) {
      onUploadError(errors.join(', '));
      return;
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      onFilesSelected(validFiles.map(item => item.file));
    }
  };

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragActive(true);
    }
  }, [disabled]);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, [disabled, files.length, maxFiles]);

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
      e.target.value = ''; // Reset input
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(item => item.id !== id));
  };

  const uploadFiles = async () => {
    if (files.length === 0 || isUploading) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    const fileItems = files.filter(item => item.status === 'pending');

    fileItems.forEach((item) => {
      formData.append('files', item.file);
    });

    try {
      // Update file statuses to uploading
      setFiles(prev => prev.map(item => 
        item.status === 'pending' 
          ? { ...item, status: 'uploading' as const, progress: 0 }
          : item
      ));

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded * 100) / e.total);
          setUploadProgress(progress);
          
          // Update individual file progress
          setFiles(prev => prev.map(item => 
            item.status === 'uploading'
              ? { ...item, progress }
              : item
          ));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          
          // Update file statuses to completed
          setFiles(prev => prev.map((item, index) => {
            if (item.status === 'uploading') {
              const uploadedFile = response.files[index];
              return {
                ...item,
                status: 'completed' as const,
                progress: 100,
                secureFilename: uploadedFile?.secureFilename
              };
            }
            return item;
          }));

          onUploadComplete(response.files);
        } else {
          const errorResponse = JSON.parse(xhr.responseText);
          throw new Error(errorResponse.message || 'Upload failed');
        }
      });

      xhr.addEventListener('error', () => {
        setFiles(prev => prev.map(item => 
          item.status === 'uploading'
            ? { ...item, status: 'error' as const, error: 'Upload failed' }
            : item
        ));
        onUploadError('Upload failed');
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);

    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(item => 
        item.status === 'uploading'
          ? { ...item, status: 'error' as const, error: error instanceof Error ? error.message : 'Upload failed' }
          : item
      ));
      onUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setUploadProgress(0);
  };

  const getStatusIcon = (status: FileItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const totalSize = files.reduce((sum, item) => sum + item.file.size, 0);
  const completedFiles = files.filter(item => item.status === 'completed').length;
  const errorFiles = files.filter(item => item.status === 'error').length;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : disabled
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <CardContent 
          className="p-8 text-center"
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className={`p-4 rounded-full ${isDragActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
              {isDragActive ? (
                <FolderOpen className="h-8 w-8 text-blue-500" />
              ) : (
                <Upload className="h-8 w-8 text-gray-500" />
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">
                {isDragActive ? 'Drop files here' : 'Upload your code files'}
              </h3>
              <p className="text-sm text-gray-500">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-xs text-gray-400">
                Supports: {acceptedTypes.slice(0, 8).join(', ')}... 
                (Max {maxFileSize}MB per file, {maxFiles} files total)
              </p>
            </div>

            <input
              type="file"
              multiple
              accept={acceptedTypes.join(',')}
              onChange={onFileInputChange}
              disabled={disabled}
              className="hidden"
              id="file-input"
            />
            
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Browse Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <h4 className="font-medium">Selected Files ({files.length})</h4>
                <Badge variant="outline">
                  {formatFileSize(totalSize)}
                </Badge>
                {completedFiles > 0 && (
                  <Badge variant="outline" className="text-green-600">
                    {completedFiles} completed
                  </Badge>
                )}
                {errorFiles > 0 && (
                  <Badge variant="outline" className="text-red-600">
                    {errorFiles} failed
                  </Badge>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFiles}
                  disabled={isUploading}
                >
                  Clear All
                </Button>
                <Button
                  onClick={uploadFiles}
                  disabled={isUploading || files.filter(f => f.status === 'pending').length === 0}
                  className="min-w-[100px]"
                >
                  {isUploading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Files
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Upload Progress</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* File Items */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {getStatusIcon(item.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.file.name}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{formatFileSize(item.file.size)}</span>
                        {item.secureFilename && (
                          <span>→ {item.secureFilename}</span>
                        )}
                      </div>
                      {item.error && (
                        <p className="text-xs text-red-500 mt-1">{item.error}</p>
                      )}
                    </div>
                  </div>

                  {item.status === 'uploading' && (
                    <div className="w-20">
                      <Progress value={item.progress} className="h-2" />
                    </div>
                  )}

                  {item.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(item.id)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      {files.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            All files are scanned for security threats and validated before processing. 
            Executable files and malicious content are automatically blocked.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}