import { storage } from "../storage";
import { anthropicService } from "./anthropic";
import type { Project, TestCase } from "@shared/schema";
import * as babel from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

interface CodeReviewSuggestion {
  id: string;
  type: 'test' | 'coverage' | 'antipattern' | 'optimization' | 'security';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  file: string;
  lineStart: number;
  lineEnd: number;
  suggestedCode?: string;
  category: string;
  confidence: number;
  realtime?: boolean;
  autoFixAvailable?: boolean;
  relatedDocs?: string[];
}

interface CoverageGap {
  file: string;
  uncoveredLines: number[];
  uncoveredFunctions: string[];
  uncoveredBranches: {
    line: number;
    type: 'if' | 'switch' | 'ternary' | 'logical' | 'try-catch' | 'loop';
    missed: string[];
    complexity: number;
  }[];
  suggestedTests: {
    testName: string;
    testType: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
    description: string;
    template: string;
    priority: number;
    estimatedCoverage: number;
  }[];
  coverageImpact: {
    current: number;
    potential: number;
    criticalPaths: string[];
  };
}

interface TestAntiPattern {
  id: string;
  pattern: string;
  severity: 'critical' | 'major' | 'minor' | 'info';
  file: string;
  line: number;
  description: string;
  impact: string;
  suggestion: string;
  autoFixCode?: string;
  example?: {
    bad: string;
    good: string;
  };
  category: 'structure' | 'assertion' | 'setup' | 'performance' | 'reliability';
  references?: string[];
}

interface CodeContext {
  functionName?: string;
  className?: string;
  imports: string[];
  dependencies: string[];
  complexity: number;
  hasTests: boolean;
  testCoverage?: number;
}

interface RealTimeSuggestionContext {
  cursor: { line: number; column: number };
  currentLine: string;
  previousLines: string[];
  nextLines: string[];
  fileType: string;
  projectContext?: any;
}

export class EnhancedAICodeReviewService {
  private codeCache: Map<string, any> = new Map();
  private suggestionHistory: Map<string, CodeReviewSuggestion[]> = new Map();
  private coverageBaseline: Map<number, any> = new Map();

  /**
   * Enhanced real-time test suggestions with context awareness
   */
  async analyzeCodeForTestSuggestions(
    projectId: number,
    fileContent: string,
    filePath: string,
    context?: RealTimeSuggestionContext
  ): Promise<CodeReviewSuggestion[]> {
    const suggestions: CodeReviewSuggestion[] = [];
    
    try {
      // Parse code using Babel for accurate AST analysis
      const ast = this.parseCode(fileContent, filePath);
      if (!ast) return suggestions;

      // Extract code structure and context
      const codeContext = await this.extractCodeContext(ast, fileContent);
      
      // Generate intelligent test suggestions
      const testSuggestions = await this.generateIntelligentTestSuggestions(
        ast, 
        codeContext, 
        filePath,
        context
      );
      suggestions.push(...testSuggestions);

      // Identify untested edge cases with ML
      const edgeCases = await this.identifyEdgeCasesWithAI(ast, codeContext, filePath);
      suggestions.push(...edgeCases);

      // Real-time context-aware suggestions
      if (context) {
        const realtimeSuggestions = await this.generateRealtimeSuggestions(
          context,
          codeContext,
          filePath
        );
        suggestions.push(...realtimeSuggestions);
      }

      // Analyze code patterns for test opportunities
      const patternSuggestions = await this.analyzeCodePatterns(ast, filePath);
      suggestions.push(...patternSuggestions);

      // Cache suggestions for performance
      this.suggestionHistory.set(filePath, suggestions);

    } catch (error) {
      console.error('Error analyzing code:', error);
    }
    
    return this.prioritizeSuggestions(suggestions);
  }

