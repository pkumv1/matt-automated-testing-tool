// __tests__/api/projects.test.ts
import request from 'supertest';
import { Express } from 'express';
import { createServer } from '../../server/index';
import { storage } from '../../server/storage';
import { insertProjectSchema } from '../../shared/schema';

// Mock the storage module
jest.mock('../../server/storage');
jest.mock('../../server/services/langraph-production');
jest.mock('../../server/services/agents');

describe('Projects API', () => {
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

  describe('GET /api/projects', () => {
    it('should return all projects', async () => {
      const mockProjects = [
        {
          id: 1,
          name: 'Test Project',
          description: 'Test Description',
          sourceType: 'github',
          sourceUrl: 'https://github.com/test/repo',
          analysisStatus: 'completed',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      (storage.getAllProjects as jest.Mock).mockResolvedValue(mockProjects);

      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(response.body).toEqual(mockProjects);
      expect(storage.getAllProjects).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      (storage.getAllProjects as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/projects')
        .expect(500);

      expect(response.body).toEqual({ message: 'Failed to fetch projects' });
    });
  });

  describe('POST /api/projects', () => {
    it('should create a new GitHub project', async () => {
      const newProject = {
        name: 'New Project',
        description: 'New project description',
        sourceType: 'github',
        sourceUrl: 'https://github.com/user/repo',
        repositoryData: {
          owner: 'user',
          repo: 'repo',
          branch: 'main'
        }
      };

      const createdProject = {
        id: 1,
        ...newProject,
        analysisStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (storage.createProject as jest.Mock).mockResolvedValue(createdProject);

      const response = await request(app)
        .post('/api/projects')
        .send(newProject)
        .expect(200);

      expect(response.body).toMatchObject({
        id: 1,
        name: 'New Project',
        sourceType: 'github'
      });
      expect(storage.createProject).toHaveBeenCalledWith(expect.objectContaining(newProject));
    });

    it('should validate required fields', async () => {
      const invalidProject = {
        name: 'Test',
        // Missing sourceType
      };

      const response = await request(app)
        .post('/api/projects')
        .send(invalidProject)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Invalid project data');
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return a specific project', async () => {
      const project = {
        id: 1,
        name: 'Test Project',
        sourceType: 'github',
        analysisStatus: 'completed'
      };

      (storage.getProject as jest.Mock).mockResolvedValue(project);

      const response = await request(app)
        .get('/api/projects/1')
        .expect(200);

      expect(response.body).toEqual(project);
      expect(storage.getProject).toHaveBeenCalledWith(1);
    });

    it('should return 404 for non-existent project', async () => {
      (storage.getProject as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/projects/999')
        .expect(404);

      expect(response.body).toEqual({ message: 'Project not found' });
    });
  });

  describe('POST /api/projects/:id/analyze', () => {
    it('should start analysis for a project', async () => {
      const project = {
        id: 1,
        name: 'Test Project',
        analysisStatus: 'pending'
      };

      (storage.getProject as jest.Mock).mockResolvedValue(project);

      const response = await request(app)
        .post('/api/projects/1/analyze')
        .expect(200);

      expect(response.body).toEqual({ message: 'Analysis started successfully' });
    });

    it('should not start analysis if already running', async () => {
      const project = {
        id: 1,
        name: 'Test Project',
        analysisStatus: 'analyzing'
      };

      (storage.getProject as jest.Mock).mockResolvedValue(project);

      const response = await request(app)
        .post('/api/projects/1/analyze')
        .expect(200);

      expect(response.body).toEqual({ message: 'Analysis already in progress' });
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete a project and all related data', async () => {
      const project = { id: 1, name: 'Test Project' };
      const analyses = [{ id: 1, projectId: 1 }];
      const testCases = [{ id: 1, projectId: 1 }];
      const recommendations = [{ id: 1, projectId: 1 }];

      (storage.getProject as jest.Mock).mockResolvedValue(project);
      (storage.getAnalysesByProject as jest.Mock).mockResolvedValue(analyses);
      (storage.getTestCasesByProject as jest.Mock).mockResolvedValue(testCases);
      (storage.getRecommendationsByProject as jest.Mock).mockResolvedValue(recommendations);
      (storage.deleteAnalysis as jest.Mock).mockResolvedValue(true);
      (storage.deleteTestCase as jest.Mock).mockResolvedValue(true);
      (storage.deleteRecommendation as jest.Mock).mockResolvedValue(true);
      (storage.deleteProject as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/projects/1')
        .expect(200);

      expect(response.body).toEqual({ message: 'Project deleted successfully' });
      expect(storage.deleteProject).toHaveBeenCalledWith(1);
      expect(storage.deleteAnalysis).toHaveBeenCalledTimes(1);
      expect(storage.deleteTestCase).toHaveBeenCalledTimes(1);
      expect(storage.deleteRecommendation).toHaveBeenCalledTimes(1);
    });
  });
});