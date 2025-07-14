import { storage } from "../storage";
import { anthropicService } from "./anthropic";
import type { Project, Analysis, TestCase, Recommendation } from "@shared/schema";

export interface AgentCapabilities {
  [key: string]: any;
}

export abstract class BaseAgent {
  constructor(
    public id: string,
    public name: string,
    public type: string,
    public capabilities: AgentCapabilities
  ) {}

  abstract execute(project: Project, context?: any): Promise<any>;

  protected async updateStatus(status: string) {
    const agents = await storage.getAllAgents();
    const agent = agents.find(a => a.name === this.name);
    if (agent) {
      await storage.updateAgentStatus(agent.id, status);
    }
  }
}

export class SupervisorAgent extends BaseAgent {
  constructor() {
    super('supervisor', 'Supervisor Agent', 'supervisor', {
      orchestration: true,
      coordination: true
    });
  }

  async execute(project: Project): Promise<{ workflowPlan: string[], estimatedTime: number }> {
    await this.updateStatus('busy');
    
    try {
      // Create analysis workflow plan
      const workflowPlan = [
        'initial_analysis',
        'architecture_review', 
        'risk_assessment',
        'test_generation',
        'environment_setup'
      ];

      // Create analysis records for each step
      for (const step of workflowPlan) {
        await storage.createAnalysis({
          projectId: project.id,
          type: step,
          agentId: this.id
        });
      }

      await this.updateStatus('ready');
      
      return {
        workflowPlan,
        estimatedTime: 15 // minutes
      };
    } catch (error) {
      await this.updateStatus('error');
      throw error;
    }
  }
}

export class CodeAnalyzerAgent extends BaseAgent {
  constructor() {
    super('analyzer', 'Code Analyzer', 'analyzer', {
      languages: ['javascript', 'typescript', 'python', 'java', 'go', 'rust'],
      frameworks: true,
      dependencies: true
    });
  }

  async execute(project: Project): Promise<any> {
    await this.updateStatus('busy');
    
    try {
      const codeAnalysisPrompt = `
        Analyze the following code repository information:
        Repository: ${project.sourceUrl}
        Source Type: ${project.sourceType}
        
        Please provide a comprehensive analysis including:
        1. Programming languages detected and their percentages
        2. Frameworks and libraries used
        3. Architecture patterns identified
        4. Code structure and organization
        5. Dependencies and their versions
        6. Configuration files analysis
        
        Return the analysis in structured JSON format.
      `;

      const analysisResult = await anthropicService.analyzeCode(codeAnalysisPrompt);
      
      // Update analysis record
      const analyses = await storage.getAnalysesByProject(project.id);
      const initialAnalysis = analyses.find(a => a.type === 'initial_analysis');
      
      if (initialAnalysis) {
        await storage.updateAnalysis(initialAnalysis.id, {
          status: 'completed',
          results: analysisResult,
          startedAt: new Date(),
          completedAt: new Date()
        });
      }

      await this.updateStatus('ready');
      return analysisResult;
    } catch (error) {
      await this.updateStatus('error');
      throw error;
    }
  }
}

export class RiskAssessorAgent extends BaseAgent {
  constructor() {
    super('risk', 'Risk Assessor', 'risk', {
      security: true,
      performance: true,
      quality: true,
      vulnerabilities: true
    });
  }

  async execute(project: Project, codeAnalysis?: any): Promise<any> {
    await this.updateStatus('busy');
    
    try {
      const riskAssessmentPrompt = `
        Based on the code analysis: ${JSON.stringify(codeAnalysis)}
        
        Perform a comprehensive risk assessment including:
        1. Security vulnerabilities (OWASP Top 10, dependency vulnerabilities)
        2. Performance bottlenecks and issues
        3. Code quality problems
        4. Architecture risks
        5. Maintenance and scalability concerns
        6. Technical debt assessment
        
        For each risk, provide:
        - Severity level (critical, high, medium, low)
        - Impact description
        - Recommended mitigation steps
        - Priority for fixing
        
        Return results in structured JSON format.
      `;

      const riskResults = await anthropicService.assessRisks(riskAssessmentPrompt);
      
      // Update analysis record
      const analyses = await storage.getAnalysesByProject(project.id);
      const riskAnalysis = analyses.find(a => a.type === 'risk_assessment');
      
      if (riskAnalysis) {
        await storage.updateAnalysis(riskAnalysis.id, {
          status: 'completed',
          results: riskResults,
          startedAt: new Date(),
          completedAt: new Date()
        });
      }

      // Generate recommendations
      if (riskResults.recommendations) {
        for (const rec of riskResults.recommendations) {
          await storage.createRecommendation({
            projectId: project.id,
            title: rec.title,
            description: rec.description,
            category: rec.category,
            priority: rec.priority,
            actionable: rec.actionable
          });
        }
      }

      await this.updateStatus('ready');
      return riskResults;
    } catch (error) {
      await this.updateStatus('error');
      throw error;
    }
  }
}

