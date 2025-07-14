import { storage } from "../storage";
import type { Project, TestCase, Analysis } from "@shared/schema";

interface TestExecutionHistory {
  testCaseId: number;
  testName: string;
  executionDate: Date;
  result: 'passed' | 'failed' | 'skipped';
  duration: number;
  errorType?: string;
  codeChanges?: string[];
  branchName?: string;
}

interface RiskScore {
  testCaseId: number;
  testName: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  score: number; // 0-100
  factors: {
    historicalFailureRate: number;
    recentChanges: number;
    complexity: number;
    dependencies: number;
    lastFailureRecency: number;
  };
  recommendation: string;
}

interface CodeChangeImpact {
  filesChanged: string[];
  affectedComponents: string[];
  impactedTests: {
    testCaseId: number;
    testName: string;
    confidence: number; // 0-100
    reason: string;
  }[];
  riskLevel: 'high' | 'medium' | 'low';
}

interface TestPrediction {
  testCaseId: number;
  testName: string;
  predictedOutcome: 'pass' | 'fail';
  confidence: number; // 0-100
  riskFactors: string[];
  similarFailures: {
    testName: string;
    date: Date;
    pattern: string;
  }[];
}

interface OptimalTestOrder {
  orderedTests: {
    testCaseId: number;
    testName: string;
    priority: number;
    estimatedDuration: number;
    failureProbability: number;
    reason: string;
  }[];
  estimatedTotalTime: number;
  expectedFailureDetectionTime: number;
}

export class MLTestingIntelligence {
  private executionHistory: Map<number, TestExecutionHistory[]> = new Map();
  
  constructor() {
    // Initialize with some mock historical data for demonstration
    this.initializeMockHistory();
  }

  private initializeMockHistory() {
    // Simulate historical test execution data
    const mockHistory: TestExecutionHistory[] = [
      {
        testCaseId: 1,
        testName: "User Authentication Test",
        executionDate: new Date(Date.now() - 86400000 * 7),
        result: 'failed',
        duration: 3500,
        errorType: 'AuthenticationError',
        codeChanges: ['auth.service.ts', 'login.component.tsx']
      },
      {
        testCaseId: 1,
        testName: "User Authentication Test",
        executionDate: new Date(Date.now() - 86400000 * 3),
        result: 'passed',
        duration: 2800,
        codeChanges: ['auth.service.ts']
      },
      {
        testCaseId: 2,
        testName: "API Endpoint Tests",
        executionDate: new Date(Date.now() - 86400000 * 5),
        result: 'failed',
        duration: 5200,
        errorType: 'NetworkTimeout',
        codeChanges: ['api.routes.ts', 'middleware.ts']
      }
    ];

    mockHistory.forEach(history => {
      if (!this.executionHistory.has(history.testCaseId)) {
        this.executionHistory.set(history.testCaseId, []);
      }
      this.executionHistory.get(history.testCaseId)!.push(history);
    });
  }

  /**
   * Calculate ML-based risk scores for test cases
   */
  async calculateRiskScores(projectId: number): Promise<RiskScore[]> {
    const testCases = await storage.getTestCasesByProject(projectId);
    const riskScores: RiskScore[] = [];

    for (const testCase of testCases) {
      const history = this.executionHistory.get(testCase.id) || [];
      
      // Calculate historical failure rate
      const failureCount = history.filter(h => h.result === 'failed').length;
      const totalRuns = history.length || 1;
      const historicalFailureRate = (failureCount / totalRuns) * 100;

      // Calculate recency of last failure
      const lastFailure = history
        .filter(h => h.result === 'failed')
        .sort((a, b) => b.executionDate.getTime() - a.executionDate.getTime())[0];
      
      const daysSinceLastFailure = lastFailure 
        ? Math.floor((Date.now() - lastFailure.executionDate.getTime()) / 86400000)
        : 999;
      
      const lastFailureRecency = daysSinceLastFailure < 7 ? 100 : 
                                 daysSinceLastFailure < 30 ? 50 : 0;

      // Simulate code complexity analysis
      const complexity = this.calculateComplexity(testCase);
      
      // Simulate dependency analysis
      const dependencies = this.calculateDependencies(testCase);
      
      // Calculate recent changes impact
      const recentChanges = this.calculateRecentChangesImpact(testCase, history);

      // Calculate overall risk score
      const score = Math.min(100, 
        (historicalFailureRate * 0.3) +
        (lastFailureRecency * 0.2) +
        (complexity * 0.2) +
        (dependencies * 0.15) +
        (recentChanges * 0.15)
      );

      const riskLevel = score >= 70 ? 'critical' :
                       score >= 50 ? 'high' :
                       score >= 30 ? 'medium' : 'low';

      riskScores.push({
        testCaseId: testCase.id,
        testName: testCase.name,
        riskLevel,
        score: Math.round(score),
        factors: {
          historicalFailureRate: Math.round(historicalFailureRate),
          recentChanges,
          complexity,
          dependencies,
          lastFailureRecency
        },
        recommendation: this.generateRiskRecommendation(riskLevel, score)
      });
    }

    return riskScores.sort((a, b) => b.score - a.score);
  }

