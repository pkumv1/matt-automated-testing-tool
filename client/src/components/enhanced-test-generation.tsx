import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, Zap, Globe, Smartphone, Database, TestTube, 
  Bug, CheckCircle, Clock, AlertTriangle, Eye, Target,
  Users, Languages, Accessibility, Activity, Loader2,
  Download, Copy, ExternalLink, FileCode
} from "lucide-react";
import type { Project, TestCase } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface EnhancedTestGenerationProps {
  project: Project;
}

export default function EnhancedTestGeneration({ project }: EnhancedTestGenerationProps) {
  const [selectedTestTypes, setSelectedTestTypes] = useState<string[]>([]);
  const [actualTestCount, setActualTestCount] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: testCases = [], refetch: refetchTestCases } = useQuery({
    queryKey: [`/api/projects/${project.id}/test-cases`],
  });

  // Calculate estimated test count based on selected categories
  const calculateEstimatedTests = () => {
    let total = 0;
    selectedTestTypes.forEach(type => {
      // Each category has different number of test cases
      switch(type) {
        case 'security':
          total += 9; // 3 types x 3 tests each
          break;
        case 'functional':
          total += 9; // 3 types x 3 tests each
          break;
        case 'nonFunctional':
          total += 9; // 3 types x 3 tests each
          break;
        case 'specialized':
          total += 12; // 4 types x 3 tests each
          break;
        default:
          total += 6; // default estimate
      }
    });
    return total;
  };

  const downloadTestCases = () => {
    const testCaseContent = testCases.map(tc => {
      return `
# Test Case: ${tc.name}
**Type:** ${tc.type}
**Priority:** ${tc.priority}
**Status:** ${tc.status}
**Description:** ${tc.description || 'No description provided'}

## Test Script
\`\`\`${tc.framework || 'javascript'}
${tc.script || 'No script available'}
\`\`\`

## Expected Outcome
${tc.expectedOutcome || 'No expected outcome defined'}

---
`;
    }).join('\n');

    const blob = new Blob([testCaseContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}-test-cases.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadTestCase = (testCase: TestCase) => {
    const content = `
# Test Case: ${testCase.name}
**Type:** ${testCase.type}
**Priority:** ${testCase.priority}
**Status:** ${testCase.status}
**Description:** ${testCase.description || 'No description provided'}

## Test Script
\`\`\`${testCase.framework || 'javascript'}
${testCase.script || 'No script available'}
\`\`\`

## Expected Outcome
${testCase.expectedOutcome || 'No expected outcome defined'}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${testCase.name.replace(/\s+/g, '-')}-test-case.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyTestCase = (testCase: TestCase) => {
    const content = `Test Case: ${testCase.name}
Type: ${testCase.type}
Priority: ${testCase.priority}
Status: ${testCase.status}
Description: ${testCase.description || 'No description provided'}

Test Script:
${testCase.script || 'No script available'}

Expected Outcome:
${testCase.expectedOutcome || 'No expected outcome defined'}`;

    navigator.clipboard.writeText(content);
    toast({
      title: "Test case copied",
      description: "Test case details copied to clipboard",
    });
  };

  const generateEnhancedTestSuiteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${project.id}/generate-enhanced-tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          testCategories: selectedTestTypes,
          framework: 'comprehensive',
          includeSpecialized: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate enhanced test suite: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const generatedCount = data.testCases?.length || 0;
      setActualTestCount(generatedCount);
      
      toast({
        title: "Enhanced Test Suite Generated",
        description: `Generated ${generatedCount} comprehensive test cases across ${selectedTestTypes.length} categories.`,
      });
      
      // Force refetch test cases
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}/test-cases`] });
      refetchTestCases();
    },
    onError: (error) => {
      console.error('Test generation error:', error);
      toast({
        title: "Test Generation Failed",
        description: error.message || "Failed to generate enhanced test suite. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update actual test count when test cases change
  useEffect(() => {
    setActualTestCount(testCases.length);
  }, [testCases]);

  const testCategories = {
    security: {
      icon: Shield,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      title: 'Security Testing',
      description: 'Comprehensive security validation',
      types: [
        {
          name: 'Vulnerability Testing',
          description: 'Automated vulnerability scanning with OWASP ZAP, Nessus, and OpenVAS',
          frameworks: ['OWASP ZAP', 'Nessus', 'OpenVAS', 'Nikto'],
          coverage: ['OWASP Top 10', 'CVE Database', 'Security Misconfigurations']
        },
        {
          name: 'Penetration Testing',
          description: 'Ethical hacking and security assessment',
          frameworks: ['Burp Suite', 'Metasploit', 'Wireshark'],
          coverage: ['Business Logic Flaws', 'Access Control', 'Data Exposure']
        },
        {
          name: 'Authentication Security',
          description: 'Session management and authentication validation',
          frameworks: ['OWASP ZAP', 'Custom Scripts'],
          coverage: ['Session Hijacking', 'Brute Force', 'Token Security']
        }
      ]
    },
    functional: {
      icon: TestTube,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      title: 'Functional Testing',
      description: 'Core business logic validation',
      types: [
        {
          name: 'Smoke Testing',
          description: 'Critical path validation after deployment',
          frameworks: ['Cypress', 'Playwright'],
          coverage: ['Critical Paths', 'Core Features', 'System Health']
        },
        {
          name: 'Sanity Testing',
          description: 'Quick validation after minor changes',
          frameworks: ['Jest', 'Testing Library'],
          coverage: ['Feature Updates', 'Bug Fixes', 'Minor Changes']
        },
        {
          name: 'Regression Testing',
          description: 'Comprehensive testing to prevent feature regression',
          frameworks: ['Playwright', 'Selenium', 'TestCafe'],
          coverage: ['Full Application', 'User Workflows', 'Integration Points']
        }
      ]
    },
    nonFunctional: {
      icon: Zap,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      title: 'Non-Functional Testing',
      description: 'Performance and usability validation',
      types: [
        {
          name: 'Usability Testing',
          description: 'User experience and interface validation',
          frameworks: ['Hotjar', 'UserTesting', 'Lighthouse'],
          coverage: ['User Experience', 'Interface Design', 'User Flows']
        },
        {
          name: 'Compatibility Testing',
          description: 'Cross-platform and environment testing',
          frameworks: ['BrowserStack', 'Selenium Grid'],
          coverage: ['Cross-Browser', 'Operating Systems', 'Device Types']
        },
        {
          name: 'Localization Testing',
          description: 'Multi-language and cultural validation',
          frameworks: ['i18n Framework', 'Globalize'],
          coverage: ['Languages', 'Currencies', 'Time Zones', 'Cultural Context']
        }
      ]
    },
    specialized: {
      icon: Target,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      title: 'Specialized Testing',
      description: 'Domain-specific testing approaches',
      types: [
        {
          name: 'API Testing',
          description: 'RESTful and GraphQL API validation',
          frameworks: ['Postman', 'REST Assured', 'Newman'],
          coverage: ['Contract Testing', 'Data Validation', 'Error Handling']
        },
        {
          name: 'Database Testing',
          description: 'Data integrity and performance validation',
          frameworks: ['DbUnit', 'JMeter', 'TestContainers'],
          coverage: ['Data Integrity', 'Query Performance', 'Transaction Consistency']
        },
        {
          name: 'Mobile Testing',
          description: 'Mobile application and responsive design testing',
          frameworks: ['Appium', 'Detox', 'Espresso', 'XCUITest'],
          coverage: ['Native Apps', 'Hybrid Apps', 'Responsive Design']
        },
        {
          name: 'Cross-Browser Testing',
          description: 'Browser compatibility and rendering validation',
          frameworks: ['Selenium Grid', 'TestCafe', 'BrowserStack'],
          coverage: ['Browser Compatibility', 'CSS Rendering', 'JavaScript Support']
        }
      ]
    }
  };

  const mcpAgents = [
    { name: 'OWASP ZAP', type: 'Security', specialization: 'Vulnerability Scanning', status: 'active' },
    { name: 'Burp Suite', type: 'Security', specialization: 'Penetration Testing', status: 'active' },
    { name: 'Nessus', type: 'Security', specialization: 'Vulnerability Assessment', status: 'active' },
    { name: 'Playwright', type: 'Functional', specialization: 'E2E Testing', status: 'active' },
    { name: 'Cypress', type: 'Functional', specialization: 'Component Testing', status: 'active' },
    { name: 'K6', type: 'Performance', specialization: 'Load Testing', status: 'active' },
    { name: 'JMeter', type: 'Performance', specialization: 'Performance Testing', status: 'active' },
    { name: 'Appium', type: 'Mobile', specialization: 'Mobile Testing', status: 'active' },
    { name: 'BrowserStack', type: 'Compatibility', specialization: 'Cross-Browser Testing', status: 'active' },
    { name: 'Postman', type: 'API', specialization: 'API Testing', status: 'active' },
    { name: 'Axe-Core', type: 'Accessibility', specialization: 'A11y Testing', status: 'active' }
  ];

  const getTestTypeStats = () => {
    const allTests = testCases || [];
    return {
      security: allTests.filter(t => t.type === 'security').length,
      functional: allTests.filter(t => ['functional', 'smoke', 'regression', 'unit', 'integration', 'e2e'].includes(t.type)).length,
      performance: allTests.filter(t => t.type === 'performance').length,
      specialized: allTests.filter(t => ['api', 'accessibility', 'visual', 'usability', 'compatibility'].includes(t.type)).length,
      total: allTests.length
    };
  };

  const stats = getTestTypeStats();

  return (
    <div className="space-y-6">
      {/* Enhanced Test Generation Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Enhanced Test Generation</h2>
            <p className="text-indigo-100">
              Comprehensive testing across security, functional, non-functional, and specialized domains
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-sm text-indigo-100">Total Tests</div>
          </div>
        </div>

        {/* Test Statistics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/10 p-3 rounded text-center">
            <div className="text-2xl font-bold">{stats.security}</div>
            <div className="text-sm text-indigo-100">Security Tests</div>
          </div>
          <div className="bg-white/10 p-3 rounded text-center">
            <div className="text-2xl font-bold">{stats.functional}</div>
            <div className="text-sm text-indigo-100">Functional Tests</div>
          </div>
          <div className="bg-white/10 p-3 rounded text-center">
            <div className="text-2xl font-bold">{stats.performance}</div>
            <div className="text-sm text-indigo-100">Performance Tests</div>
          </div>
          <div className="bg-white/10 p-3 rounded text-center">
            <div className="text-2xl font-bold">{stats.specialized}</div>
            <div className="text-sm text-indigo-100">Specialized Tests</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Test Categories</TabsTrigger>
          <TabsTrigger value="agents">MCP Agents</TabsTrigger>
          <TabsTrigger value="generation">Generate Tests</TabsTrigger>
          <TabsTrigger value="generated-tests">Generated Tests</TabsTrigger>
        </TabsList>

        {/* Test Categories Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(testCategories).map(([key, category]) => {
              const Icon = category.icon;
              return (
                <Card key={key} className={`hover:shadow-lg transition-shadow ${category.border}`}>
                  <CardHeader className={category.bg}>
                    <CardTitle className="flex items-center space-x-3">
                      <Icon className={`w-6 h-6 ${category.color}`} />
                      <span>{category.title}</span>
                    </CardTitle>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {category.types.map((type, index) => (
                        <div key={index} className="border-l-4 border-gray-200 pl-4">
                          <h4 className="font-semibold text-gray-900">{type.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {type.frameworks.map((framework, fIndex) => (
                              <Badge key={fIndex} variant="outline" className="text-xs">
                                {framework}
                              </Badge>
                            ))}
                          </div>
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">
                              Coverage: {type.coverage.join(', ')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* MCP Agents */}
        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>MCP Testing Agents</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mcpAgents.map((agent, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{agent.name}</h4>
                        <Badge variant="default" className="text-xs">
                          {agent.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">{agent.type} Testing</p>
                        <p className="text-xs text-gray-500">{agent.specialization}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Generation */}
        <TabsContent value="generation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Comprehensive Test Suite</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Test Type Selection */}
              <div>
                <h4 className="font-medium mb-4">Select Testing Categories</h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(testCategories).map(([key, category]) => {
                    const Icon = category.icon;
                    const isSelected = selectedTestTypes.includes(key);
                    return (
                      <div 
                        key={key}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected 
                            ? `${category.border} ${category.bg}` 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTestTypes(prev => prev.filter(t => t !== key));
                          } else {
                            setSelectedTestTypes(prev => [...prev, key]);
                          }
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-5 h-5 ${isSelected ? category.color : 'text-gray-400'}`} />
                          <div>
                            <h5 className="font-medium">{category.title}</h5>
                            <p className="text-sm text-gray-600">{category.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Generation Options */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Generation Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong>Selected Categories:</strong> {selectedTestTypes.length}
                    <div className="mt-1 space-x-1">
                      {selectedTestTypes.length > 0 ? (
                        selectedTestTypes.map(type => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {testCategories[type]?.title}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 text-xs">No categories selected</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <strong>Estimated Tests:</strong> {calculateEstimatedTests()}
                    <p className="text-gray-600">Based on selected categories and test types</p>
                  </div>
                  <div>
                    <strong>MCP Agents:</strong> {mcpAgents.length}
                    <p className="text-gray-600">Advanced testing automation and execution</p>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-center">
                <Button 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3"
                  disabled={selectedTestTypes.length === 0 || generateEnhancedTestSuiteMutation.isPending}
                  onClick={() => generateEnhancedTestSuiteMutation.mutate()}
                >
                  {generateEnhancedTestSuiteMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Suite...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4 mr-2" />
                      Generate Enhanced Test Suite
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generated Tests Tab */}
        <TabsContent value="generated-tests" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="w-5 h-5" />
                  Generated Test Cases
                  <Badge variant="secondary">{testCases.length} tests</Badge>
                </CardTitle>
                <Button onClick={downloadTestCases} variant="outline" disabled={testCases.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Download All Tests
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {testCases.length === 0 ? (
                <div className="text-center py-8">
                  <TestTube className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No test cases generated yet</h3>
                  <p className="text-gray-600 mb-4">Generate test cases using the Generation tab to see them here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Test Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {testCases.length}
                      </div>
                      <div className="text-sm text-blue-800">Total Tests</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {testCases.filter(tc => tc.status === 'passed').length}
                      </div>
                      <div className="text-sm text-green-800">Passed</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {testCases.filter(tc => tc.status === 'pending').length}
                      </div>
                      <div className="text-sm text-yellow-800">Pending</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {testCases.filter(tc => tc.status === 'failed').length}
                      </div>
                      <div className="text-sm text-red-800">Failed</div>
                    </div>
                  </div>

                  {/* Test Cases List */}
                  <div className="space-y-3">
                    {testCases.map((testCase, index) => (
                      <Card key={testCase.id} className="border-l-4 border-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-lg">{testCase.name}</h4>
                                <Badge variant={testCase.status === 'passed' ? 'default' : testCase.status === 'failed' ? 'destructive' : 'secondary'}>
                                  {testCase.status}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {testCase.type}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {testCase.priority}
                                </Badge>
                              </div>
                              
                              {testCase.description && (
                                <p className="text-gray-600 mb-3 text-sm">{testCase.description}</p>
                              )}

                              {testCase.script && (
                                <div className="bg-gray-50 border rounded-lg p-3 mb-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Test Script</span>
                                    <Badge variant="outline" className="text-xs">
                                      {testCase.framework || 'General'}
                                    </Badge>
                                  </div>
                                  <pre className="text-xs text-gray-800 overflow-x-auto max-h-32 bg-white p-2 rounded border">
                                    {testCase.script}
                                  </pre>
                                </div>
                              )}

                              {testCase.expectedOutcome && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                                  <div className="text-sm font-medium text-green-800 mb-1">Expected Outcome</div>
                                  <div className="text-sm text-green-700">{testCase.expectedOutcome}</div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-2 ml-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => downloadTestCase(testCase)}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => copyTestCase(testCase)}
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}