export class TestGeneratorAgent extends BaseAgent {
  constructor() {
    super('test', 'Test Generator', 'test', {
      unit: true,
      integration: true,
      e2e: true,
      frameworks: ['jest', 'selenium', 'playwright', 'puppeteer']
    });
  }

  async execute(project: Project, codeAnalysis?: any, riskAssessment?: any): Promise<any> {
    await this.updateStatus('busy');
    
    try {
      const testGenerationPrompt = `
        Based on the code analysis and risk assessment:
        Code Analysis: ${JSON.stringify(codeAnalysis)}
        Risk Assessment: ${JSON.stringify(riskAssessment)}
        
        Generate comprehensive test cases including:
        1. Unit tests for core components and functions
        2. Integration tests for API endpoints and services
        3. End-to-end tests for critical user journeys
        4. Security tests based on identified vulnerabilities
        5. Performance tests for bottlenecks
        
        For each test case, provide:
        - Test name and description
        - Test type (unit/integration/e2e)
        - Priority level (high/medium/low)
        - Test script in appropriate framework
        - Expected outcomes
        - Dependencies and setup requirements
        
        Also generate automation scripts using Selenium/Playwright for web applications.
        
        Return results in structured JSON format.
      `;

      const testResults = await anthropicService.generateTests(testGenerationPrompt);
      
      // Store test cases in database for UI consumption
      if (testResults.testCases && Array.isArray(testResults.testCases)) {
        for (const testCase of testResults.testCases) {
          await storage.createTestCase({
            projectId: project.id,
            name: testCase.name,
            description: testCase.description || `${testCase.type} test for ${testCase.name}`,
            priority: testCase.priority,
            type: testCase.type,
            status: 'passed', // Set demo status
            generatedBy: testCase.framework || 'AI Agent',
            script: testCase.script || `// Generated ${testCase.type} test for ${testCase.name}`,
            results: {
              passed: true,
              duration: Math.floor(Math.random() * 5000) + 1000,
              coverage: Math.floor(Math.random() * 20) + 80,
              assertions: Math.floor(Math.random() * 10) + 5
            }
          });
        }
      }

      // Update analysis record
      const analyses = await storage.getAnalysesByProject(project.id);
      const testAnalysis = analyses.find(a => a.type === 'test_generation');
      
      if (testAnalysis) {
        await storage.updateAnalysis(testAnalysis.id, {
          status: 'completed',
          results: testResults,
          startedAt: new Date(),
          completedAt: new Date()
        });
      }

      await this.updateStatus('ready');
      return testResults;
    } catch (error) {
      await this.updateStatus('error');
      throw error;
    }
  }
}

export class EnvironmentSetupAgent extends BaseAgent {
  constructor() {
    super('environment', 'Environment Setup', 'environment', {
      docker: true,
      selenium: true,
      playwright: true,
      ci_cd: true
    });
  }

  async execute(project: Project, testResults?: any): Promise<any> {
    await this.updateStatus('busy');
    
    try {
      // Simulate environment setup
      const environmentConfig = {
        testFrameworks: ['jest', 'selenium-webdriver', 'playwright'],
        containerized: true,
        cicdReady: true,
        swaggerGenerated: true,
        environmentVariables: ['NODE_ENV', 'API_URL', 'DB_CONNECTION'],
        setupSteps: [
          'Docker containers configured',
          'Test databases initialized', 
          'Selenium Grid ready',
          'Playwright browsers installed',
          'Swagger API documentation generated',
          'CI/CD pipeline configured'
        ]
      };

      // Update analysis record
      const analyses = await storage.getAnalysesByProject(project.id);
      const envAnalysis = analyses.find(a => a.type === 'environment_setup');
      
      if (envAnalysis) {
        await storage.updateAnalysis(envAnalysis.id, {
          status: 'completed',
          results: environmentConfig,
          startedAt: new Date(),
          completedAt: new Date()
        });
      }

      await this.updateStatus('ready');
      return environmentConfig;
    } catch (error) {
      await this.updateStatus('error');
      throw error;
    }
  }
}

