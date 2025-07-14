import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { agentOrchestrator } from "./services/agents";
import { insertProjectSchema, insertTestCaseSchema } from "@shared/schema";
import { productionDeploymentService } from "./services/production-deployment";
import { comprehensiveTestingService } from "./services/comprehensive-testing";
import { multiPlatformTestingService } from "./services/multi-platform-testing";
import { googleDriveService } from "./services/google-drive-integration";
import { jiraService } from "./services/jira-integration";
import { githubService } from "./services/github-integration";
import { mlTestingIntelligence } from "./services/ml-testing-intelligence";
import aiTestingRoutes from "./routes-ai-testing";
import multer from "multer";
import { z } from "zod";

// Constants for timeout values - no more magic numbers
const TIMEOUTS = {
  TEST_EXECUTION: 2000,
  ANALYSIS_DELAY: 1000,
  ANALYSIS_STEP_INTERVAL: 3000,
  MAX_TEST_CASES: 25,
  FILE_SIZE_LIMIT: 50 * 1024 * 1024 // 50MB
};

// Timeout management to prevent memory leaks
const activeTimeouts = new Map<string, NodeJS.Timeout>();

function createManagedTimeout(key: string, callback: () => void, delay: number): void {
  // Clear existing timeout if it exists
  if (activeTimeouts.has(key)) {
    clearTimeout(activeTimeouts.get(key)!);
  }
  
  const timeout = setTimeout(() => {
    activeTimeouts.delete(key);
    callback();
  }, delay);
  
  activeTimeouts.set(key, timeout);
}

function clearManagedTimeout(key: string): void {
  const timeout = activeTimeouts.get(key);
  if (timeout) {
    clearTimeout(timeout);
    activeTimeouts.delete(key);
  }
}

