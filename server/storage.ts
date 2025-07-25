import { 
  projects, analyses, testCases, agents, recommendations,
  type Project, type InsertProject, 
  type Analysis, type InsertAnalysis,
  type TestCase, type InsertTestCase,
  type Agent, type Recommendation, type InsertRecommendation
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { logger } from "./logger";
import { performanceMonitor } from "./utils/performanceMonitor";
import { InMemoryStorage } from "./storage-fallback";

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

// Custom error class for database operations
class DatabaseError extends Error {
  constructor(
    public operation: string,
    public originalError: any,
    public context?: any
  ) {
    super(`Database operation failed: ${operation}`);
    this.name = 'DatabaseError';
  }
}

// Error handling wrapper
async function withErrorHandling<T>(
  operation: string,
  context: any,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    logger.debug(`Starting database operation: ${operation}`, context);
    const result = await fn();
    const duration = Date.now() - startTime;
    
    if (duration > 1000) {
      logger.warn(`Slow database operation: ${operation} took ${duration}ms`, context);
    } else {
      logger.debug(`Database operation completed: ${operation} in ${duration}ms`);
    }
    
    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.logError(`Database operation failed: ${operation} after ${duration}ms`, error);
    
    // Provide specific error messages based on PostgreSQL error codes
    if (error.code === '23505') {
      throw new DatabaseError(operation, error, { 
        ...context, 
        userMessage: 'This record already exists' 
      });
    }
    
    if (error.code === '23503') {
      throw new DatabaseError(operation, error, { 
        ...context, 
        userMessage: 'Referenced record not found' 
      });
    }
    
    if (error.code === '22001') {
      throw new DatabaseError(operation, error, { 
        ...context, 
        userMessage: 'Data too long for field' 
      });
    }
    
    // Re-throw as DatabaseError with context
    throw new DatabaseError(operation, error, context);
  }
}

export class DatabaseStorage implements IStorage {
  async createProject(project: InsertProject): Promise<Project> {
    return withErrorHandling('createProject', { project }, async () => {
      // Log large data sizes
      const dataSize = JSON.stringify(project.repositoryData || {}).length;
      if (dataSize > 100000) {
        logger.warn(`Large repository data size: ${dataSize} bytes`);
      }
      
      const [newProject] = await db
        .insert(projects)
        .values(project)
        .returning();
      
      logger.info(`Project created: ${newProject.name} (ID: ${newProject.id})`);
      return newProject;
    });
  }

  async getProject(id: number): Promise<Project | undefined> {
    return withErrorHandling('getProject', { id }, async () => {
      const [project] = await db.select().from(projects).where(eq(projects.id, id));
      return project || undefined;
    });
  }

