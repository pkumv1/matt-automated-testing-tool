import { storage } from "../storage";
import { anthropicService } from "./anthropic";
import type { Project, TestCase } from "@shared/schema";

interface CodeReviewSuggestion {
  id: string;
  type: 'test' | 'coverage' | 'antipattern';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  file: string;
  lineStart: number;
  lineEnd: number;
  suggestedCode?: string;
  category: string;
  confidence: number;
}

interface CoverageGap {
  file: string;
  uncoveredLines: number[];
  uncoveredFunctions: string[];
  uncoveredBranches: {
    line: number;
    type: 'if' | 'switch' | 'ternary' | 'logical';
    missed: string[];
  }[];
  suggestedTests: {
    testName: string;
    testType: 'unit' | 'integration';
    description: string;
    template: string;
  }[];
}

interface TestAntiPattern {
  id: string;
  pattern: string;
  severity: 'critical' | 'major' | 'minor';
  file: string;
  line: number;
  description: string;
  impact: string;
  suggestion: string;
  example?: {
    bad: string;
    good: string;
  };
}

interface CodeAnalysisResult {
  suggestions: CodeReviewSuggestion[];
  coverageGaps: CoverageGap[];
  antiPatterns: TestAntiPattern[];
  metrics: {
    currentCoverage: number;
    potentialCoverage: number;
    testQualityScore: number;
    maintainabilityIndex: number;
  };
}

export class AICodeReviewService {
  