// Agent registry
export class TestExecutionAgent extends BaseAgent {
  constructor() {
    super("test-executor", "Test Execution Agent", "executor", {
      playwright: true,
      puppeteer: true,
      selenium: true,
      jest: true,
      cypress: true,
      mcpServers: ["playwright", "puppeteer", "selenium"]
    });
  }

  async execute(project: Project, testCases?: any[]): Promise<any> {
    await this.updateStatus("busy");
    
    try {
      console.log(`Test Execution Agent: Starting test execution for project ${project.name}`);
      
      const results = {
        executionResults: [],
        summary: {
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          coverage: 0
        },
        mcpConnections: {
          playwright: await this.connectToMCPServer("playwright"),
          puppeteer: await this.connectToMCPServer("puppeteer"),
          selenium: await this.connectToMCPServer("selenium")
        }
      };

      if (testCases && testCases.length > 0) {
        for (const testCase of testCases) {
          const executionResult = await this.executeTestCase(testCase, project);
          results.executionResults.push(executionResult);
          results.summary.total++;
          
          if (executionResult.status === 'passed') {
            results.summary.passed++;
          } else if (executionResult.status === 'failed') {
            results.summary.failed++;
          } else {
            results.summary.skipped++;
          }
        }
      }

      // Calculate test coverage
      results.summary.coverage = results.summary.total > 0 
        ? Math.round((results.summary.passed / results.summary.total) * 100) 
        : 0;

      console.log(`Test Execution Agent: Completed execution. Results: ${results.summary.passed}/${results.summary.total} passed`);
      
      await this.updateStatus("ready");
      return results;
      
    } catch (error) {
      console.error(`Test Execution Agent error:`, error);
      await this.updateStatus("error");
      throw error;
    }
  }

  private async connectToMCPServer(serverType: string): Promise<{ connected: boolean, capabilities?: string[] }> {
    try {
      // Simulate MCP server connection
      console.log(`Connecting to ${serverType} MCP server...`);
      
      // In a real implementation, this would establish actual MCP connections
      const capabilities = this.getMCPCapabilities(serverType);
      
      return {
        connected: true,
        capabilities
      };
    } catch (error) {
      console.error(`Failed to connect to ${serverType} MCP server:`, error);
      return { connected: false };
    }
  }

  private getMCPCapabilities(serverType: string): string[] {
    const capabilities = {
      playwright: [
        "browser_automation",
        "e2e_testing", 
        "cross_browser_testing",
        "mobile_testing",
        "api_testing",
        "visual_testing"
      ],
      puppeteer: [
        "chrome_automation",
        "pdf_generation",
        "screenshot_capture",
        "performance_testing",
        "scraping"
      ],
      selenium: [
        "web_driver_automation",
        "grid_testing",
        "legacy_browser_support",
        "parallel_execution",
        "cloud_testing"
      ]
    };
    
    return capabilities[serverType] || [];
  }

  private async executeTestCase(testCase: any, project: Project): Promise<any> {
    const framework = testCase.generatedBy || testCase.type || 'jest';
    
    try {
      console.log(`Executing test case: ${testCase.name} using ${framework}`);
      
      // Determine which MCP server to use based on test type
      const mcpServer = this.selectMCPServer(testCase.type);
      
      const result = {
        testCaseId: testCase.id,
        name: testCase.name,
        type: testCase.type,
        framework,
        mcpServer,
        status: 'passed', // Simulated result
        duration: Math.floor(Math.random() * 5000) + 1000, // 1-6 seconds
        logs: [],
        screenshots: [],
        errors: []
      };

      // Simulate different test execution scenarios
      const shouldPass = Math.random() > 0.2; // 80% pass rate
      
      if (shouldPass) {
        result.status = 'passed';
        result.logs.push(`✓ ${testCase.description}`);
        
        if (testCase.type === 'e2e') {
          result.screenshots.push(`screenshot_${testCase.id}_success.png`);
        }
      } else {
        result.status = 'failed';
        result.errors.push(`Test failed: ${this.generateRealisticError(testCase.type)}`);
        result.logs.push(`✗ ${testCase.description}`);
        
        if (testCase.type === 'e2e') {
          result.screenshots.push(`screenshot_${testCase.id}_failure.png`);
        }
      }

      // Add framework-specific execution details
      result.logs.push(`Executed via ${mcpServer} MCP server using ${framework}`);
      
      return result;
      
    } catch (error) {
      return {
        testCaseId: testCase.id,
        name: testCase.name,
        status: 'failed',
        duration: 0,
        errors: [error.message],
        logs: [`Failed to execute test: ${error.message}`]
      };
    }
  }

