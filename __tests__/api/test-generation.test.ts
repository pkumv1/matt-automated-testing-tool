// __tests__/api/test-generation.test.ts
import request from 'supertest';
import { Express } from 'express';
import { createServer } from '../../server/index';
import { storage } from '../../server/storage';

jest.mock('../../server/storage');
jest.mock('../../server/services/comprehensive-testing');

describe('Test Generation API', () => {
  let app: Express;
  let server: any;

  beforeAll(async () => {
    const setup = await createServer();
    app = setup.app;
    server = setup.server;
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/projects/:id/generate-tests', () => {
    it('should generate test cases from analysis', async () => {
      const project = { id: 1, name: 'Test Project' };
      const analysis = {
        id: 1,
        type: 'test_generation',
        results: {
          testCases: [
            {
              name: 'User Authentication Test',
              type: 'integration',
              priority: 'high',
              description: 'Test user login flow'
            }
          ]
        }
      };

      (storage.getProject as jest.Mock).mockResolvedValue(project);
      (storage.getAnalysesByProject as jest.Mock).mockResolvedValue([analysis]);
      (storage.getTestCasesByProject as jest.Mock).mockResolvedValue([]);
      (storage.createTestCase as jest.Mock).mockImplementation((data) => ({
        id: 1,
        ...data,
        status: 'pending'
      }));

      const response = await request(app)
        .post('/api/projects/1/generate-tests')
        .send({
          testTypes: ['unit', 'integration'],
          coverage: 'high',
          frameworks: ['jest']
        })
        .expect(200);

      expect(response.body.testCasesCreated).toBe(1);
      expect(response.body.testCases).toHaveLength(1);
      expect(storage.createTestCase).toHaveBeenCalled();
    });

    it('should handle missing analysis gracefully', async () => {
      const project = { id: 1, name: 'Test Project' };

      (storage.getProject as jest.Mock).mockResolvedValue(project);
      (storage.getAnalysesByProject as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .post('/api/projects/1/generate-tests')
        .send({
          testTypes: ['unit'],
          coverage: 'medium',
          frameworks: ['jest']
        })
        .expect(400);

      expect(response.body.message).toBe('Test generation analysis not found');
    });
  });

  describe('POST /api/projects/:id/run-test-suite', () => {
    it('should execute test suite', async () => {
      const project = { id: 1, name: 'Test Project' };
      const testCaseIds = [1, 2, 3];

      (storage.getProject as jest.Mock).mockResolvedValue(project);
      (storage.updateTestCase as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .post('/api/projects/1/run-test-suite')
        .send({
          framework: 'jest',
          testCaseIds
        })
        .expect(200);

      expect(response.body.message).toBe('Test suite execution started');
      expect(response.body.testCount).toBe(3);
      
      // Verify all test cases were updated to running
      expect(storage.updateTestCase).toHaveBeenCalledTimes(3);
      testCaseIds.forEach(id => {
        expect(storage.updateTestCase).toHaveBeenCalledWith(id, { status: 'running' });
      });
    });
  });

  describe('POST /api/projects/:id/generate-automated-tests', () => {
    it('should generate comprehensive automated test suite', async () => {
      const project = { id: 1, name: 'Test Project' };
      
      // Mock comprehensive testing service
      const mockTestSuite = {
        functionalTests: [
          { name: 'Login Test', category: 'functional', priority: 'high' }
        ],
        securityTests: [
          { name: 'SQL Injection Test', category: 'security', priority: 'critical' }
        ],
        performanceTests: [
          { name: 'Load Test', category: 'performance', priority: 'medium' }
        ]
      };

      const { comprehensiveTestingService } = require('../../server/services/comprehensive-testing');
      comprehensiveTestingService.generateComprehensiveTestSuite = jest.fn().mockResolvedValue(mockTestSuite);

      (storage.getProject as jest.Mock).mockResolvedValue(project);
      (storage.createTestCase as jest.Mock).mockImplementation((data) => ({
        id: Math.random(),
        ...data
      }));

      const response = await request(app)
        .post('/api/projects/1/generate-automated-tests')
        .send({
          categories: ['functional', 'security'],
          complexity: 'comprehensive',
          frameworks: ['jest', 'playwright']
        })
        .expect(200);

      expect(response.body.testCases).toBeDefined();
      expect(response.body.summary.categories).toEqual(['functional', 'security']);
      expect(response.body.summary.complexity).toBe('comprehensive');
    });
  });
});