  /**
   * Analyze code and provide real-time test suggestions
   */
  async analyzeCodeForTestSuggestions(
    projectId: number,
    fileContent: string,
    filePath: string,
    cursorPosition?: { line: number; column: number }
  ): Promise<CodeReviewSuggestion[]> {
    const suggestions: CodeReviewSuggestion[] = [];
    
    // Parse code to identify functions, classes, and components
    const codeStructure = this.parseCodeStructure(fileContent, filePath);
    
    // Generate test suggestions for each identified element
    for (const element of codeStructure.elements) {
      if (!element.hasTests) {
        const suggestion = await this.generateTestSuggestion(element, filePath);
        suggestions.push(suggestion);
      }
    }
    
    // Check for edge cases that might need testing
    const edgeCases = this.identifyEdgeCases(fileContent);
    for (const edgeCase of edgeCases) {
      suggestions.push({
        id: `edge-${Date.now()}-${Math.random()}`,
        type: 'test',
        severity: 'medium',
        title: `Test edge case: ${edgeCase.description}`,
        description: `Consider adding a test for this edge case to ensure robust error handling`,
        file: filePath,
        lineStart: edgeCase.line,
        lineEnd: edgeCase.line,
        suggestedCode: edgeCase.testTemplate,
        category: 'edge-case',
        confidence: 85
      });
    }
    
    // Context-aware suggestions based on cursor position
    if (cursorPosition) {
      const contextSuggestions = await this.getContextAwareSuggestions(
        fileContent,
        cursorPosition,
        filePath
      );
      suggestions.push(...contextSuggestions);
    }
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Detect coverage gaps and suggest specific tests
   */
  async detectCoverageGaps(
    projectId: number,
    coverageData?: any
  ): Promise<CoverageGap[]> {
    const gaps: CoverageGap[] = [];
    const project = await storage.getProject(projectId);
    
    if (!project) return gaps;
    
    // Simulate coverage analysis (in production, integrate with actual coverage tools)
    const mockFiles = [
      'src/auth/login.service.ts',
      'src/api/user.controller.ts',
      'src/utils/validation.ts'
    ];
    
    for (const file of mockFiles) {
      const gap: CoverageGap = {
        file,
        uncoveredLines: this.generateUncoveredLines(),
        uncoveredFunctions: this.identifyUncoveredFunctions(file),
        uncoveredBranches: this.identifyUncoveredBranches(file),
        suggestedTests: []
      };
      
      // Generate test suggestions for each gap
      gap.suggestedTests = await this.generateTestsForGap(gap);
      gaps.push(gap);
    }
    
    return gaps;
  }

  /**
   * Identify testing anti-patterns and suggest improvements
   */
  async detectAntiPatterns(
    projectId: number,
    testFiles?: string[]
  ): Promise<TestAntiPattern[]> {
    const antiPatterns: TestAntiPattern[] = [];
    const testCases = await storage.getTestCasesByProject(projectId);
    
    // Common anti-patterns to check for
    const patterns = [
      {
        name: 'No Assertions',
        check: (content: string) => !content.includes('expect') && !content.includes('assert'),
        severity: 'critical' as const,
        description: 'Test has no assertions',
        impact: 'Test provides no value without assertions',
        suggestion: 'Add meaningful assertions to verify expected behavior'
      },
      {
        name: 'Too Many Assertions',
        check: (content: string) => {
          const assertionCount = (content.match(/expect|assert/g) || []).length;
          return assertionCount > 10;
        },
        severity: 'major' as const,
        description: 'Test has too many assertions',
        impact: 'Makes test fragile and hard to maintain',
        suggestion: 'Split into multiple focused tests with single responsibility'
      },
      {
        name: 'Hard-coded Values',
        check: (content: string) => /expect\([^)]*\)\.toBe\(['"][\d\w]{10,}['"]\)/.test(content),
        severity: 'minor' as const,
        description: 'Test uses hard-coded values',
        impact: 'Makes tests brittle and hard to maintain',
        suggestion: 'Use constants or test data factories'
      },
      {
        name: 'No Test Description',
        check: (content: string) => /it\(['"]test['"]/i.test(content) || /it\(['"]['"]/.test(content),
        severity: 'major' as const,
        description: 'Test has generic or no description',
        impact: 'Makes test purpose unclear',
        suggestion: 'Use descriptive test names that explain what is being tested'
      },
      {
        name: 'Sleep/Delay in Tests',
        check: (content: string) => /setTimeout|sleep|delay|wait\(\d+\)/.test(content),
        severity: 'major' as const,
        description: 'Test uses fixed delays',
        impact: 'Makes tests slow and flaky',
        suggestion: 'Use proper async handling or wait for specific conditions'
      },
      {
        name: 'Test Interdependence',
        check: (content: string) => /beforeAll|afterAll/.test(content) && /shared|global/.test(content),
        severity: 'critical' as const,
        description: 'Tests depend on shared state',
        impact: 'Tests cannot run in isolation',
        suggestion: 'Make each test independent with its own setup and teardown'
      }
    ];
    
    // Check each test case for anti-patterns
    for (const testCase of testCases) {
      const content = testCase.testScript || '';
      
      for (const pattern of patterns) {
        if (pattern.check(content)) {
          antiPatterns.push({
            id: `ap-${testCase.id}-${pattern.name.replace(/\s+/g, '-')}`,
            pattern: pattern.name,
            severity: pattern.severity,
            file: `test-${testCase.id}.spec.ts`,
            line: this.findPatternLine(content, pattern.name),
            description: pattern.description,
            impact: pattern.impact,
            suggestion: pattern.suggestion,
            example: this.getAntiPatternExample(pattern.name)
          });
        }
      }
    }
    
    return antiPatterns;
  }

  /**
   * Get comprehensive code analysis with all features
   */
  async getComprehensiveAnalysis(projectId: number): Promise<CodeAnalysisResult> {
    const [suggestions, coverageGaps, antiPatterns] = await Promise.all([
      this.analyzeCodeForTestSuggestions(projectId, '', ''),
      this.detectCoverageGaps(projectId),
      this.detectAntiPatterns(projectId)
    ]);
    
    // Calculate metrics
    const currentCoverage = this.calculateCurrentCoverage(coverageGaps);
    const potentialCoverage = this.calculatePotentialCoverage(coverageGaps);
    const testQualityScore = this.calculateTestQualityScore(antiPatterns);
    const maintainabilityIndex = this.calculateMaintainabilityIndex(
      suggestions,
      antiPatterns
    );
    
    return {
      suggestions,
      coverageGaps,
      antiPatterns,
      metrics: {
        currentCoverage,
        potentialCoverage,
        testQualityScore,
        maintainabilityIndex
      }
    };
  }

  // Helper methods
  private parseCodeStructure(content: string, filePath: string) {
    const elements = [];
    const lines = content.split('\n');
    
    // Simple parser for functions and classes
    lines.forEach((line, index) => {
      if (line.includes('function') || line.includes('const') || line.includes('class')) {
        const match = line.match(/(function|const|class)\s+(\w+)/);
        if (match) {
          elements.push({
            type: match[1],
            name: match[2],
            line: index + 1,
            hasTests: false // Would check actual test files
          });
        }
      }
    });
    
    return { elements };
  }

  private async generateTestSuggestion(element: any, filePath: string): Promise<CodeReviewSuggestion> {
    const testTemplate = element.type === 'class' 
      ? this.generateClassTestTemplate(element.name)
      : this.generateFunctionTestTemplate(element.name);
    
    return {
      id: `test-${element.name}-${Date.now()}`,
      type: 'test',
      severity: 'high',
      title: `Add test for ${element.type} '${element.name}'`,
      description: `The ${element.type} '${element.name}' lacks test coverage. Adding tests will improve reliability.`,
      file: filePath,
      lineStart: element.line,
      lineEnd: element.line,
      suggestedCode: testTemplate,
      category: 'missing-test',
      confidence: 95
    };
  }

  private generateFunctionTestTemplate(functionName: string): string {
    return `describe('${functionName}', () => {
  it('should handle valid input correctly', () => {
    // Arrange
    const input = /* prepare test data */;
    
    // Act
    const result = ${functionName}(input);
    
    // Assert
    expect(result).toBe(/* expected value */);
  });

  it('should handle edge cases', () => {
    // Test null/undefined inputs
    expect(() => ${functionName}(null)).toThrow();
  });

  it('should handle invalid input gracefully', () => {
    // Test with invalid data
    const invalidInput = /* invalid test data */;
    expect(() => ${functionName}(invalidInput)).toThrow(/* expected error */);
  });
});`;
  }

  private generateClassTestTemplate(className: string): string {
    return `describe('${className}', () => {
  let instance: ${className};

  beforeEach(() => {
    instance = new ${className}();
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(instance).toBeDefined();
      expect(instance).toBeInstanceOf(${className});
    });
  });

  describe('methods', () => {
    // Add tests for each public method
  });
});`;
  }

  private identifyEdgeCases(content: string) {
    const edgeCases = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for array access without bounds checking
      if (line.includes('[') && line.includes(']') && !line.includes('length')) {
        edgeCases.push({
          line: index + 1,
          description: 'Array access without bounds checking',
          testTemplate: 'expect(() => functionWithArrayAccess([])).not.toThrow();'
        });
      }
      
      // Check for division operations
      if (line.includes('/') && !line.includes('if')) {
        edgeCases.push({
          line: index + 1,
          description: 'Division by zero possibility',
          testTemplate: 'expect(() => functionWithDivision(0)).toThrow();'
        });
      }
    });
    
    return edgeCases;
  }

  private async getContextAwareSuggestions(
    content: string,
    position: { line: number; column: number },
    filePath: string
  ): Promise<CodeReviewSuggestion[]> {
    const suggestions = [];
    const lines = content.split('\n');
    const currentLine = lines[position.line - 1] || '';
    
    // If typing a function, suggest immediate test
    if (currentLine.includes('function') || currentLine.includes('=>')) {
      suggestions.push({
        id: `context-${Date.now()}`,
        type: 'test',
        severity: 'low',
        title: 'Create test for this function',
        description: 'Press Ctrl+Shift+T to generate a test for this function',
        file: filePath,
        lineStart: position.line,
        lineEnd: position.line,
        category: 'quick-action',
        confidence: 70
      });
    }
    
    return suggestions;
  }

  private generateUncoveredLines(): number[] {
    // Simulate uncovered lines
    return Array.from({ length: 5 }, () => Math.floor(Math.random() * 100) + 1);
  }

  private identifyUncoveredFunctions(file: string): string[] {
    // Simulate uncovered functions
    return ['validateInput', 'processData', 'handleError'];
  }

  private identifyUncoveredBranches(file: string) {
    return [
      {
        line: 45,
        type: 'if' as const,
        missed: ['false branch']
      },
      {
        line: 78,
        type: 'switch' as const,
        missed: ['case "error"', 'default']
      }
    ];
  }

  private async generateTestsForGap(gap: CoverageGap) {
    const tests = [];
    
    // Generate tests for uncovered functions
    for (const func of gap.uncoveredFunctions) {
      tests.push({
        testName: `should test ${func}`,
        testType: 'unit' as const,
        description: `Test the ${func} function with various inputs`,
        template: this.generateFunctionTestTemplate(func)
      });
    }
    
    // Generate tests for uncovered branches
    for (const branch of gap.uncoveredBranches) {
      tests.push({
        testName: `should cover ${branch.type} branch at line ${branch.line}`,
        testType: 'unit' as const,
        description: `Test the ${branch.missed.join(', ')} conditions`,
        template: `it('should handle ${branch.missed.join(' and ')}', () => {
  // Test implementation
});`
      });
    }
    
    return tests;
  }

  private findPatternLine(content: string, patternName: string): number {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(patternName.toLowerCase().split(' ')[0])) {
        return i + 1;
      }
    }
    return 1;
  }