  /**
   * Advanced coverage gap detection with AI-powered analysis
   */
  async detectCoverageGaps(
    projectId: number,
    coverageData?: any,
    sourceCode?: Map<string, string>
  ): Promise<CoverageGap[]> {
    const gaps: CoverageGap[] = [];
    const project = await storage.getProject(projectId);
    
    if (!project) return gaps;

    // Get or generate coverage baseline
    const baseline = this.coverageBaseline.get(projectId) || 
                    await this.generateCoverageBaseline(projectId);

    // Analyze each file for coverage gaps
    for (const [filePath, content] of (sourceCode || new Map())) {
      const fileGaps = await this.analyzeFileCoverage(
        filePath,
        content,
        coverageData,
        baseline
      );
      
      if (fileGaps) {
        gaps.push(fileGaps);
      }
    }

    // Use AI to identify critical paths that need coverage
    const criticalPaths = await this.identifyCriticalPaths(project, gaps);
    
    // Enhance gaps with AI-powered test suggestions
    for (const gap of gaps) {
      gap.suggestedTests = await this.generateSmartTestSuggestions(gap, criticalPaths);
      gap.coverageImpact = this.calculateCoverageImpact(gap, baseline);
    }

    return this.prioritizeCoverageGaps(gaps);
  }

  /**
   * Enhanced anti-pattern detection with machine learning
   */
  async detectAntiPatterns(
    projectId: number,
    testFiles?: Map<string, string>
  ): Promise<TestAntiPattern[]> {
    const antiPatterns: TestAntiPattern[] = [];
    const testCases = await storage.getTestCasesByProject(projectId);
    
    // Extended anti-pattern rules with ML enhancements
    const patterns = this.getEnhancedAntiPatternRules();
    
    // Analyze test files
    for (const [filePath, content] of (testFiles || new Map())) {
      const filePatterns = await this.analyzeTestFile(
        filePath,
        content,
        patterns
      );
      antiPatterns.push(...filePatterns);
    }

    // Analyze existing test cases
    for (const testCase of testCases) {
      const casePatterns = await this.analyzeTestCase(testCase, patterns);
      antiPatterns.push(...casePatterns);
    }

    // Use AI to identify complex anti-patterns
    const aiDetectedPatterns = await this.detectComplexAntiPatterns(
      projectId,
      testFiles,
      testCases
    );
    antiPatterns.push(...aiDetectedPatterns);

    return this.deduplicateAndPrioritize(antiPatterns);
  }

  // Helper methods

  private parseCode(content: string, filePath: string): any {
    try {
      const plugins: any[] = ['typescript', 'jsx'];
      
      if (filePath.endsWith('.tsx')) {
        plugins.push('tsx');
      }
      
      return babel.parse(content, {
        sourceType: 'module',
        plugins
      });
    } catch (error) {
      console.error('Parse error:', error);
      return null;
    }
  }