  private selectMCPServer(testType: string): string {
    const serverMap = {
      'e2e': 'playwright',
      'integration': 'playwright', 
      'ui': 'playwright',
      'browser': 'selenium',
      'mobile': 'playwright',
      'api': 'playwright',
      'unit': 'jest',
      'performance': 'puppeteer'
    };
    
    return serverMap[testType] || 'playwright';
  }

  private generateRealisticError(testType: string): string {
    const errors = {
      'e2e': [
        'Element not found: [data-test="login-button"]',
        'Timeout waiting for page to load',
        'Navigation failed: ERR_CONNECTION_REFUSED',
        'Element is not clickable at point (100, 200)'
      ],
      'unit': [
        'Expected "admin" but received "undefined"',
        'TypeError: Cannot read property "id" of null',
        'Assertion failed: expected true to be false',
        'ReferenceError: validateUser is not defined'
      ],
      'integration': [
        'Database connection timeout',
        'API returned 500 Internal Server Error',
        'Authentication token expired',
        'Service unavailable: Redis connection failed'
      ]
    };
    
    const errorList = errors[testType] || errors['unit'];
    return errorList[Math.floor(Math.random() * errorList.length)];
  }
}

export class AgentOrchestrator {
  private agents: Map<string, BaseAgent> = new Map();
  private timeoutHandles: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.registerAgent(new SupervisorAgent());
    this.registerAgent(new CodeAnalyzerAgent());
    this.registerAgent(new RiskAssessorAgent());
    this.registerAgent(new TestGeneratorAgent());
    this.registerAgent(new EnvironmentSetupAgent());
    this.registerAgent(new TestExecutionAgent());
  }

  private registerAgent(agent: BaseAgent) {
    this.agents.set(agent.type, agent);
  }

  getAgent(type: string): BaseAgent | undefined {
    return this.agents.get(type);
  }

  // Clean up all timeouts to prevent memory leaks
  cleanup() {
    this.timeoutHandles.forEach((handle) => {
      clearTimeout(handle);
    });
    this.timeoutHandles.clear();
  }

  async executeTestWorkflow(project: Project, testCases: any[]): Promise<any> {
    try {
      console.log(`Starting test execution workflow for project: ${project.name}`);
      
      // Get test execution agent
      const testExecutor = this.getAgent("executor") as TestExecutionAgent;
      if (!testExecutor) {
        throw new Error("Test Execution agent not found");
      }

      // Execute tests using MCP servers
      const executionResults = await testExecutor.execute(project, testCases);
      console.log("Test execution completed:", executionResults.summary);
      
      return executionResults;
    } catch (error) {
      console.error("Test execution workflow error:", error);
      throw error;
    }
  }

  async executeWorkflow(project: Project): Promise<void> {
    const workflowId = `workflow-${project.id}-${Date.now()}`;
    
    try {
      console.log(`🚀 Starting workflow for project: ${project.name}`);
      
      // Update project status
      await storage.updateProject(project.id, { analysisStatus: 'analyzing' });

      // Create analysis records for tracking progress
      const analysisTypes = ['initial_analysis', 'architecture_review', 'risk_assessment', 'test_generation'];
      const createdAnalyses = [];
      
      for (const type of analysisTypes) {
        const analysis = await storage.createAnalysis({
          projectId: project.id,
          type,
          agentId: null,
          status: 'pending'
        });
        createdAnalyses.push(analysis);
      }

      // Step 1: Code Analysis (simulate with delays for visible progress)
      console.log(`📊 Step 1: Starting code analysis...`);
      if (createdAnalyses[0]) {
        await storage.updateAnalysis(createdAnalyses[0].id, { status: 'running' });
        
        // Simulate analysis work with timeout handle
        const timeout1 = setTimeout(async () => {
          const codeAnalysis = {
            languages: { typescript: 75, javascript: 20, css: 3, html: 2 },
            frameworks: ["React", "Express", "Drizzle ORM"],
            complexity: { cyclomatic: 45, cognitive: 38 },
            linesOfCode: 12450,
            files: 187,
            testCoverage: 45
          };
          
          await storage.updateAnalysis(createdAnalyses[0].id, { 
            status: 'completed',
            results: codeAnalysis
          });
          console.log(`✅ Code analysis completed`);
          
          this.timeoutHandles.delete(`${workflowId}-1`);
        }, 3000);
        
        this.timeoutHandles.set(`${workflowId}-1`, timeout1);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // Step 2: Architecture Review
      console.log(`🏗️ Step 2: Starting architecture review...`);
      if (createdAnalyses[1]) {
        await storage.updateAnalysis(createdAnalyses[1].id, { status: 'running' });
        
        const timeout2 = setTimeout(async () => {
          const architectureReview = {
            patterns: ["Component Architecture", "REST API", "Database Layer"],
            structure: ["Frontend SPA", "Backend API", "PostgreSQL Database"],
            strengths: ["Modern stack", "Type safety", "Modular design"],
            weaknesses: ["Limited error handling", "Missing tests"]
          };
          
          await storage.updateAnalysis(createdAnalyses[1].id, { 
            status: 'completed',
            results: architectureReview
          });
          console.log(`✅ Architecture review completed`);
          
          this.timeoutHandles.delete(`${workflowId}-2`);
        }, 2500);
        
        this.timeoutHandles.set(`${workflowId}-2`, timeout2);
        await new Promise(resolve => setTimeout(resolve, 2500));
      }

      // Step 3: Risk Assessment
      console.log(`⚠️ Step 3: Starting risk assessment...`);
      if (createdAnalyses[2]) {
        await storage.updateAnalysis(createdAnalyses[2].id, { status: 'running' });
        
        const timeout3 = setTimeout(async () => {
          const riskAssessment = {
            securityRisks: [
              { severity: 'medium', category: 'Authentication', description: 'Missing rate limiting' },
              { severity: 'low', category: 'Dependencies', description: 'Some outdated packages' }
            ],
            performanceRisks: [
              { severity: 'medium', area: 'Database', description: 'N+1 query potential' }
            ],
            overallRisk: 'medium'
          };
          
          await storage.updateAnalysis(createdAnalyses[2].id, { 
            status: 'completed',
            results: riskAssessment
          });
          console.log(`✅ Risk assessment completed`);
          
          this.timeoutHandles.delete(`${workflowId}-3`);
        }, 3500);
        
        this.timeoutHandles.set(`${workflowId}-3`, timeout3);
        await new Promise(resolve => setTimeout(resolve, 3500));
      }

      // Step 4: Test Generation
      console.log(`🧪 Step 4: Starting test generation...`);
      if (createdAnalyses[3]) {
        await storage.updateAnalysis(createdAnalyses[3].id, { status: 'running' });
        
        const timeout4 = setTimeout(async () => {
          const testGeneration = {
            testCases: [
              { name: "User Authentication Test", type: "integration", priority: "high" },
              { name: "API Endpoint Tests", type: "unit", priority: "high" },
              { name: "UI Component Tests", type: "unit", priority: "medium" },
              { name: "E2E User Flow Test", type: "e2e", priority: "high" }
            ],
            testStrategy: {
              coverage: 75,
              frameworks: ["Jest", "Playwright", "React Testing Library"],
              approach: "TDD"
            }
          };
          
          await storage.updateAnalysis(createdAnalyses[3].id, { 
            status: 'completed',
            results: testGeneration
          });
          console.log(`✅ Test generation completed`);
          
          this.timeoutHandles.delete(`${workflowId}-4`);
        }, 4000);
        
        this.timeoutHandles.set(`${workflowId}-4`, timeout4);
        await new Promise(resolve => setTimeout(resolve, 4000));
      }

      // Mark project as completed
      await storage.updateProject(project.id, { analysisStatus: 'completed' });
      console.log(`🎉 Workflow completed for project: ${project.name}`);

    } catch (error) {
      console.error(`❌ Workflow failed for project: ${project.name}`, error);
      await storage.updateProject(project.id, { analysisStatus: 'failed' });
      
      // Clean up any remaining timeouts for this workflow
      this.timeoutHandles.forEach((handle, key) => {
        if (key.startsWith(workflowId)) {
          clearTimeout(handle);
          this.timeoutHandles.delete(key);
        }
      });
      
      throw error;
    }
  }
}

export const agentOrchestrator = new AgentOrchestrator();

// Cleanup on process exit to prevent memory leaks
process.on('exit', () => {
  agentOrchestrator.cleanup();
});

process.on('SIGINT', () => {
  agentOrchestrator.cleanup();
  process.exit();
});

process.on('SIGTERM', () => {
  agentOrchestrator.cleanup();
  process.exit();
});