  private getAntiPatternExample(patternName: string) {
    const examples = {
      'No Assertions': {
        bad: `it('should do something', () => {
  const result = myFunction();
  // No assertions!
});`,
        good: `it('should return expected value', () => {
  const result = myFunction();
  expect(result).toBe('expected');
});`
      },
      'Too Many Assertions': {
        bad: `it('should validate user', () => {
  expect(user.name).toBe('John');
  expect(user.age).toBe(30);
  expect(user.email).toBe('john@example.com');
  // ... 10 more assertions
});`,
        good: `describe('User validation', () => {
  it('should have correct name', () => {
    expect(user.name).toBe('John');
  });
  
  it('should have valid email', () => {
    expect(user.email).toMatch(/^[^@]+@[^@]+$/);
  });
});`
      }
    };
    
    return examples[patternName];
  }

  private calculateCurrentCoverage(gaps: CoverageGap[]): number {
    // Simulate current coverage calculation
    const totalLines = 1000;
    const uncoveredLines = gaps.reduce((sum, gap) => sum + gap.uncoveredLines.length, 0);
    return Math.round(((totalLines - uncoveredLines) / totalLines) * 100);
  }

  private calculatePotentialCoverage(gaps: CoverageGap[]): number {
    // Calculate potential coverage if all suggestions are implemented
    const currentCoverage = this.calculateCurrentCoverage(gaps);
    const improvementPotential = gaps.reduce((sum, gap) => 
      sum + gap.suggestedTests.length * 2, 0
    );
    return Math.min(100, currentCoverage + improvementPotential);
  }

  private calculateTestQualityScore(antiPatterns: TestAntiPattern[]): number {
    // Base score of 100, reduce for each anti-pattern
    let score = 100;
    
    antiPatterns.forEach(pattern => {
      switch (pattern.severity) {
        case 'critical':
          score -= 15;
          break;
        case 'major':
          score -= 10;
          break;
        case 'minor':
          score -= 5;
          break;
      }
    });
    
    return Math.max(0, score);
  }

  private calculateMaintainabilityIndex(
    suggestions: CodeReviewSuggestion[],
    antiPatterns: TestAntiPattern[]
  ): number {
    // Calculate based on code complexity and test quality
    const complexityScore = 100 - (suggestions.length * 2);
    const qualityScore = this.calculateTestQualityScore(antiPatterns);
    
    return Math.round((complexityScore + qualityScore) / 2);
  }
}

export const aiCodeReviewService = new AICodeReviewService();