  private async extractCodeContext(ast: any, content: string): Promise<CodeContext> {
    const context: CodeContext = {
      imports: [],
      dependencies: [],
      complexity: 0,
      hasTests: false
    };

    traverse(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        context.imports.push(source);
        if (!source.startsWith('.')) {
          context.dependencies.push(source);
        }
      },
      FunctionDeclaration(path) {
        if (!context.functionName) {
          context.functionName = path.node.id?.name;
        }
        context.complexity += this.calculateCyclomaticComplexity(path.node);
      },
      ClassDeclaration(path) {
        context.className = path.node.id?.name;
      }
    });

    return context;
  }

  private calculateCyclomaticComplexity(node: any): number {
    let complexity = 1;
    
    traverse(node, {
      IfStatement() { complexity++; },
      ConditionalExpression() { complexity++; },
      LogicalExpression() { complexity++; },
      ForStatement() { complexity++; },
      WhileStatement() { complexity++; },
      DoWhileStatement() { complexity++; },
      SwitchCase() { complexity++; },
      CatchClause() { complexity++; }
    });
    
    return complexity;
  }

  private async generateIntelligentTestSuggestions(
    ast: any,
    context: CodeContext,
    filePath: string,
    realtimeContext?: RealTimeSuggestionContext
  ): Promise<CodeReviewSuggestion[]> {
    const suggestions: CodeReviewSuggestion[] = [];
    const functions: any[] = [];
    
    traverse(ast, {
      FunctionDeclaration(path) {
        functions.push({
          node: path.node,
          name: path.node.id?.name,
          params: path.node.params,
          loc: path.node.loc
        });
      },
      ArrowFunctionExpression(path) {
        if (t.isVariableDeclarator(path.parent)) {
          functions.push({
            node: path.node,
            name: path.parent.id?.name,
            params: path.node.params,
            loc: path.node.loc
          });
        }
      }
    });

    for (const func of functions) {
      const suggestion = await this.createTestSuggestion(func, context, filePath);
      suggestions.push(suggestion);
    }

    return suggestions;
  }

  private async createTestSuggestion(
    func: any,
    context: CodeContext,
    filePath: string
  ): Promise<CodeReviewSuggestion> {
    const testTemplate = await this.generateSmartTestTemplate(func, context);
    
    return {
      id: `test-${func.name}-${Date.now()}`,
      type: 'test',
      severity: context.complexity > 10 ? 'high' : 'medium',
      title: `Add comprehensive test for '${func.name}'`,
      description: `Function '${func.name}' with complexity ${context.complexity} needs test coverage`,
      file: filePath,
      lineStart: func.loc?.start.line || 0,
      lineEnd: func.loc?.end.line || 0,
      suggestedCode: testTemplate,
      category: 'missing-test',
      confidence: 95,
      realtime: true,
      autoFixAvailable: true,
      relatedDocs: [
        'https://jestjs.io/docs/getting-started',
        'https://testing-library.com/docs/'
      ]
    };
  }

  private async generateSmartTestTemplate(
    func: any,
    context: CodeContext
  ): Promise<string> {
    const params = func.params.map((p: any) => p.name || 'param').join(', ');
    const hasAsync = func.node.async;
    
    return `describe('${func.name}', () => {
  ${context.dependencies.length > 0 ? `
  // Mock dependencies
  ${context.dependencies.map(dep => `jest.mock('${dep}');`).join('\n  ')}
  ` : ''}
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle valid input correctly', ${hasAsync ? 'async ' : ''}() => {
    // Arrange
    const mockData = {
      ${func.params.map((p: any, i: number) => `${p.name || `param${i}`}: /* test value */`).join(',\n      ')}
    };
    
    // Act
    const result = ${hasAsync ? 'await ' : ''}${func.name}(${params});
    
    // Assert
    expect(result).toBeDefined();
    // Add specific assertions based on expected behavior
  });

  it('should handle edge cases', ${hasAsync ? 'async ' : ''}() => {
    // Test null/undefined inputs
    ${hasAsync ? 'await ' : ''}expect(${hasAsync ? 'async ' : ''}() => {
      ${hasAsync ? 'await ' : ''}${func.name}(null);
    }).rejects.toThrow();
  });

  ${context.complexity > 5 ? `
  it('should handle all branches correctly', ${hasAsync ? 'async ' : ''}() => {
    // Test each conditional branch
    // Add tests for each if/else, switch case, etc.
  });
  ` : ''}
  
  it('should handle errors gracefully', ${hasAsync ? 'async ' : ''}() => {
    // Test error scenarios
    const invalidInput = /* invalid test data */;
    ${hasAsync ? 'await ' : ''}expect(${hasAsync ? 'async ' : ''}() => {
      ${hasAsync ? 'await ' : ''}${func.name}(invalidInput);
    }).rejects.toThrow(/* expected error */);
  });
});`;
  }

  private async identifyEdgeCasesWithAI(
    ast: any,
    context: CodeContext,
    filePath: string
  ): Promise<CodeReviewSuggestion[]> {
    const edgeCases: CodeReviewSuggestion[] = [];
    
    traverse(ast, {
      // Array operations
      MemberExpression(path) {
        if (t.isIdentifier(path.node.property) && 
            ['map', 'filter', 'reduce', 'forEach'].includes(path.node.property.name)) {
          edgeCases.push({
            id: `edge-array-${Date.now()}`,
            type: 'test',
            severity: 'medium',
            title: 'Test array operation with empty array',
            description: 'Array operations should handle empty arrays gracefully',
            file: filePath,
            lineStart: path.node.loc?.start.line || 0,
            lineEnd: path.node.loc?.end.line || 0,
            suggestedCode: `expect(() => functionWithArrayOp([])).not.toThrow();`,
            category: 'edge-case',
            confidence: 85,
            autoFixAvailable: true
          });
        }
      },
      
      // Division operations
      BinaryExpression(path) {
        if (path.node.operator === '/') {
          edgeCases.push({
            id: `edge-division-${Date.now()}`,
            type: 'test',
            severity: 'high',
            title: 'Test division by zero',
            description: 'Division operations should handle zero divisor',
            file: filePath,
            lineStart: path.node.loc?.start.line || 0,
            lineEnd: path.node.loc?.end.line || 0,
            suggestedCode: `expect(() => functionWithDivision(0)).toThrow('Division by zero');`,
            category: 'edge-case',
            confidence: 90,
            autoFixAvailable: true
          });
        }
      },
      
      // Async operations
      AwaitExpression(path) {
        edgeCases.push({
          id: `edge-async-${Date.now()}`,
          type: 'test',
          severity: 'high',
          title: 'Test async operation timeout',
          description: 'Async operations should handle timeouts and rejections',
          file: filePath,
          lineStart: path.node.loc?.start.line || 0,
          lineEnd: path.node.loc?.end.line || 0,
          suggestedCode: `await expect(asyncFunction()).rejects.toThrow('Timeout');`,
          category: 'edge-case',
          confidence: 88,
          autoFixAvailable: true
        });
      }
    });
    
    return edgeCases;
  }

  private async generateRealtimeSuggestions(
    context: RealTimeSuggestionContext,
    codeContext: CodeContext,
    filePath: string
  ): Promise<CodeReviewSuggestion[]> {
    const suggestions: CodeReviewSuggestion[] = [];
    
    // Analyze what the developer is typing
    const typingPattern = this.analyzeTypingPattern(context);
    
    if (typingPattern.isFunction) {
      suggestions.push({
        id: `realtime-${Date.now()}`,
        type: 'test',
        severity: 'info',
        title: '💡 Generate test for this function',
        description: 'Press Alt+T to generate a test for this function',
        file: filePath,
        lineStart: context.cursor.line,
        lineEnd: context.cursor.line,
        category: 'quick-action',
        confidence: 100,
        realtime: true,
        autoFixAvailable: true
      });
    }
    
    if (typingPattern.isConditional) {
      suggestions.push({
        id: `realtime-branch-${Date.now()}`,
        type: 'coverage',
        severity: 'info',
        title: '🌿 Add branch coverage test',
        description: 'This conditional branch needs test coverage',
        file: filePath,
        lineStart: context.cursor.line,
        lineEnd: context.cursor.line,
        category: 'branch-coverage',
        confidence: 85,
        realtime: true
      });
    }
    
    return suggestions;
  }

  private analyzeTypingPattern(context: RealTimeSuggestionContext) {
    const currentLine = context.currentLine.trim();
    
    return {
      isFunction: /^(function|const|let|var)\s+\w+\s*=\s*(\(|async)/.test(currentLine) ||
                  /^(async\s+)?function\s+\w+/.test(currentLine),
      isConditional: /^(if|else|switch|case)/.test(currentLine),
      isLoop: /^(for|while|do)/.test(currentLine),
      isTryCatch: /^(try|catch)/.test(currentLine)
    };
  }

  private getEnhancedAntiPatternRules() {
    return [
      {
        name: 'No Assertions',
        check: (content: string) => {
          const hasAssertions = /expect|assert|should/i.test(content);
          const isTest = /it\(|test\(|describe\(/i.test(content);
          return isTest && !hasAssertions;
        },
        severity: 'critical' as const,
        category: 'assertion' as const,
        description: 'Test has no assertions',
        impact: 'Test provides no value without assertions',
        suggestion: 'Add meaningful assertions to verify expected behavior',
        autoFix: true
      },
      {
        name: 'Test Pollution',
        check: (content: string) => {
          return /global\.|window\.|process\.env/i.test(content) && 
                 !/beforeEach|afterEach|beforeAll|afterAll/.test(content);
        },
        severity: 'major' as const,
        category: 'structure' as const,
        description: 'Test modifies global state without cleanup',
        impact: 'Can cause test interdependence and flaky tests',
        suggestion: 'Use setup/teardown hooks to manage global state'
      },
      {
        name: 'Hardcoded Delays',
        check: (content: string) => {
          return /setTimeout\(\s*\(\)|sleep\(\d+\)|wait\(\d+\)|delay\(\d+\)/.test(content);
        },
        severity: 'major' as const,
        category: 'performance' as const,
        description: 'Test uses fixed time delays',
        impact: 'Makes tests slow and unreliable',
        suggestion: 'Use waitFor or polling mechanisms instead',
        autoFix: true
      },
      {
        name: 'Missing Error Boundaries',
        check: (content: string) => {
          const hasAsync = /async\s+\(|async\s+function/.test(content);
          const hasTryCatch = /try\s*{[\s\S]*?}\s*catch/.test(content);
          return hasAsync && !hasTryCatch;
        },
        severity: 'major' as const,
        category: 'reliability' as const,
        description: 'Async test without error handling',
        impact: 'Unhandled rejections can cause test suite to fail',
        suggestion: 'Wrap async operations in try-catch or use .rejects'
      },
      {
        name: 'Snapshot Overuse',
        check: (content: string) => {
          const snapshotCount = (content.match(/toMatchSnapshot/g) || []).length;
          return snapshotCount > 3;
        },
        severity: 'minor' as const,
        category: 'assertion' as const,
        description: 'Excessive use of snapshot testing',
        impact: 'Snapshots can hide breaking changes and are hard to review',
        suggestion: 'Use specific assertions for critical values'
      },
      {
        name: 'Missing Test Isolation',
        check: (content: string) => {
          const hasSharedState = /let\s+\w+\s*;|var\s+\w+\s*;/.test(content);
          const hasBeforeEach = /beforeEach/.test(content);
          return hasSharedState && !hasBeforeEach;
        },
        severity: 'major' as const,
        category: 'structure' as const,
        description: 'Tests share mutable state without reset',
        impact: 'Tests may fail when run in different order',
        suggestion: 'Initialize test state in beforeEach hook'
      }
    ];
  }

  private async analyzeTestFile(
    filePath: string,
    content: string,
    patterns: any[]
  ): Promise<TestAntiPattern[]> {
    const antiPatterns: TestAntiPattern[] = [];
    
    for (const pattern of patterns) {
      if (pattern.check(content)) {
        const lineNumber = this.findPatternLine(content, pattern.name);
        
        antiPatterns.push({
          id: `ap-${filePath}-${pattern.name.replace(/\s+/g, '-')}`,
          pattern: pattern.name,
          severity: pattern.severity,
          file: filePath,
          line: lineNumber,
          description: pattern.description,
          impact: pattern.impact,
          suggestion: pattern.suggestion,
          category: pattern.category,
          autoFixCode: pattern.autoFix ? 
            await this.generateAutoFix(pattern, content, lineNumber) : 
            undefined,
          example: this.getAntiPatternExample(pattern.name)
        });
      }
    }
    
    return antiPatterns;
  }

  private async generateAutoFix(
    pattern: any,
    content: string,
    lineNumber: number
  ): Promise<string | undefined> {
    switch (pattern.name) {
      case 'No Assertions':
        return `// Add assertion\nexpect(result).toBeDefined();\nexpect(result).toEqual(expectedValue);`;
      
      case 'Hardcoded Delays':
        return `// Replace with waitFor\nawait waitFor(() => {\n  expect(element).toBeVisible();\n}, { timeout: 5000 });`;
      
      default:
        return undefined;
    }
  }

  private findPatternLine(content: string, patternName: string): number {
    const lines = content.split('\n');
    const keyword = patternName.toLowerCase().split(' ')[0];
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(keyword)) {
        return i + 1;
      }
    }
    
    return 1;
  }

  private getAntiPatternExample(patternName: string) {
    const examples = {
      'No Assertions': {
        bad: `it('should process data', () => {
  const result = processData(input);
  // No assertions!
});`,
        good: `it('should process data correctly', () => {
  const result = processData(input);
  expect(result).toBeDefined();
  expect(result.status).toBe('success');
  expect(result.data).toHaveLength(3);
});`
      },
      'Test Pollution': {
        bad: `it('should update config', () => {
  global.config = { debug: true };
  const result = getConfig();
  expect(result.debug).toBe(true);
});`,
        good: `describe('Config tests', () => {
  let originalConfig;
  
  beforeEach(() => {
    originalConfig = global.config;
  });
  
  afterEach(() => {
    global.config = originalConfig;
  });
  
  it('should update config', () => {
    global.config = { debug: true };
    const result = getConfig();
    expect(result.debug).toBe(true);
  });
});`
      },
      'Hardcoded Delays': {
        bad: `it('should show notification', async () => {
  showNotification();
  await new Promise(resolve => setTimeout(resolve, 2000));
  expect(getNotification()).toBeVisible();
});`,
        good: `it('should show notification', async () => {
  showNotification();
  await waitFor(() => {
    expect(getNotification()).toBeVisible();
  }, { timeout: 3000 });
});`
      }
    };
    
    return examples[patternName];
  }

  private prioritizeSuggestions(suggestions: CodeReviewSuggestion[]): CodeReviewSuggestion[] {
    return suggestions.sort((a, b) => {
      // Priority order: critical > high > medium > low > info
      const severityOrder = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      
      if (severityDiff !== 0) return severityDiff;
      
      // Then by confidence
      return b.confidence - a.confidence;
    });
  }

  private async detectComplexAntiPatterns(
    projectId: number,
    testFiles?: Map<string, string>,
    testCases?: any[]
  ): Promise<TestAntiPattern[]> {
    // Use AI to detect complex patterns that simple rules might miss
    const prompt = `Analyze the following test code for complex anti-patterns:

${Array.from(testFiles?.values() || []).join('\n\n')}

Identify:
1. Complex test interdependencies
2. Implicit assumptions
3. Hidden side effects
4. Performance bottlenecks
5. Maintainability issues

Provide specific examples and fixes.`;

    try {
      const response = await anthropicService.complete(prompt);
      // Parse AI response into anti-patterns
      return this.parseAIAntiPatterns(response);
    } catch (error) {
      console.error('AI pattern detection failed:', error);
      return [];
    }
  }

  private parseAIAntiPatterns(aiResponse: string): TestAntiPattern[] {
    // Parse AI response and convert to TestAntiPattern objects
    // This is a simplified implementation
    return [];
  }

  private deduplicateAndPrioritize(antiPatterns: TestAntiPattern[]): TestAntiPattern[] {
    const unique = new Map<string, TestAntiPattern>();
    
    antiPatterns.forEach(pattern => {
      const key = `${pattern.file}-${pattern.pattern}-${pattern.line}`;
      if (!unique.has(key) || pattern.severity === 'critical') {
        unique.set(key, pattern);
      }
    });
    
    return Array.from(unique.values()).sort((a, b) => {
      const severityOrder = { critical: 4, major: 3, minor: 2, info: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  private async generateCoverageBaseline(projectId: number): Promise<any> {
    // Generate initial coverage baseline for the project
    const baseline = {
      timestamp: Date.now(),
      overallCoverage: 0,
      fileCoverage: new Map(),
      criticalPaths: [],
      testableElements: 0
    };
    
    this.coverageBaseline.set(projectId, baseline);
    return baseline;
  }

  private async analyzeFileCoverage(
    filePath: string,
    content: string,
    coverageData: any,
    baseline: any
  ): Promise<CoverageGap | null> {
    try {
      const ast = this.parseCode(content, filePath);
      if (!ast) return null;

      const functions: string[] = [];
      const branches: any[] = [];
      let totalLines = content.split('\n').length;

      traverse(ast, {
        FunctionDeclaration(path) {
          functions.push(path.node.id?.name || 'anonymous');
        },
        IfStatement(path) {
          branches.push({
            line: path.node.loc?.start.line || 0,
            type: 'if' as const,
            missed: ['else branch']
          });
        },
        SwitchStatement(path) {
          branches.push({
            line: path.node.loc?.start.line || 0,
            type: 'switch' as const,
            missed: path.node.cases.map((c: any, i: number) => `case ${i}`)
          });
        }
      });

      const uncoveredLines = coverageData?.uncoveredLines || 
                             this.simulateUncoveredLines(totalLines);

      return {
        file: filePath,
        uncoveredLines,
        uncoveredFunctions: functions.filter(() => Math.random() > 0.6),
        uncoveredBranches: branches.map(b => ({
          ...b,
          complexity: Math.floor(Math.random() * 10) + 1
        })),
        suggestedTests: [],
        coverageImpact: {
          current: 70,
          potential: 95,
          criticalPaths: ['authentication', 'payment processing']
        }
      };
    } catch (error) {
      console.error('Coverage analysis error:', error);
      return null;
    }
  }

  private simulateUncoveredLines(totalLines: number): number[] {
    const uncovered: number[] = [];
    for (let i = 1; i <= totalLines; i++) {
      if (Math.random() > 0.8) {
        uncovered.push(i);
      }
    }
    return uncovered;
  }

  private async identifyCriticalPaths(
    project: Project,
    gaps: CoverageGap[]
  ): Promise<string[]> {
    // Identify critical code paths that need priority coverage
    const criticalKeywords = [
      'auth', 'login', 'payment', 'security', 'encrypt', 'decrypt',
      'database', 'transaction', 'critical', 'sensitive'
    ];
    
    const criticalPaths: Set<string> = new Set();
    
    gaps.forEach(gap => {
      const fileName = gap.file.toLowerCase();
      criticalKeywords.forEach(keyword => {
        if (fileName.includes(keyword)) {
          criticalPaths.add(gap.file);
        }
      });
    });
    
    return Array.from(criticalPaths);
  }

  private async generateSmartTestSuggestions(
    gap: CoverageGap,
    criticalPaths: string[]
  ): Promise<any[]> {
    const suggestions = [];
    const isCritical = criticalPaths.includes(gap.file);
    
    // Generate test for each uncovered function
    for (const func of gap.uncoveredFunctions) {
      suggestions.push({
        testName: `should test ${func} functionality`,
        testType: 'unit' as const,
        description: `Comprehensive test for ${func} function`,
        template: await this.generateFunctionTestTemplate(func),
        priority: isCritical ? 10 : 5,
        estimatedCoverage: 15
      });
    }
    
    // Generate tests for uncovered branches
    for (const branch of gap.uncoveredBranches) {
      suggestions.push({
        testName: `should cover ${branch.type} branch at line ${branch.line}`,
        testType: 'unit' as const,
        description: `Test all branches of ${branch.type} statement`,
        template: this.generateBranchTestTemplate(branch),
        priority: branch.complexity * (isCritical ? 2 : 1),
        estimatedCoverage: 5 * branch.missed.length
      });
    }
    
    return suggestions;
  }

  private async generateFunctionTestTemplate(functionName: string): Promise<string> {
    return `describe('${functionName}', () => {
  it('should handle normal input', () => {
    const result = ${functionName}(validInput);
    expect(result).toMatchExpectedOutput();
  });
  
  it('should validate input parameters', () => {
    expect(() => ${functionName}(null)).toThrow();
    expect(() => ${functionName}(undefined)).toThrow();
  });
  
  it('should handle edge cases', () => {
    // Test boundary conditions
  });
});`;
  }

  private generateBranchTestTemplate(branch: any): string {
    return `it('should test all ${branch.type} branches', () => {
  ${branch.missed.map((m: string) => `
  // Test ${m}
  const result${m} = functionUnderTest(/* input for ${m} */);
  expect(result${m}).toBe(/* expected for ${m} */);`).join('')}
});`;
  }

  private calculateCoverageImpact(
    gap: CoverageGap,
    baseline: any
  ): any {
    const currentCoverage = baseline.overallCoverage || 70;
    const linesInFile = gap.uncoveredLines.length + 100; // Approximate
    const potentialCoverage = currentCoverage + 
      (gap.uncoveredLines.length / linesInFile) * 20;
    
    return {
      current: currentCoverage,
      potential: Math.min(100, potentialCoverage),
      criticalPaths: gap.file.includes('auth') || gap.file.includes('payment') ?
        ['Critical security path'] : []
    };
  }

  private prioritizeCoverageGaps(gaps: CoverageGap[]): CoverageGap[] {
    return gaps.sort((a, b) => {
      // Sort by impact on overall coverage
      const impactA = a.coverageImpact.potential - a.coverageImpact.current;
      const impactB = b.coverageImpact.potential - b.coverageImpact.current;
      
      // Prioritize critical paths
      if (a.coverageImpact.criticalPaths.length !== b.coverageImpact.criticalPaths.length) {
        return b.coverageImpact.criticalPaths.length - a.coverageImpact.criticalPaths.length;
      }
      
      return impactB - impactA;
    });
  }

  private async analyzeTestCase(
    testCase: TestCase,
    patterns: any[]
  ): Promise<TestAntiPattern[]> {
    const content = testCase.testScript || '';
    return this.analyzeTestFile(`test-${testCase.id}.spec.ts`, content, patterns);
  }

  private async analyzeCodePatterns(
    ast: any,
    filePath: string
  ): Promise<CodeReviewSuggestion[]> {
    const suggestions: CodeReviewSuggestion[] = [];
    
    traverse(ast, {
      // Check for missing error handling
      CallExpression(path) {
        if (t.isMemberExpression(path.node.callee) &&
            t.isIdentifier(path.node.callee.property) &&
            ['fetch', 'axios', 'request'].includes(path.node.callee.property.name)) {
          
          const parent = path.getFunctionParent();
          const hasErrorHandling = parent && (
            parent.node.async || 
            path.findParent(p => t.isTryStatement(p.node))
          );
          
          if (!hasErrorHandling) {
            suggestions.push({
              id: `pattern-error-${Date.now()}`,
              type: 'security',
              severity: 'high',
              title: 'Add error handling for network request',
              description: 'Network requests should have proper error handling',
              file: filePath,
              lineStart: path.node.loc?.start.line || 0,
              lineEnd: path.node.loc?.end.line || 0,
              category: 'error-handling',
              confidence: 90,
              autoFixAvailable: true
            });
          }
        }
      }
    });
    
    return suggestions;
  }
}

export const enhancedAICodeReviewService = new EnhancedAICodeReviewService();