  async getAllProjects(lightweight: boolean = false): Promise<Project[]> {
    return performanceMonitor.monitor('getAllProjects', async () => {
      return withErrorHandling('getAllProjects', { lightweight }, async () => {
        let projectList;
        
        if (lightweight) {
          // For lightweight mode, exclude heavy repository_data field
          const lightProjects = await db.select({
            id: projects.id,
            name: projects.name,
            description: projects.description,
            sourceType: projects.sourceType,
            sourceUrl: projects.sourceUrl,
            analysisStatus: projects.analysisStatus,
            createdAt: projects.createdAt,
            updatedAt: projects.updatedAt
          }).from(projects).orderBy(desc(projects.createdAt)); // Add explicit ordering for performance
          
          // Map to include repositoryData as null for type compatibility
          projectList = lightProjects.map(p => ({
            ...p,
            repositoryData: null
          }));
        } else {
          projectList = await db.select().from(projects).orderBy(desc(projects.createdAt));
        }
        
        logger.debug(`Retrieved ${projectList.length} projects (lightweight: ${lightweight})`);
        return projectList;
      });
    }, { lightweight });
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined> {
    return withErrorHandling('updateProject', { id, updates }, async () => {
      const [updatedProject] = await db
        .update(projects)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning();
      
      if (updatedProject) {
        logger.info(`Project updated: ${updatedProject.name} (ID: ${id})`);
      }
      
      return updatedProject || undefined;
    });
  }

  async createAnalysis(analysis: InsertAnalysis): Promise<Analysis> {
    return withErrorHandling('createAnalysis', { analysis }, async () => {
      const [newAnalysis] = await db
        .insert(analyses)
        .values(analysis)
        .returning();
      
      logger.info(`Analysis created: ${newAnalysis.type} for project ${newAnalysis.projectId}`);
      return newAnalysis;
    });
  }

  async getAnalysesByProject(projectId: number): Promise<Analysis[]> {
    return withErrorHandling('getAnalysesByProject', { projectId }, async () => {
      const analysisList = await db.select().from(analyses).where(eq(analyses.projectId, projectId));
      logger.debug(`Retrieved ${analysisList.length} analyses for project ${projectId}`);
      return analysisList;
    });
  }

  async updateAnalysis(id: number, updates: Partial<Analysis>): Promise<Analysis | undefined> {
    return withErrorHandling('updateAnalysis', { id, updates }, async () => {
      const [updatedAnalysis] = await db
        .update(analyses)
        .set(updates)
        .where(eq(analyses.id, id))
        .returning();
      
      if (updatedAnalysis) {
        logger.info(`Analysis updated: ${updatedAnalysis.type} (ID: ${id})`);
      }
      
      return updatedAnalysis || undefined;
    });
  }

  async createTestCase(testCase: InsertTestCase): Promise<TestCase> {
    return withErrorHandling('createTestCase', { testCase }, async () => {
      const [newTestCase] = await db
        .insert(testCases)
        .values(testCase)
        .returning();
      
      logger.info(`Test case created: ${newTestCase.name} for project ${newTestCase.projectId}`);
      return newTestCase;
    });
  }

  async getTestCasesByProject(projectId: number): Promise<TestCase[]> {
    return withErrorHandling('getTestCasesByProject', { projectId }, async () => {
      const testCaseList = await db.select().from(testCases).where(eq(testCases.projectId, projectId));
      logger.debug(`Retrieved ${testCaseList.length} test cases for project ${projectId}`);
      return testCaseList;
    });
  }

  async updateTestCase(id: number, updates: Partial<TestCase>): Promise<TestCase | undefined> {
    return withErrorHandling('updateTestCase', { id, updates }, async () => {
      const [updatedTestCase] = await db
        .update(testCases)
        .set(updates)
        .where(eq(testCases.id, id))
        .returning();
      
      if (updatedTestCase) {
        logger.info(`Test case updated: ${updatedTestCase.name} (ID: ${id})`);
      }
      
      return updatedTestCase || undefined;
    });
  }

  async getAllAgents(): Promise<Agent[]> {
    return withErrorHandling('getAllAgents', {}, async () => {
      const existingAgents = await db.select().from(agents);
      
      if (existingAgents.length === 0) {
        logger.info('No agents found, initializing default agents');
        
        const defaultAgents = [
          { name: 'Supervisor Agent', type: 'supervisor', status: 'ready', capabilities: { orchestration: true, coordination: true } },
          { name: 'Code Analyzer', type: 'analyzer', status: 'ready', capabilities: { languages: ['javascript', 'typescript', 'python', 'java'], frameworks: true } },
          { name: 'Risk Assessor', type: 'risk', status: 'ready', capabilities: { security: true, performance: true, quality: true } },
          { name: 'Test Generator', type: 'test', status: 'ready', capabilities: { unit: true, integration: true, e2e: true } },
          { name: 'Environment Setup', type: 'environment', status: 'ready', capabilities: { docker: true, selenium: true, playwright: true } }
        ];

        const insertedAgents = await Promise.all(
          defaultAgents.map(agent => 
            db.insert(agents).values({
              ...agent,
              lastActivity: new Date()
            }).returning()
          )
        );

        logger.info(`Initialized ${insertedAgents.length} default agents`);
        return insertedAgents.map(([agent]) => agent);
      }

      return existingAgents;
    });
  }

  async updateAgentStatus(id: number, status: string): Promise<Agent | undefined> {
    return withErrorHandling('updateAgentStatus', { id, status }, async () => {
      const [updatedAgent] = await db
        .update(agents)
        .set({ status, lastActivity: new Date() })
        .where(eq(agents.id, id))
        .returning();
      
      if (updatedAgent) {
        logger.info(`Agent status updated: ${updatedAgent.name} -> ${status}`);
      }
      
      return updatedAgent || undefined;
    });
  }

  async createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation> {
    return withErrorHandling('createRecommendation', { recommendation }, async () => {
      const [newRecommendation] = await db
        .insert(recommendations)
        .values(recommendation)
        .returning();
      
      logger.info(`Recommendation created: ${newRecommendation.title} for project ${newRecommendation.projectId}`);
      return newRecommendation;
    });
  }

  async getRecommendationsByProject(projectId: number): Promise<Recommendation[]> {
    return withErrorHandling('getRecommendationsByProject', { projectId }, async () => {
      const recommendationList = await db.select().from(recommendations).where(eq(recommendations.projectId, projectId));
      logger.debug(`Retrieved ${recommendationList.length} recommendations for project ${projectId}`);
      return recommendationList;
    });
  }

  async deleteProject(id: number): Promise<void> {
    return withErrorHandling('deleteProject', { id }, async () => {
      await db.delete(projects).where(eq(projects.id, id));
      logger.info(`Project deleted: ID ${id}`);
    });
  }

  async deleteAnalysis(id: number): Promise<void> {
    return withErrorHandling('deleteAnalysis', { id }, async () => {
      await db.delete(analyses).where(eq(analyses.id, id));
      logger.info(`Analysis deleted: ID ${id}`);
    });
  }

  async deleteTestCase(id: number): Promise<void> {
    return withErrorHandling('deleteTestCase', { id }, async () => {
      await db.delete(testCases).where(eq(testCases.id, id));
      logger.info(`Test case deleted: ID ${id}`);
    });
  }

  async deleteRecommendation(id: number): Promise<void> {
    return withErrorHandling('deleteRecommendation', { id }, async () => {
      await db.delete(recommendations).where(eq(recommendations.id, id));
      logger.info(`Recommendation deleted: ID ${id}`);
    });
  }
}

// Create storage instance with fallback logic
function createStorage(): IStorage {
  try {
    // Check if database connection is available
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      logger.warn('⚠️  DATABASE_URL not set, using in-memory storage fallback', {}, 'STORAGE_INIT');
      return new InMemoryStorage();
    }
    
    // Try to create database storage
    const dbStorage = new DatabaseStorage();
    logger.info('✅ Using PostgreSQL database storage', {}, 'STORAGE_INIT');
    return dbStorage;
    
  } catch (error) {
    logger.error('❌ Database storage failed, falling back to in-memory storage', { error }, 'STORAGE_INIT');
    return new InMemoryStorage();
  }
}

export const storage = createStorage();

// Add health check function
export async function checkStorageHealth(): Promise<{
  type: 'database' | 'memory';
  healthy: boolean;
  details: any;
}> {
  try {
    if (storage instanceof InMemoryStorage) {
      return {
        type: 'memory',
        healthy: true,
        details: (storage as any).getStorageStats()
      };
    } else {
      // For database storage, try a simple operation
      const projects = await storage.getAllProjects(true);
      return {
        type: 'database',
        healthy: true,
        details: {
          projectCount: projects.length,
          connected: true
        }
      };
    }
  } catch (error) {
    return {
      type: storage instanceof InMemoryStorage ? 'memory' : 'database',
      healthy: false,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}