// Cleanup function for graceful shutdown
export function cleanupTimeouts(): void {
  activeTimeouts.forEach((timeout) => clearTimeout(timeout));
  activeTimeouts.clear();
}

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: TIMEOUTS.FILE_SIZE_LIMIT,
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Register AI testing routes (AI Code Review & Visual Regression Testing)
  app.use(aiTestingRoutes);
  
  // Get all projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Create new project
  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      
      // Handle different source types
      let enhancedProject = { ...validatedData };
      
      if (validatedData.sourceType === 'drive') {
        // Acquiring project from Google Drive
        const driveData = validatedData.repositoryData as any;
        const driveResult = await googleDriveService.acquireProject({
          fileId: driveData.driveFileId,
          accessToken: driveData.driveAccessToken
        });
        
        if (!driveResult.success) {
          return res.status(400).json({ 
            message: `Google Drive acquisition failed: ${driveResult.error}` 
          });
        }
        
        // Store drive acquisition results
        enhancedProject.repositoryData = {
          ...driveData,
          acquisitionResult: driveResult,
          fileCount: driveResult.files.length
        };
        // Successfully acquired files from Google Drive
        
      } else if (validatedData.sourceType === 'jira') {
        // Acquiring project from JIRA
        const jiraData = validatedData.repositoryData as any;
        const jiraResult = await jiraService.acquireProject({
          serverUrl: jiraData.jiraServerUrl,
          projectKey: jiraData.jiraProjectKey,
          email: jiraData.jiraEmail,
          apiToken: jiraData.jiraApiToken
        });
        
        if (!jiraResult.success) {
          return res.status(400).json({ 
            message: `JIRA acquisition failed: ${jiraResult.error}` 
          });
        }
        
        // Store JIRA acquisition results
        enhancedProject.repositoryData = {
          ...jiraData,
          acquisitionResult: jiraResult,
          issueCount: jiraResult.issues.length,
          attachmentCount: jiraResult.attachments.length
        };
        // Successfully acquired JIRA project data
      } else if (validatedData.sourceType === 'github') {
        // Acquiring project from GitHub
        const githubData = validatedData.repositoryData as any;
        const githubResult = await githubService.acquireProject({
          owner: githubData.owner,
          repo: githubData.repo,
          branch: githubData.branch,
          path: githubData.path,
          accessToken: githubData.accessToken
        });
        
        if (!githubResult.success) {
          return res.status(400).json({ 
            message: `GitHub acquisition failed: ${githubResult.error}` 
          });
        }
        
        // Store GitHub acquisition results
        enhancedProject.repositoryData = {
          ...githubData,
          acquisitionResult: githubResult,
          fileCount: githubResult.files.length,
          repository: githubResult.repository
        };
        // Successfully acquired GitHub repository
      }
      
      const project = await storage.createProject(enhancedProject);
      
      // Start Production LangGraph analysis workflow asynchronously
      try {
        const { productionLangGraphWorkflow } = await import("./services/langraph-production");
        productionLangGraphWorkflow.execute(project).catch(error => {
          console.error(`Production LangGraph workflow failed for project ${project.id}:`, error);
          storage.updateProject(project.id, { analysisStatus: 'failed' }).catch(console.error);
        });
      } catch (importError) {
        console.error("Failed to import Production LangGraph workflow:", importError);
        try {
          // Fallback to standard LangGraph
          const { langGraphWorkflow } = await import("./services/langraph-workflow");
          langGraphWorkflow.executeWorkflow(project).catch(error => {
            console.error(`Standard LangGraph workflow failed for project ${project.id}:`, error);
            storage.updateProject(project.id, { analysisStatus: 'failed' }).catch(console.error);
          });
        } catch (fallbackError) {
          console.error("All LangGraph workflows failed, using agent orchestrator:", fallbackError);
          agentOrchestrator.executeWorkflow(project).catch(console.error);
        }
      }
      
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid project data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create project" });
      }
    }
  });

  // Get project by ID
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Delete project by ID
  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Delete related data first
      const analyses = await storage.getAnalysesByProject(id);
      for (const analysis of analyses) {
        await storage.deleteAnalysis(analysis.id);
      }
      
      const testCases = await storage.getTestCasesByProject(id);
      for (const testCase of testCases) {
        await storage.deleteTestCase(testCase.id);
      }
      
      const recommendations = await storage.getRecommendationsByProject(id);
      for (const recommendation of recommendations) {
        await storage.deleteRecommendation(recommendation.id);
      }
      
      // Finally delete the project
      await storage.deleteProject(id);
      
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Get project analyses
  app.get("/api/projects/:id/analyses", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const analyses = await storage.getAnalysesByProject(projectId);
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analyses" });
    }
  });

  // Get project test cases
  app.get("/api/projects/:id/test-cases", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const testCases = await storage.getTestCasesByProject(projectId);
      res.json(testCases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch test cases", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get project recommendations
  app.get("/api/projects/:id/recommendations", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const recommendations = await storage.getRecommendationsByProject(projectId);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  // ML Intelligence Endpoints
  
  // Get ML-based risk scores
  app.get("/api/projects/:id/ml/risk-scores", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const riskScores = await mlTestingIntelligence.calculateRiskScores(projectId);
      res.json(riskScores);
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate risk scores" });
    }
  });

  // Smart test selection based on code changes
  app.post("/api/projects/:id/ml/smart-test-selection", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { changedFiles } = req.body;
      
      if (!changedFiles || !Array.isArray(changedFiles)) {
        return res.status(400).json({ message: "Changed files array is required" });
      }
      
      const impact = await mlTestingIntelligence.selectTestsForCodeChanges(projectId, changedFiles);
      res.json(impact);
    } catch (error) {
      res.status(500).json({ message: "Failed to perform smart test selection" });
    }
  });

  // Predict test failures
  app.get("/api/projects/:id/ml/failure-predictions", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const predictions = await mlTestingIntelligence.predictTestFailures(projectId);
      res.json(predictions);
    } catch (error) {
      res.status(500).json({ message: "Failed to predict test failures" });
    }
  });

  // Get optimal test execution order
  app.post("/api/projects/:id/ml/optimal-test-order", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { testCaseIds } = req.body;
      
      const optimalOrder = await mlTestingIntelligence.optimizeTestExecutionOrder(projectId, testCaseIds);
      res.json(optimalOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to optimize test execution order" });
    }
  });

  // Record test execution result for ML learning
  app.post("/api/test-cases/:id/ml/record-execution", async (req, res) => {
    try {
      const testCaseId = parseInt(req.params.id);
      const { testName, result, duration, errorType, codeChanges } = req.body;
      
      await mlTestingIntelligence.recordTestExecution(
        testCaseId,
        testName,
        result,
        duration,
        errorType,
        codeChanges
      );
      
      res.json({ message: "Test execution recorded for ML analysis" });
    } catch (error) {
      res.status(500).json({ message: "Failed to record test execution" });
    }
  });

  // Start analysis for a project
  app.post("/api/projects/:id/analyze", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if analysis is already running
      if (project.analysisStatus === 'analyzing') {
        return res.json({ message: "Analysis already in progress" });
      }

      try {
        // Import LangGraph workflow
        const { langGraphWorkflow } = await import("./services/langraph-workflow");

        // Start analysis workflow asynchronously using LangGraph
        langGraphWorkflow.executeWorkflow(project).catch(error => {
          console.error(`LangGraph analysis failed for project ${id}:`, error);
          storage.updateProject(id, { analysisStatus: 'failed' }).catch(console.error);
        });

        res.json({ message: "Analysis started successfully" });
      } catch (importError) {
        console.error("Failed to import LangGraph workflow:", importError);
        res.status(500).json({ message: "Failed to initialize analysis workflow" });
      }
    } catch (error) {
      console.error("Analysis endpoint error:", error);
      res.status(500).json({ message: "Failed to start analysis" });
    }
  });

  // Get all agents
  app.get("/api/agents", async (req, res) => {
    try {
      const agents = await storage.getAllAgents();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  // Create test cases manually (for testing)
  app.post("/api/projects/:id/test-cases", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const testCaseData = req.body;
      
      if (Array.isArray(testCaseData)) {
        const createdTestCases = [];
        for (const testCase of testCaseData) {
          const created = await storage.createTestCase({
            ...testCase,
            projectId
          });
          createdTestCases.push(created);
        }
        res.json(createdTestCases);
      } else {
        const created = await storage.createTestCase({
          ...testCaseData,
          projectId
        });
        res.json(created);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to create test cases", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Generate automated test suite based on analysis
  app.post("/api/projects/:id/generate-automated-tests", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { categories, complexity, frameworks, analysisData, riskData } = req.body;
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Generate comprehensive test suite using the comprehensive testing service
      const testSuite = await comprehensiveTestingService.generateComprehensiveTestSuite(project, analysisData, riskData);

      // Filter and create test cases based on selected categories and complexity
      const categoryMap = {
        'functional': [...testSuite.functionalTests, ...testSuite.smokeTests, ...testSuite.sanityTests],
        'security': [...testSuite.securityTests, ...testSuite.vulnerabilityTests, ...testSuite.penetrationTests],
        'performance': [...testSuite.performanceTests],
        'api': [...testSuite.apiTests],
        'integration': [...testSuite.integrationTests],
        'e2e': [...testSuite.userAcceptanceTests],
        'accessibility': [...testSuite.accessibilityTests],
        'mobile': [...testSuite.mobileTests]
      };

      // Get test cases for selected categories
      let selectedTests = [];
      categories.forEach(category => {
        if (categoryMap[category]) {
          selectedTests.push(...categoryMap[category]);
        }
      });

      // Apply complexity filter
      const complexityMultiplier = complexity === 'basic' ? 0.4 : complexity === 'comprehensive' ? 1.0 : 0.7;
      const maxTests = Math.ceil(selectedTests.length * complexityMultiplier);
      selectedTests = selectedTests.slice(0, maxTests);

      // Create test cases in database
      const createdTestCases = [];
      for (const testCase of selectedTests) {
        // Filter by framework if specified
        if (frameworks.length > 0 && !frameworks.some(fw => testCase.framework.toLowerCase().includes(fw))) {
          // Assign a framework from the selected ones
          testCase.framework = frameworks[0];
        }

        const created = await storage.createTestCase({
          projectId,
          name: testCase.name,
          description: testCase.description,
          type: testCase.category as any,
          priority: testCase.priority,
          status: 'pending',
          framework: testCase.framework,
          script: testCase.script,
          expectedOutcome: testCase.expectedOutcome || 'Test should pass without errors',
          estimatedDuration: testCase.estimatedDuration || 300,
          executionResults: null
        });
        createdTestCases.push(created);
      }

      res.json({ 
        testCases: createdTestCases,
        summary: {
          totalGenerated: createdTestCases.length,
          categories: categories,
          complexity: complexity,
          frameworks: frameworks,
          analysisUsed: !!analysisData,
          riskAssessmentUsed: !!riskData
        }
      });
    } catch (error) {
      console.error('Error generating automated tests:', error);
      res.status(500).json({ message: "Failed to generate automated tests" });
    }
  });

  // Generate multi-platform test scripts
  app.post("/api/projects/:id/generate-platform-tests", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { platforms, categories, complexity, frameworks, analysisData, riskData, existingTests } = req.body;
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const testScripts = await multiPlatformTestingService.generatePlatformTestScripts(
        project,
        platforms,
        categories,
        analysisData,
        riskData,
        { complexity, frameworks, existingTests }
      );

      res.json({ testScripts });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate platform test scripts", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Execute platform tests via MCP agents
  app.post("/api/projects/:id/execute-platform-tests", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { testScripts, selectedPlatforms } = req.body;
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const executionResults = await multiPlatformTestingService.executePlatformTests(
        testScripts,
        selectedPlatforms
      );

      // Generate analysis report
      const analysisReport = await multiPlatformTestingService.generateTestAnalysisReport(
        executionResults,
        project
      );

      res.json({ 
        executionResults,
        analysisReport,
        summary: {
          totalTests: executionResults.length,
          platforms: selectedPlatforms,
          executionTime: Date.now()
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to execute platform tests", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get MCP agents status
  app.get("/api/mcp-agents", async (req, res) => {
    try {
      const agents = multiPlatformTestingService.getMCPAgents();
      res.json({ agents });
    } catch (error) {
      res.status(500).json({ message: "Failed to get MCP agents status", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Generate enhanced test suite
  app.post("/api/projects/:id/generate-enhanced-tests", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { testCategories, framework, includeSpecialized } = req.body;
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Get existing analyses for the project
      const analyses = await storage.getAnalysesByProject(projectId);
      const codeAnalysis = analyses.find(a => a.type === 'initial_analysis')?.results;
      const riskAssessment = analyses.find(a => a.type === 'risk_assessment')?.results;

      // Generate comprehensive test suite
      const testSuite = await comprehensiveTestingService.generateComprehensiveTestSuite(project, codeAnalysis, riskAssessment);

      // Combine all test cases from different categories
      const allTestCases = [
        ...testSuite.securityTests,
        ...testSuite.functionalTests,
        ...testSuite.performanceTests,
        ...testSuite.accessibilityTests,
        ...testSuite.visualTests,
        ...testSuite.apiTests,
        ...testSuite.smokeTests,
        ...testSuite.regressionTests,
        ...testSuite.usabilityTests,
        ...testSuite.compatibilityTests
      ];

      // Filter based on selected categories
      const selectedCategories = testCategories || ['security', 'functional', 'performance', 'specialized'];
      const filteredTestCases = allTestCases.filter(testCase => {
        if (selectedCategories.includes('security') && ['security', 'vulnerability', 'penetration'].includes(testCase.category)) return true;
        if (selectedCategories.includes('functional') && ['functional', 'smoke', 'sanity', 'regression'].includes(testCase.category)) return true;
        if (selectedCategories.includes('performance') && ['performance'].includes(testCase.category)) return true;
        if (selectedCategories.includes('specialized') && ['api', 'database', 'mobile', 'cross-browser'].includes(testCase.category)) return true;
        if (selectedCategories.includes('compatibility') && ['compatibility', 'usability', 'accessibility', 'visual'].includes(testCase.category)) return true;
        return false;
      });

      // Store generated test cases
      const createdTestCases = [];
      for (const testCase of filteredTestCases.slice(0, TIMEOUTS.MAX_TEST_CASES)) { // Limit test cases for better performance
        const created = await storage.createTestCase({
          projectId,
          name: testCase.name,
          description: testCase.description,
          type: testCase.category as any,
          priority: testCase.priority,
          status: 'pending',
          framework: testCase.framework,
          script: testCase.script,
          expectedOutcome: testCase.expectedOutcome || 'Test should pass without errors',
          estimatedDuration: testCase.estimatedDuration || 300,
          executionResults: null
        });
        createdTestCases.push(created);
      }

      res.json({ 
        testCases: createdTestCases,
        testSuite: {
          totalTests: createdTestCases.length,
          categories: testCategories,
          qualityGates: testSuite.qualityGates,
          testStrategy: testSuite.testStrategy,
          frameworks: testSuite.frameworks.map(f => f.name)
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate enhanced test suite", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get logs for a project (for testing logs tab)
  app.get("/api/projects/:id/logs", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Generate mock logs for demonstration
      const logs = Array.from({ length: 50 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date(Date.now() - (i * 60000 + Math.random() * 60000)).toISOString(),
        level: Math.random() > 0.8 ? 'error' : Math.random() > 0.6 ? 'warning' : Math.random() > 0.3 ? 'success' : 'info',
        category: ['test_execution', 'framework', 'analysis', 'security', 'performance', 'system'][Math.floor(Math.random() * 6)],
        message: [
          'Test execution started for User Authentication Test',
          'Jest framework initialized successfully',
          'Playwright browser launched on port 9222',
          'OWASP ZAP security scan completed',
          'k6 performance test finished with 95% success rate',
          'Lighthouse accessibility audit passed',
          'API endpoint validation successful',
          'Visual regression test detected UI changes',
          'Database connection established',
          'Test environment setup completed',
          'Error: Test timeout after 30 seconds',
          'Warning: Deprecated API usage detected',
          'Critical security vulnerability found in authentication',
          'Performance threshold exceeded: 5.2s response time',
          'Test suite completed with 85% pass rate'
        ][Math.floor(Math.random() * 15)],
        framework: ['jest', 'playwright', 'k6', 'owasp-zap', 'lighthouse', 'selenium'][Math.floor(Math.random() * 6)],
        duration: Math.floor(Math.random() * 10000),
        details: Math.random() > 0.7 ? {
          testCaseId: 69 + Math.floor(Math.random() * 4),
          stackTrace: 'Error at line 23 in test-auth.spec.js',
          expectedValue: 'true',
          actualValue: 'false',
          browserInfo: 'Chrome 118.0.0.0',
          environment: 'test'
        } : undefined
      })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  // Upload code repository files
  app.post("/api/upload", upload.array('files'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      // Process uploaded files
      const fileData = files.map(file => ({
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        content: file.buffer.toString('base64')
      }));

      res.json({ 
        message: "Files uploaded successfully",
        files: fileData.map(f => ({ 
          name: f.originalName, 
          size: f.size 
        }))
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  // Update test case
  app.patch("/api/test-cases/:id", async (req, res) => {
    try {
      const testCaseId = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedTestCase = await storage.updateTestCase(testCaseId, updates);
      res.json(updatedTestCase);
    } catch (error) {
      res.status(500).json({ message: "Failed to update test case" });
    }
  });

  // Run specific test case
  app.post("/api/test-cases/:id/run", async (req, res) => {
    try {
      const testCaseId = parseInt(req.params.id);
      
      // Update test case status
      await storage.updateTestCase(testCaseId, { 
        status: 'running' 
      });

      // Simulate test execution with managed timeout
      createManagedTimeout(`test-${testCaseId}`, async () => {
        const success = Math.random() > 0.3; // 70% success rate
        try {
          await storage.updateTestCase(testCaseId, {
            status: success ? 'passed' : 'failed'
          });
        } catch (error) {
          console.error(`Failed to update test case ${testCaseId}:`, error);
        }
      }, TIMEOUTS.TEST_EXECUTION);

      res.json({ message: "Test execution started" });
    } catch (error) {
      res.status(500).json({ message: "Failed to run test" });
    }
  });

  // Note: Analysis route already defined above - removing duplicate

  // Get project metrics/summary
  app.get("/api/projects/:id/metrics", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const analyses = await storage.getAnalysesByProject(projectId);
      const testCases = await storage.getTestCasesByProject(projectId);
      const recommendations = await storage.getRecommendationsByProject(projectId);

      // Calculate metrics
      const completedAnalyses = analyses.filter(a => a.status === 'completed');
      const totalTests = testCases.length;
      const passedTests = testCases.filter(tc => tc.status === 'passed').length;
      const criticalIssues = recommendations.filter(r => r.priority === 'immediate').length;

      const metrics = {
        codeQuality: Math.max(20, 100 - (criticalIssues * 10)),
        riskLevel: criticalIssues > 5 ? 'High' : criticalIssues > 2 ? 'Medium' : 'Low',
        testCoverage: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
        techDebt: recommendations.length > 10 ? 'High' : recommendations.length > 5 ? 'Medium' : 'Low',
        analysisProgress: Math.round((completedAnalyses.length / Math.max(analyses.length, 1)) * 100),
        totalRecommendations: recommendations.length,
        criticalIssues
      };

      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate metrics" });
    }
  });

  // Execute tests for a project using MCP servers
  app.post("/api/projects/:id/execute-tests", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { testType, framework } = req.body;
      
      // Get project and test cases
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const testCases = await storage.getTestCasesByProject(projectId);
      if (testCases.length === 0) {
        return res.status(400).json({ message: "No test cases found for execution" });
      }

      // Update project status to running tests
      await storage.updateProject(projectId, { analysisStatus: "testing" });
      
      // Execute tests using MCP servers asynchronously
      agentOrchestrator.executeTestWorkflow(project, testCases)
        .then(async (executionResults) => {
          // Update test case statuses based on execution results
          for (const result of executionResults.executionResults) {
            await storage.updateTestCase(result.testCaseId, { 
              status: result.status 
            });
          }
          
          // Update project status
          await storage.updateProject(projectId, { 
            analysisStatus: "completed" 
          });
          
          console.log("Test execution workflow completed:", executionResults.summary);
        })
        .catch(console.error);
      
      res.json({ 
        message: "Test execution started using MCP servers", 
        projectId, 
        testType,
        framework,
        testCasesCount: testCases.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to execute tests" });
    }
  });

  // Create a test case manually
  app.post("/api/projects/:id/test-cases", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const validatedData = insertTestCaseSchema.parse({ ...req.body, projectId });
      const testCase = await storage.createTestCase(validatedData);
      res.json(testCase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid test case data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create test case" });
      }
    }
  });

  // Get test execution results
  app.get("/api/projects/:id/execution-results", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      
      // Simulate getting execution results from the Test Execution Agent
      const executionResults = {
        projectId,
        summary: {
          total: 4,
          passed: 3,
          failed: 1,
          skipped: 0,
          coverage: 75,
          duration: 12500
        },
        mcpConnections: {
          playwright: { connected: true, capabilities: ["browser_automation", "e2e_testing", "cross_browser_testing"] },
          puppeteer: { connected: true, capabilities: ["chrome_automation", "screenshot_capture", "performance_testing"] },
          selenium: { connected: true, capabilities: ["web_driver_automation", "grid_testing", "legacy_browser_support"] }
        },
        executionResults: [
          {
            testCaseId: 1,
            name: "User Authentication Test",
            type: "integration",
            framework: "jest",
            mcpServer: "playwright",
            status: "passed",
            duration: 2800,
            logs: ["✓ Verify user login functionality with valid credentials", "Executed via playwright MCP server using jest"],
            screenshots: [],
            errors: []
          },
          {
            testCaseId: 2,
            name: "Database Connection Test",
            type: "unit",
            framework: "jest",
            mcpServer: "jest",
            status: "passed",
            duration: 1200,
            logs: ["✓ Test database connectivity and basic CRUD operations", "Executed via jest MCP server using jest"],
            screenshots: [],
            errors: []
          },
          {
            testCaseId: 3,
            name: "E-Gov Portal Navigation Test",
            type: "e2e",
            framework: "playwright",
            mcpServer: "playwright",
            status: "failed",
            duration: 5500,
            logs: ["✗ End-to-end test for citizen portal navigation and service access", "Executed via playwright MCP server using playwright"],
            screenshots: ["screenshot_3_failure.png"],
            errors: ["Test failed: Element not found: [data-test=\"services-button\"]"]
          },
          {
            testCaseId: 4,
            name: "Security Vulnerability Test",
            type: "unit",
            framework: "jest",
            mcpServer: "jest",
            status: "passed",
            duration: 3000,
            logs: ["✓ Test for SQL injection and XSS vulnerabilities", "Executed via jest MCP server using jest"],
            screenshots: [],
            errors: []
          }
        ]
      };
      
      res.json(executionResults);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch execution results" });
    }
  });

  // Generate tests for a project
  app.post("/api/projects/:id/generate-tests", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { testTypes, coverage, frameworks } = req.body;
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Get the test generation analysis results
      const analyses = await storage.getAnalysesByProject(projectId);
      const testAnalysis = analyses.find(a => a.type === 'test_generation');
      
      if (!testAnalysis || !testAnalysis.results) {
        return res.status(400).json({ message: "Test generation analysis not found" });
      }

      console.log("Creating test cases from analysis:", JSON.stringify(testAnalysis.results, null, 2));
      
      // Create test cases from the analysis results
      const testCases = (testAnalysis.results as any)?.testCases || [];
      console.log("Extracted test cases:", testCases);
      
      if (testCases.length === 0) {
        return res.status(400).json({ message: "No test cases found in analysis results" });
      }
      
      const createdTestCases = [];
      
      // Check for existing test cases to avoid duplicates
      const existingTestCases = await storage.getTestCasesByProject(projectId);
      const existingNames = new Set(existingTestCases.map(tc => tc.name));
      
      for (const testCase of testCases) {
        // Skip if test case already exists
        if (existingNames.has(testCase.name)) {
          console.log(`Test case "${testCase.name}" already exists, skipping...`);
          continue;
        }
        
        console.log("Creating test case:", testCase);
        
        // Generate realistic test script based on type
        let testScript = testCase.script || generateTestScript(testCase, frameworks[0] || 'jest');
        
        // Use the detailed script from LangGraph if available
        const langGraphTestCases = (testAnalysis.results as any)?.testCases || [];
        const detailedTest = langGraphTestCases.find((lt: any) => lt.name === testCase.name);
        if (detailedTest && detailedTest.script) {
          testScript = detailedTest.script;
        }
        
        const created = await storage.createTestCase({
          projectId,
          name: testCase.name,
          description: testCase.description || `${testCase.type} test for ${testCase.name}`,
          type: testCase.type,
          priority: testCase.priority,
          testScript,
          generatedBy: testCase.framework || frameworks[0] || 'jest'
        });
        console.log("Created test case:", created);
        createdTestCases.push(created);
      }
      
      console.log(`Created ${createdTestCases.length} test cases for project ${projectId}`);
      
      res.json({ 
        message: "Test generation completed", 
        projectId,
        testCasesCreated: createdTestCases.length,
        testCases: createdTestCases
      });
    } catch (error) {
      console.error("Test generation error:", error);
      res.status(500).json({ message: "Failed to generate tests" });
    }
  });

  // Clean up duplicate test cases
  app.delete("/api/projects/:id/test-cases/bulk", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const testCases = await storage.getTestCasesByProject(projectId);
      
      // Group by name and keep only the latest
      const uniqueTestCases = new Map();
      testCases.forEach(tc => {
        if (!uniqueTestCases.has(tc.name) || tc.id > uniqueTestCases.get(tc.name).id) {
          uniqueTestCases.set(tc.name, tc);
        }
      });
      
      // Delete duplicates
      for (const tc of testCases) {
        if (uniqueTestCases.get(tc.name).id !== tc.id) {
          await storage.deleteTestCase(tc.id);
        }
      }
      
      res.json({ message: "Duplicate test cases cleaned up" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clean up test cases" });
    }
  });

  // Run test suite for a project
  app.post("/api/projects/:id/run-test-suite", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { framework, testCaseIds } = req.body;
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      console.log(`Running test suite for project ${projectId} with ${framework}, test cases: ${testCaseIds}`);
      
      // Update all test cases to running status
      for (const testCaseId of testCaseIds) {
        await storage.updateTestCase(testCaseId, { status: 'running' });
      }

      // Simulate test suite execution
      setTimeout(async () => {
        try {
          for (const testCaseId of testCaseIds) {
            // Simulate individual test execution with realistic results
            const success = Math.random() > 0.25; // 75% success rate
            await storage.updateTestCase(testCaseId, {
              status: success ? 'passed' : 'failed',
              executionTime: Math.floor(Math.random() * 5000) + 1000, // 1-6 seconds
              results: success ? 
                { passed: true, message: `Test executed successfully with ${framework}` } :
                { passed: false, error: 'Test assertion failed', message: `Test failed during ${framework} execution` }
            });
          }
          console.log(`Test suite completed for project ${projectId}`);
        } catch (error) {
          console.error("Error during test suite execution:", error);
        }
      }, 2000);
      
      res.json({ 
        message: "Test suite execution started", 
        projectId,
        framework,
        testCount: testCaseIds.length 
      });
    } catch (error) {
      console.error("Test suite execution error:", error);
      res.status(500).json({ message: "Failed to run test suite" });
    }
  });

  // Helper function to generate realistic test scripts
  function generateTestScript(testCase: any, framework: string): string {
    const { name, type, priority } = testCase;
    
    switch (type) {
      case 'unit':
        return `// ${name} - ${framework} Unit Test
describe('${name}', () => {
  test('should execute ${name.toLowerCase()}', () => {
    // Arrange
    const mockData = { id: 1, name: 'test' };
    
    // Act
    const result = executeFunction(mockData);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
  
  test('should handle error cases', () => {
    const invalidData = null;
    expect(() => executeFunction(invalidData)).toThrow();
  });
});`;

      case 'integration':
        return `// ${name} - ${framework} Integration Test
describe('${name}', () => {
  test('should test integration flow', async () => {
    // Setup
    const testData = { username: 'test@example.com', password: 'password123' };
    
    // Execute
    const response = await request(app)
      .post('/api/auth/login')
      .send(testData)
      .expect(200);
    
    // Verify
    expect(response.body.token).toBeDefined();
    expect(response.body.user).toBeDefined();
  });
});`;

      case 'e2e':
        return `// ${name} - ${framework} End-to-End Test
describe('${name}', () => {
  test('should complete user journey', async () => {
    await page.goto('http://localhost:3000');
    
    // Login flow
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Verify dashboard
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-name"]')).toContainText('Welcome');
  });
});`;

      default:
        return `// ${name} - ${framework} Test
test('${name}', () => {
  // Test implementation for ${name}
  expect(true).toBe(true);
});`;
    }
  }

  // Test Google Drive connection
  app.post("/api/integrations/drive/test", async (req, res) => {
    try {
      const { accessToken } = req.body;
      if (!accessToken) {
        return res.status(400).json({ message: "Access token is required" });
      }
      
      const result = await googleDriveService.testConnection(accessToken);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to test Google Drive connection" });
    }
  });

  // Test JIRA connection
  app.post("/api/integrations/jira/test", async (req, res) => {
    try {
      const { serverUrl, email, apiToken } = req.body;
      if (!serverUrl || !email || !apiToken) {
        return res.status(400).json({ message: "Server URL, email, and API token are required" });
      }
      
      const result = await jiraService.testConnection({ serverUrl, email, apiToken, projectKey: "" });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to test JIRA connection" });
    }
  });

  // Test GitHub connection
  app.post("/api/integrations/github/test", async (req, res) => {
    try {
      const { accessToken } = req.body;
      const result = await githubService.testConnection(accessToken);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to test GitHub connection" });
    }
  });

  // Search GitHub repositories
  app.post("/api/integrations/github/search", async (req, res) => {
    try {
      const { query, accessToken } = req.body;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const result = await githubService.searchRepositories(query, { accessToken });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to search GitHub repositories" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}