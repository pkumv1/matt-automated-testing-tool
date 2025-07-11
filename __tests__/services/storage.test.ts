// __tests__/services/storage.test.ts
import { storage } from '../../server/storage';
import { db } from '../../server/db';
import { projects, analyses, testCases, agents, recommendations } from '../../shared/schema';

jest.mock('../../server/db');

describe('Storage Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Project Operations', () => {
    it('should create a new project', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test Description',
        sourceType: 'github' as const,
        sourceUrl: 'https://github.com/test/repo'
      };

      const mockResult = [{ id: 1, ...projectData, createdAt: new Date() }];
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue(mockResult)
        })
      });

      const result = await storage.createProject(projectData);

      expect(result).toEqual(mockResult[0]);
      expect(db.insert).toHaveBeenCalledWith(projects);
    });

    it('should get all projects', async () => {
      const mockProjects = [
        { id: 1, name: 'Project 1' },
        { id: 2, name: 'Project 2' }
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue(mockProjects)
        })
      });

      const result = await storage.getAllProjects();

      expect(result).toEqual(mockProjects);
      expect(db.select).toHaveBeenCalled();
    });

    it('should update a project', async () => {
      const updates = { analysisStatus: 'completed' };
      const mockUpdated = [{ id: 1, ...updates }];

      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue(mockUpdated)
          })
        })
      });

      const result = await storage.updateProject(1, updates);

      expect(result).toEqual(mockUpdated[0]);
      expect(db.update).toHaveBeenCalledWith(projects);
    });

    it('should delete a project', async () => {
      (db.delete as jest.Mock).mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined)
      });

      await storage.deleteProject(1);

      expect(db.delete).toHaveBeenCalledWith(projects);
    });
  });

  describe('Analysis Operations', () => {
    it('should create an analysis', async () => {
      const analysisData = {
        projectId: 1,
        type: 'initial_analysis' as const,
        agentId: 'analyzer-001'
      };

      const mockResult = [{ id: 1, ...analysisData, status: 'pending' }];
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue(mockResult)
        })
      });

      const result = await storage.createAnalysis(analysisData);

      expect(result).toEqual(mockResult[0]);
      expect(db.insert).toHaveBeenCalledWith(analyses);
    });

    it('should get analyses by project', async () => {
      const mockAnalyses = [
        { id: 1, projectId: 1, type: 'initial_analysis' },
        { id: 2, projectId: 1, type: 'risk_assessment' }
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockAnalyses)
        })
      });

      const result = await storage.getAnalysesByProject(1);

      expect(result).toEqual(mockAnalyses);
    });
  });

  describe('Test Case Operations', () => {
    it('should create a test case', async () => {
      const testCaseData = {
        projectId: 1,
        name: 'User Auth Test',
        description: 'Test user authentication',
        type: 'integration' as const,
        priority: 'high' as const,
        testScript: 'test script content'
      };

      const mockResult = [{ id: 1, ...testCaseData, status: 'pending' }];
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue(mockResult)
        })
      });

      const result = await storage.createTestCase(testCaseData);

      expect(result).toEqual(mockResult[0]);
      expect(db.insert).toHaveBeenCalledWith(testCases);
    });

    it('should update test case status', async () => {
      const updates = { status: 'passed' as const, executionTime: 2500 };
      const mockUpdated = [{ id: 1, ...updates }];

      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue(mockUpdated)
          })
        })
      });

      const result = await storage.updateTestCase(1, updates);

      expect(result).toEqual(mockUpdated[0]);
      expect(db.update).toHaveBeenCalledWith(testCases);
    });

    it('should get test cases by project', async () => {
      const mockTestCases = [
        { id: 1, projectId: 1, name: 'Test 1', status: 'passed' },
        { id: 2, projectId: 1, name: 'Test 2', status: 'failed' }
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockTestCases)
        })
      });

      const result = await storage.getTestCasesByProject(1);

      expect(result).toEqual(mockTestCases);
    });
  });

  describe('Agent Operations', () => {
    it('should initialize agents if none exist', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockResolvedValueOnce([]) // No agents exist
      });

      const mockAgents = [
        { id: 1, name: 'Supervisor', type: 'supervisor' }
      ];

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined)
      });

      // Mock for the second call to return agents
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockResolvedValueOnce(mockAgents)
      });

      const result = await storage.getAllAgents();

      expect(db.insert).toHaveBeenCalled();
      expect(result).toEqual(mockAgents);
    });

    it('should update agent status', async () => {
      const mockUpdated = [{ id: 1, status: 'busy' }];

      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue(mockUpdated)
          })
        })
      });

      const result = await storage.updateAgent(1, { status: 'busy' });

      expect(result).toEqual(mockUpdated[0]);
    });
  });
});