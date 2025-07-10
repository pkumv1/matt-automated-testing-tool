import { 
  projects, analyses, testCases, agents, recommendations,
  type Project, type InsertProject, 
  type Analysis, type InsertAnalysis,
  type TestCase, type InsertTestCase,
  type Agent, type Recommendation, type InsertRecommendation
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Projects
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
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



export class DatabaseStorage implements IStorage {
  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    return newProject;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();
    return updatedProject || undefined;
  }

  async createAnalysis(analysis: InsertAnalysis): Promise<Analysis> {
    const [newAnalysis] = await db
      .insert(analyses)
      .values(analysis)
      .returning();
    return newAnalysis;
  }

  async getAnalysesByProject(projectId: number): Promise<Analysis[]> {
    return await db.select().from(analyses).where(eq(analyses.projectId, projectId));
  }

  async updateAnalysis(id: number, updates: Partial<Analysis>): Promise<Analysis | undefined> {
    const [updatedAnalysis] = await db
      .update(analyses)
      .set(updates)
      .where(eq(analyses.id, id))
      .returning();
    return updatedAnalysis || undefined;
  }

  async createTestCase(testCase: InsertTestCase): Promise<TestCase> {
    const [newTestCase] = await db
      .insert(testCases)
      .values(testCase)
      .returning();
    return newTestCase;
  }

  async getTestCasesByProject(projectId: number): Promise<TestCase[]> {
    return await db.select().from(testCases).where(eq(testCases.projectId, projectId));
  }

  async updateTestCase(id: number, updates: Partial<TestCase>): Promise<TestCase | undefined> {
    const [updatedTestCase] = await db
      .update(testCases)
      .set(updates)
      .where(eq(testCases.id, id))
      .returning();
    return updatedTestCase || undefined;
  }

  async getAllAgents(): Promise<Agent[]> {
    // First, try to get agents from database
    const existingAgents = await db.select().from(agents);
    
    if (existingAgents.length === 0) {
      // Initialize default agents if none exist
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

      return insertedAgents.map(([agent]) => agent);
    }

    return existingAgents;
  }

  async updateAgentStatus(id: number, status: string): Promise<Agent | undefined> {
    const [updatedAgent] = await db
      .update(agents)
      .set({ status, lastActivity: new Date() })
      .where(eq(agents.id, id))
      .returning();
    return updatedAgent || undefined;
  }

  async createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation> {
    const [newRecommendation] = await db
      .insert(recommendations)
      .values(recommendation)
      .returning();
    return newRecommendation;
  }

  async getRecommendationsByProject(projectId: number): Promise<Recommendation[]> {
    return await db.select().from(recommendations).where(eq(recommendations.projectId, projectId));
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async deleteAnalysis(id: number): Promise<void> {
    await db.delete(analyses).where(eq(analyses.id, id));
  }

  async deleteTestCase(id: number): Promise<void> {
    await db.delete(testCases).where(eq(testCases.id, id));
  }

  async deleteRecommendation(id: number): Promise<void> {
    await db.delete(recommendations).where(eq(recommendations.id, id));
  }
}

export const storage = new DatabaseStorage();