  /**
   * Smart test selection based on code changes
   */
  async selectTestsForCodeChanges(
    projectId: number, 
    changedFiles: string[]
  ): Promise<CodeChangeImpact> {
    const testCases = await storage.getTestCasesByProject(projectId);
    const impactedTests: CodeChangeImpact['impactedTests'] = [];

    // Analyze which components are affected
    const affectedComponents = this.identifyAffectedComponents(changedFiles);

    for (const testCase of testCases) {
      const impactScore = this.calculateCodeChangeImpact(
        testCase, 
        changedFiles, 
        affectedComponents
      );

      if (impactScore.confidence > 30) {
        impactedTests.push({
          testCaseId: testCase.id,
          testName: testCase.name,
          confidence: impactScore.confidence,
          reason: impactScore.reason
        });
      }
    }

    // Sort by confidence
    impactedTests.sort((a, b) => b.confidence - a.confidence);

    const riskLevel = impactedTests.filter(t => t.confidence > 70).length > 5 ? 'high' :
                     impactedTests.filter(t => t.confidence > 50).length > 3 ? 'medium' : 'low';

    return {
      filesChanged: changedFiles,
      affectedComponents,
      impactedTests,
      riskLevel
    };
  }

  /**
   * Predict test failures using ML patterns
   */
  async predictTestFailures(projectId: number): Promise<TestPrediction[]> {
    const testCases = await storage.getTestCasesByProject(projectId);
    const predictions: TestPrediction[] = [];

    for (const testCase of testCases) {
      const history = this.executionHistory.get(testCase.id) || [];
      const prediction = this.analyzeFailurePatterns(testCase, history);
      
      predictions.push(prediction);
    }

    return predictions.sort((a, b) => {
      // Sort by failure probability (fail predictions first) and confidence
      if (a.predictedOutcome === 'fail' && b.predictedOutcome === 'pass') return -1;
      if (a.predictedOutcome === 'pass' && b.predictedOutcome === 'fail') return 1;
      return b.confidence - a.confidence;
    });
  }

  /**
   * Determine optimal test execution order
   */
  async optimizeTestExecutionOrder(
    projectId: number,
    testCaseIds?: number[]
  ): Promise<OptimalTestOrder> {
    let testCases = await storage.getTestCasesByProject(projectId);
    
    if (testCaseIds && testCaseIds.length > 0) {
      testCases = testCases.filter(tc => testCaseIds.includes(tc.id));
    }

    const riskScores = await this.calculateRiskScores(projectId);
    const predictions = await this.predictTestFailures(projectId);

    // Create test execution order based on multiple factors
    const orderedTests = testCases.map(testCase => {
      const risk = riskScores.find(r => r.testCaseId === testCase.id);
      const prediction = predictions.find(p => p.testCaseId === testCase.id);
      const history = this.executionHistory.get(testCase.id) || [];
      
      // Calculate average duration
      const avgDuration = history.length > 0
        ? history.reduce((sum, h) => sum + h.duration, 0) / history.length
        : 3000; // Default 3 seconds

      // Calculate failure probability
      const failureProbability = prediction?.predictedOutcome === 'fail' 
        ? prediction.confidence / 100
        : (risk?.score || 0) / 100;

      // Priority score (higher = run first)
      // Prioritize: High failure probability + Short duration + Critical tests
      const priority = 
        (failureProbability * 40) + // Fail fast
        ((1 - avgDuration / 10000) * 30) + // Prefer quick tests
        ((risk?.score || 0) / 100 * 20) + // High risk tests
        (testCase.priority === 'high' ? 10 : 0); // High priority tests

      return {
        testCaseId: testCase.id,
        testName: testCase.name,
        priority: Math.round(priority),
        estimatedDuration: Math.round(avgDuration),
        failureProbability: Math.round(failureProbability * 100),
        reason: this.generateOrderReason(failureProbability, avgDuration, risk?.riskLevel)
      };
    });

    // Sort by priority (descending)
    orderedTests.sort((a, b) => b.priority - a.priority);

    // Calculate metrics
    const estimatedTotalTime = orderedTests.reduce((sum, t) => sum + t.estimatedDuration, 0);
    
    // Estimate when we'll likely detect the first failure
    let expectedFailureDetectionTime = 0;
    let cumulativeTime = 0;
    for (const test of orderedTests) {
      cumulativeTime += test.estimatedDuration;
      if (test.failureProbability > 50) {
        expectedFailureDetectionTime = cumulativeTime;
        break;
      }
    }

    return {
      orderedTests,
      estimatedTotalTime,
      expectedFailureDetectionTime
    };
  }

