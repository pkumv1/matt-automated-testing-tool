import { 
  validateFileUpload, 
  validateUploadRequest, 
  validateFileContent,
  generateSecureFilename,
  detectFileType
} from '../../server/utils/fileUploadSecurity';

describe('File Upload Security', () => {
  
  describe('validateFileUpload', () => {
    const createMockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
      fieldname: 'files',
      originalname: 'test.js',
      encoding: '7bit',
      mimetype: 'application/javascript',
      size: 1024,
      destination: '',
      filename: '',
      path: '',
      buffer: Buffer.from('console.log("test");'),
      stream: null as any,
      ...overrides
    });

    it('should accept valid JavaScript file', () => {
      const file = createMockFile();
      const result = validateFileUpload(file);
      expect(result.valid).toBe(true);
    });

    it('should reject files that are too large', () => {
      const file = createMockFile({ 
        size: 11 * 1024 * 1024, // 11MB (over 10MB limit)
        originalname: 'large.js'
      });
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum size');
    });

    it('should reject dangerous file extensions', () => {
      const file = createMockFile({ 
        originalname: 'malware.exe',
        mimetype: 'application/octet-stream'
      });
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed for security reasons');
    });

    it('should reject unsupported file extensions', () => {
      const file = createMockFile({ 
        originalname: 'image.png',
        mimetype: 'image/png'
      });
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not supported');
    });

    it('should reject disallowed MIME types', () => {
      const file = createMockFile({ 
        originalname: 'test.js',
        mimetype: 'application/octet-stream'
      });
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('MIME type');
    });

    it('should reject files with path traversal attempts', () => {
      const file = createMockFile({ 
        originalname: '../../../etc/passwd'
      });
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid path characters');
    });

    it('should reject files with null bytes', () => {
      const file = createMockFile({ 
        originalname: 'test\x00.js'
      });
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('null bytes');
    });

    it('should reject files with overly long names', () => {
      const file = createMockFile({ 
        originalname: 'a'.repeat(300) + '.js'
      });
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });

    it('should reject text files with binary content', () => {
      const file = createMockFile({ 
        originalname: 'test.txt',
        mimetype: 'text/plain',
        buffer: Buffer.from('Hello\x00World') // Contains null byte
      });
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('binary data');
    });
  });

  describe('validateUploadRequest', () => {
    const createMockFile = (size: number, name: string): Express.Multer.File => ({
      fieldname: 'files',
      originalname: name,
      encoding: '7bit',
      mimetype: 'application/javascript',
      size,
      destination: '',
      filename: '',
      path: '',
      buffer: Buffer.alloc(size),
      stream: null as any,
    });

    it('should accept valid upload request', () => {
      const files = [
        createMockFile(1024, 'test1.js'),
        createMockFile(2048, 'test2.js')
      ];
      const result = validateUploadRequest(files);
      expect(result.valid).toBe(true);
    });

    it('should reject too many files', () => {
      const files = Array.from({ length: 101 }, (_, i) => 
        createMockFile(1024, `test${i}.js`)
      );
      const result = validateUploadRequest(files);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Too many files');
    });

    it('should reject total size too large', () => {
      const files = [
        createMockFile(30 * 1024 * 1024, 'large1.js'), // 30MB
        createMockFile(25 * 1024 * 1024, 'large2.js')  // 25MB (total 55MB > 50MB limit)
      ];
      const result = validateUploadRequest(files);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Total upload size exceeds');
    });
  });

  describe('validateFileContent', () => {
    const createMockFile = (buffer: Buffer, mimetype: string = 'text/plain'): Express.Multer.File => ({
      fieldname: 'files',
      originalname: 'test.txt',
      encoding: '7bit',
      mimetype,
      size: buffer.length,
      destination: '',
      filename: '',
      path: '',
      buffer,
      stream: null as any,
    });

    it('should accept valid text content', () => {
      const file = createMockFile(Buffer.from('console.log("hello");'));
      const result = validateFileContent(file);
      expect(result.valid).toBe(true);
    });

    it('should reject executable files', () => {
      // PE executable signature
      const file = createMockFile(Buffer.from([0x4D, 0x5A, 0x90, 0x00]));
      const result = validateFileContent(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Executable files are not allowed');
    });

    it('should reject image files', () => {
      // PNG signature
      const file = createMockFile(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
      const result = validateFileContent(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Image files are not supported');
    });
  });

  describe('generateSecureFilename', () => {
    it('should generate secure filename with timestamp and random bytes', () => {
      const original = 'test-file.js';
      const secure = generateSecureFilename(original);
      
      expect(secure).toMatch(/^test-file_\d+_[a-f0-9]{16}\.js$/);
      expect(secure.length).toBeGreaterThan(original.length);
    });

    it('should sanitize unsafe characters', () => {
      const original = 'test file with spaces & symbols!.js';
      const secure = generateSecureFilename(original);
      
      expect(secure).not.toContain(' ');
      expect(secure).not.toContain('&');
      expect(secure).not.toContain('!');
      expect(secure).toMatch(/^test_file_with_spaces___symbols__\d+_[a-f0-9]{16}\.js$/);
    });

    it('should limit filename length', () => {
      const original = 'a'.repeat(100) + '.js';
      const secure = generateSecureFilename(original);
      
      // Should be limited to reasonable length (50 chars base + timestamp + random + extension)
      expect(secure.length).toBeLessThan(100);
    });
  });

  describe('detectFileType', () => {
    it('should detect PNG files', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const type = detectFileType(pngBuffer);
      expect(type).toBe('image/png');
    });

    it('should detect JPEG files', () => {
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
      const type = detectFileType(jpegBuffer);
      expect(type).toBe('image/jpeg');
    });

    it('should detect PE executables', () => {
      const exeBuffer = Buffer.from([0x4D, 0x5A, 0x90, 0x00]);
      const type = detectFileType(exeBuffer);
      expect(type).toBe('application/x-executable');
    });

    it('should return null for unknown file types', () => {
      const unknownBuffer = Buffer.from([0x12, 0x34, 0x56, 0x78]);
      const type = detectFileType(unknownBuffer);
      expect(type).toBeNull();
    });

    it('should handle empty buffers', () => {
      const emptyBuffer = Buffer.alloc(0);
      const type = detectFileType(emptyBuffer);
      expect(type).toBeNull();
    });
  });
});