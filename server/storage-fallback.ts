// Fallback storage implementation when database is not available
// This allows the application to function with in-memory storage

import { 
  type Project, type InsertProject, 
  type Analysis, type InsertAnalysis,
  type TestCase, type InsertTestCase,
  type Agent, type Recommendation, type InsertRecommendation
} from "@shared/schema";
import { logger } from "./logger";

export interface IStorage {
  // Projects
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(lightweight?: boolean): Promise<Project[]>;
  updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;

  // Analyses
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysesByProject(projectId: number): Promise<Analysis[]>;
  updateAnalysis(id: number, updates: Partial<Analysis>): Promise<Analysis | undefined>;
  deleteAnalysis(id: number): Promise<void>;

  // Test Cases
  createTestCase(testCase: InsertTestCase): Promise<TestCase>;
  getTestCasesByProject(projectId: number): Promise<TestCase[]>;
  updateTestCase(id: number, updates: Partial<TestCase>): Promise<TestCase | undefined>;
  deleteTestCase(id: number): Promise<void>;

  // Agents
  getAllAgents(): Promise<Agent[]>;
  updateAgentStatus(id: number, status: string): Promise<Agent | undefined>;

  // Recommendations
  createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation>;
  getRecommendationsByProject(projectId: number): Promise<Recommendation[]>;
  deleteRecommendation(id: number): Promise<void>;
}

class InMemoryStorage implements IStorage {
  private projects: Map<number, Project> = new Map();
  private analyses: Map<number, Analysis> = new Map();
  private testCases: Map<number, TestCase> = new Map();
  private recommendations: Map<number, Recommendation> = new Map();
  private agents: Map<number, Agent> = new Map();
  private nextId = 1;

  constructor() {
    logger.warn('🔄 Using in-memory storage fallback - data will not persist!', {}, 'STORAGE_FALLBACK');
    this.initializeDefaultAgents();
  }