  // Helper methods
  private calculateComplexity(testCase: TestCase): number {
    // Simulate complexity based on test type and description length
    const typeComplexity = {
      'unit': 20,
      'integration': 50,
      'e2e': 80,
      'performance': 70,
      'security': 75
    };
    
    const baseComplexity = typeComplexity[testCase.type] || 40;
    const descriptionComplexity = Math.min(20, testCase.description.length / 10);
    
    return Math.round(baseComplexity + descriptionComplexity);
  }

  private calculateDependencies(testCase: TestCase): number {
    // Simulate dependency analysis
    const typeDependencies = {
      'unit': 10,
      'integration': 60,
      'e2e': 85,
      'performance': 40,
      'security': 50
    };
    
    return typeDependencies[testCase.type] || 30;
  }

  private calculateRecentChangesImpact(
    testCase: TestCase, 
    history: TestExecutionHistory[]
  ): number {
    // Check recent executions for code changes
    const recentExecutions = history
      .filter(h => h.executionDate > new Date(Date.now() - 7 * 86400000))
      .filter(h => h.codeChanges && h.codeChanges.length > 0);
    
    if (recentExecutions.length === 0) return 0;
    
    const avgChanges = recentExecutions.reduce((sum, h) => 
      sum + (h.codeChanges?.length || 0), 0
    ) / recentExecutions.length;
    
    return Math.min(100, avgChanges * 20);
  }

  private generateRiskRecommendation(riskLevel: string, score: number): string {
    if (riskLevel === 'critical') {
      return 'Run this test in every build. Consider adding more granular tests.';
    } else if (riskLevel === 'high') {
      return 'Include in smoke tests and run on every PR.';
    } else if (riskLevel === 'medium') {
      return 'Run in nightly builds and before releases.';
    } else {
      return 'Can be run in weekly regression suites.';
    }
  }

  private identifyAffectedComponents(changedFiles: string[]): string[] {
    const components = new Set<string>();
    
    changedFiles.forEach(file => {
      if (file.includes('auth')) components.add('Authentication');
      if (file.includes('api')) components.add('API Layer');
      if (file.includes('component')) components.add('UI Components');
      if (file.includes('service')) components.add('Business Logic');
      if (file.includes('db') || file.includes('model')) components.add('Data Layer');
      if (file.includes('route')) components.add('Routing');
    });
    
    return Array.from(components);
  }

  private calculateCodeChangeImpact(
    testCase: TestCase,
    changedFiles: string[],
    affectedComponents: string[]
  ): { confidence: number; reason: string } {
    let confidence = 0;
    const reasons: string[] = [];

    // Direct file match
    const testFile = testCase.name.toLowerCase().replace(/\s+/g, '-');
    changedFiles.forEach(file => {
      if (file.toLowerCase().includes(testFile) || 
          testFile.includes(file.toLowerCase().replace('.ts', '').replace('.tsx', ''))) {
        confidence += 90;
        reasons.push('Direct file match');
      }
    });

    // Component match
    affectedComponents.forEach(component => {
      if (testCase.name.includes(component) || testCase.description.includes(component)) {
        confidence += 60;
        reasons.push(`Tests ${component}`);
      }
    });

    // Test type relevance
    if (testCase.type === 'integration' && affectedComponents.includes('API Layer')) {
      confidence += 40;
      reasons.push('Integration test for changed API');
    }
    
    if (testCase.type === 'e2e' && changedFiles.some(f => f.includes('component'))) {
      confidence += 30;
      reasons.push('E2E test may be affected by UI changes');
    }

    return {
      confidence: Math.min(100, confidence),
      reason: reasons.join(', ') || 'General test coverage'
    };
  }

