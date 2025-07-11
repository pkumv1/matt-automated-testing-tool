// __tests__/integration/workflow.test.ts
import request from 'supertest';
import { Express } from 'express';
import { createServer } from '../../server/index';
import { storage } from '../../server/storage';

jest.mock('../../server/storage');
jest.mock('../../server/services/langraph-production');
jest.mock('../../server/services/langraph-workflow');
jest.mock('../../server/services/agents');
jest.mock('../../server/services/comprehensive-testing');

describe('End-to-End Workflow Integration', () => {
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

  it('should complete full project analysis workflow', async () => {
    // Step 1: Create project
    const projectData = {
      name: 'Integration Test Project',
      sourceType: 'github',
      sourceUrl: 'https://github.com/test/integration',
      repositoryData: { owner: 'test', repo: 'integration' }
    };

    const createdProject = {
      id: 1,
      ...projectData,
      analysisStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    (storage.createProject as jest.Mock).mockResolvedValue(createdProject);

    const projectResponse = await request(app)
      .post('/api/projects')
      .send(projectData)
      .expect(200);

    expect(projectResponse.body.id).toBe(1);
    expect(projectResponse.body.name).toBe('Integration Test Project');

    // Step 2: Start analysis
    (storage.getProject as jest.Mock).mockResolvedValue(createdProject);
    
    await request(app)
      .post(`/api/projects/1/analyze`)
      .expect(200);

    // Step 3: Generate tests
    const mockAnalysis = {
      id: 1,
      type: 'test_generation',
      results: {
        testCases: [
          { name: 'Unit Test 1', type: 'unit', priority: 'high' },
          { name: 'Integration Test 1', type: 'integration', priority: 'medium' }
        ]
      }
    };

    (storage.getAnalysesByProject as jest.Mock).mockResolvedValue([mockAnalysis]);
    (storage.getTestCasesByProject as jest.Mock).mockResolvedValue([]);
    (storage.createTestCase as jest.Mock).mockImplementation((data) => ({
      id: Math.floor(Math.random() * 1000),
      ...data,
      status: 'pending'
    }));

    const testResponse = await request(app)
      .post(`/api/projects/1/generate-tests`)
      .send({
        testTypes: ['unit', 'integration'],
        coverage: 'high',
        frameworks: ['jest']
      })
      .expect(200);

    expect(testResponse.body.testCasesCreated).toBe(2);
    expect(testResponse.body.testCases).toHaveLength(2);

    // Step 4: Execute tests
    const testCases = [
      { id: 1, name: 'Unit Test 1', type: 'unit' },
      { id: 2, name: 'Integration Test 1', type: 'integration' }
    ];

    (storage.getTestCasesByProject as jest.Mock).mockResolvedValue(testCases);
    (storage.updateProject as jest.Mock).mockResolvedValue({ ...createdProject, analysisStatus: 'testing' });

    await request(app)
      .post(`/api/projects/1/execute-tests`)
      .send({
        testType: 'all',
        framework: 'jest'
      })
      .expect(200);

    // Step 5: Get final metrics
    const mockRecommendations = [
      { id: 1, priority: 'immediate', category: 'security' },
      { id: 2, priority: 'short-term', category: 'performance' }
    ];

    (storage.getRecommendationsByProject as jest.Mock).mockResolvedValue(mockRecommendations);
    (storage.getAnalysesByProject as jest.Mock).mockResolvedValue([mockAnalysis]);
    (storage.getTestCasesByProject as jest.Mock).mockResolvedValue([
      { ...testCases[0], status: 'passed' },
      { ...testCases[1], status: 'passed' }
    ]);

    const metricsResponse = await request(app)
      .get(`/api/projects/1/metrics`)
      .expect(200);

    expect(metricsResponse.body).toHaveProperty('codeQuality');
    expect(metricsResponse.body).toHaveProperty('testCoverage');
    expect(metricsResponse.body).toHaveProperty('riskLevel');
    expect(metricsResponse.body.totalRecommendations).toBe(2);
    expect(metricsResponse.body.criticalIssues).toBe(1);
  });

  it('should handle file upload workflow', async () => {
    const response = await request(app)
      .post('/api/upload')
      .attach('files', Buffer.from('console.log("test");'), 'test.js')
      .attach('files', Buffer.from('function test() { return true; }'), 'test2.js')
      .expect(200);

    expect(response.body.message).toBe('Files uploaded successfully');
    expect(response.body.files).toHaveLength(2);
    expect(response.body.files[0].name).toBe('test.js');
    expect(response.body.files[1].name).toBe('test2.js');
  });

  it('should retrieve agent status', async () => {
    const mockAgents = [
      { id: 1, name: 'Supervisor Agent', type: 'supervisor', status: 'ready' },
      { id: 2, name: 'Analyzer Agent', type: 'analyzer', status: 'busy' },
      { id: 3, name: 'Test Agent', type: 'test', status: 'ready' }
    ];

    (storage.getAllAgents as jest.Mock).mockResolvedValue(mockAgents);

    const response = await request(app)
      .get('/api/agents')
      .expect(200);

    expect(response.body).toHaveLength(3);
    expect(response.body[0].name).toBe('Supervisor Agent');
    expect(response.body[1].status).toBe('busy');
  });
});