  private initializeDefaultAgents() {
    const defaultAgents: Agent[] = [
      {
        id: 1,
        name: 'Supervisor Agent',
        type: 'supervisor',
        status: 'ready',
        capabilities: { workflow_management: true, task_coordination: true },
        lastActivity: new Date()
      },
      {
        id: 2,
        name: 'Code Analyzer',
        type: 'analyzer',
        status: 'ready',
        capabilities: { code_analysis: true, language_detection: true, framework_identification: true },
        lastActivity: new Date()
      },
      {
        id: 3,
        name: 'Risk Assessor',
        type: 'risk',
        status: 'ready',
        capabilities: { security_analysis: true, performance_analysis: true, quality_analysis: true },
        lastActivity: new Date()
      },
      {
        id: 4,
        name: 'Test Generator',
        type: 'test',
        status: 'ready',
        capabilities: { test_generation: true, multi_platform_support: true },
        lastActivity: new Date()
      },
      {
        id: 5,
        name: 'Environment Setup',
        type: 'environment',
        status: 'ready',
        capabilities: { environment_configuration: true, deployment_assessment: true },
        lastActivity: new Date()
      }
    ];

    defaultAgents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });
  }

  // Projects
  async createProject(project: InsertProject): Promise<Project> {
    const newProject: Project = {
      id: this.nextId++,
      ...project,
      analysisStatus: project.analysisStatus || 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.projects.set(newProject.id, newProject);
    logger.info(`📝 Created project in memory: ${newProject.name} (ID: ${newProject.id})`, { id: newProject.id }, 'STORAGE_FALLBACK');
    return newProject;
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getAllProjects(lightweight: boolean = false): Promise<Project[]> {
    const projectList = Array.from(this.projects.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (lightweight) {
      return projectList.map(project => ({
        ...project,
        repositoryData: null // Exclude large data for list view
      }));
    }

    return projectList;
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updatedProject = {
      ...project,
      ...updates,
      updatedAt: new Date()
    };

    this.projects.set(id, updatedProject);
    logger.info(`📝 Updated project in memory: ${updatedProject.name} (ID: ${id})`, { id }, 'STORAGE_FALLBACK');
    return updatedProject;
  }

  async deleteProject(id: number): Promise<void> {
    const project = this.projects.get(id);
    if (project) {
      this.projects.delete(id);
      
      // Delete related data
      this.analyses.forEach((analysis, analysisId) => {
        if (analysis.projectId === id) {
          this.analyses.delete(analysisId);
        }
      });
      
      this.testCases.forEach((testCase, testCaseId) => {
        if (testCase.projectId === id) {
          this.testCases.delete(testCaseId);
        }
      });
      
      this.recommendations.forEach((recommendation, recommendationId) => {
        if (recommendation.projectId === id) {
          this.recommendations.delete(recommendationId);
        }
      });

      logger.info(`🗑️ Deleted project from memory: ${project.name} (ID: ${id})`, { id }, 'STORAGE_FALLBACK');
    }
  }

  // Analyses
  async createAnalysis(analysis: InsertAnalysis): Promise<Analysis> {
    const newAnalysis: Analysis = {
      id: this.nextId++,
      ...analysis,
      status: analysis.status || 'pending',
      results: analysis.results || null,
      startedAt: analysis.startedAt || null,
      completedAt: analysis.completedAt || null,
    };
    
    this.analyses.set(newAnalysis.id, newAnalysis);
    return newAnalysis;
  }

  async getAnalysesByProject(projectId: number): Promise<Analysis[]> {
    return Array.from(this.analyses.values()).filter(analysis => analysis.projectId === projectId);
  }

  async updateAnalysis(id: number, updates: Partial<Analysis>): Promise<Analysis | undefined> {
    const analysis = this.analyses.get(id);
    if (!analysis) return undefined;

    const updatedAnalysis = { ...analysis, ...updates };
    this.analyses.set(id, updatedAnalysis);
    return updatedAnalysis;
  }

  async deleteAnalysis(id: number): Promise<void> {
    this.analyses.delete(id);
  }

  // Test Cases
  async createTestCase(testCase: InsertTestCase): Promise<TestCase> {
    const newTestCase: TestCase = {
      id: this.nextId++,
      ...testCase,
      status: testCase.status || 'generated',
      executionTime: testCase.executionTime || null,
      results: testCase.results || null,
    };
    
    this.testCases.set(newTestCase.id, newTestCase);
    return newTestCase;
  }

  async getTestCasesByProject(projectId: number): Promise<TestCase[]> {
    return Array.from(this.testCases.values()).filter(testCase => testCase.projectId === projectId);
  }

  async updateTestCase(id: number, updates: Partial<TestCase>): Promise<TestCase | undefined> {
    const testCase = this.testCases.get(id);
    if (!testCase) return undefined;

    const updatedTestCase = { ...testCase, ...updates };
    this.testCases.set(id, updatedTestCase);
    return updatedTestCase;
  }

  async deleteTestCase(id: number): Promise<void> {
    this.testCases.delete(id);
  }

  // Agents
  async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async updateAgentStatus(id: number, status: string): Promise<Agent | undefined> {
    const agent = this.agents.get(id);
    if (!agent) return undefined;

    const updatedAgent = { 
      ...agent, 
      status, 
      lastActivity: new Date() 
    };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  // Recommendations
  async createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation> {
    const newRecommendation: Recommendation = {
      id: this.nextId++,
      ...recommendation,
      actionable: recommendation.actionable ?? true,
      implemented: recommendation.implemented ?? false,
    };
    
    this.recommendations.set(newRecommendation.id, newRecommendation);
    return newRecommendation;
  }

  async getRecommendationsByProject(projectId: number): Promise<Recommendation[]> {
    return Array.from(this.recommendations.values()).filter(rec => rec.projectId === projectId);
  }

  async deleteRecommendation(id: number): Promise<void> {
    this.recommendations.delete(id);
  }

  // Additional methods for debugging
  getStorageStats() {
    return {
      projects: this.projects.size,
      analyses: this.analyses.size,
      testCases: this.testCases.size,
      recommendations: this.recommendations.size,
      agents: this.agents.size,
      memoryStorage: true
    };
  }
}

export { InMemoryStorage };