  private analyzeFailurePatterns(
    testCase: TestCase,
    history: TestExecutionHistory[]
  ): TestPrediction {
    const recentHistory = history.slice(-10); // Last 10 executions
    const failures = recentHistory.filter(h => h.result === 'failed');
    
    // Analyze patterns
    const riskFactors: string[] = [];
    const similarFailures: TestPrediction['similarFailures'] = [];

    // Time-based patterns
    const failuresByDay = new Map<string, number>();
    failures.forEach(f => {
      const day = f.executionDate.toLocaleDateString('en-US', { weekday: 'short' });
      failuresByDay.set(day, (failuresByDay.get(day) || 0) + 1);
    });

    // Find day with most failures
    let maxFailureDay = '';
    let maxFailures = 0;
    failuresByDay.forEach((count, day) => {
      if (count > maxFailures) {
        maxFailures = count;
        maxFailureDay = day;
      }
    });

    if (maxFailureDay && maxFailures > 2) {
      riskFactors.push(`Fails frequently on ${maxFailureDay}s`);
    }

    // Error type patterns
    const errorTypes = new Map<string, number>();
    failures.forEach(f => {
      if (f.errorType) {
        errorTypes.set(f.errorType, (errorTypes.get(f.errorType) || 0) + 1);
      }
    });

    errorTypes.forEach((count, errorType) => {
      if (count > 1) {
        riskFactors.push(`Recurring ${errorType} errors`);
        similarFailures.push({
          testName: testCase.name,
          date: failures.find(f => f.errorType === errorType)!.executionDate,
          pattern: errorType
        });
      }
    });

    // Calculate failure rate
    const failureRate = recentHistory.length > 0 
      ? (failures.length / recentHistory.length) 
      : 0;

    // Environmental factors
    if (testCase.type === 'e2e' && new Date().getDay() === 1) {
      riskFactors.push('E2E tests have higher failure rate on Mondays');
    }

    // Make prediction
    const predictedOutcome = failureRate > 0.3 || riskFactors.length > 2 ? 'fail' : 'pass';
    const confidence = Math.min(100, 
      (failureRate * 50) + 
      (riskFactors.length * 15) + 
      (similarFailures.length * 10)
    );

    return {
      testCaseId: testCase.id,
      testName: testCase.name,
      predictedOutcome,
      confidence: Math.round(confidence),
      riskFactors,
      similarFailures
    };
  }

  private generateOrderReason(
    failureProbability: number, 
    duration: number, 
    riskLevel?: string
  ): string {
    const reasons = [];
    
    if (failureProbability > 0.7) {
      reasons.push('High failure probability');
    }
    if (duration < 2000) {
      reasons.push('Quick execution');
    }
    if (riskLevel === 'critical' || riskLevel === 'high') {
      reasons.push(`${riskLevel} risk test`);
    }
    
    return reasons.join(', ') || 'Standard priority';
  }

  // Record test execution for learning
  async recordTestExecution(
    testCaseId: number,
    testName: string,
    result: 'passed' | 'failed' | 'skipped',
    duration: number,
    errorType?: string,
    codeChanges?: string[]
  ) {
    const execution: TestExecutionHistory = {
      testCaseId,
      testName,
      executionDate: new Date(),
      result,
      duration,
      errorType,
      codeChanges
    };

    if (!this.executionHistory.has(testCaseId)) {
      this.executionHistory.set(testCaseId, []);
    }
    
    this.executionHistory.get(testCaseId)!.push(execution);
    
    // Keep only last 100 executions per test
    const history = this.executionHistory.get(testCaseId)!;
    if (history.length > 100) {
      this.executionHistory.set(testCaseId, history.slice(-100));
    }
  }
}

// Export singleton instance
export const mlTestingIntelligence = new MLTestingIntelligence();
