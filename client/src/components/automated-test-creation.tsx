import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Zap, Bot, TestTube, Shield, Database, Globe, 
  Smartphone, Bug, Activity, Clock, Target,
  CheckCircle, AlertTriangle, Loader2, Settings,
  Code, PlayCircle, FileText, BarChart3, Server,
  Eye, Cpu, Network, Search, ExternalLink
} from "lucide-react";
import type { Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface AutomatedTestCreationProps {
  project: Project;
}

export default function AutomatedTestCreation({ project }: AutomatedTestCreationProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [testComplexity, setTestComplexity] = useState<'basic' | 'intermediate' | 'comprehensive'>('intermediate');
  const [targetFrameworks, setTargetFrameworks] = useState<string[]>(['jest', 'playwright']);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [generatedScripts, setGeneratedScripts] = useState<any[]>([]);
  const [executionResults, setExecutionResults] = useState<any[]>([]);
  const [analysisReport, setAnalysisReport] = useState<any>(null);
  const [testRecommendations, setTestRecommendations] = useState<any[]>([]);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: analyses = [] } = useQuery({
    queryKey: [`/api/projects/${project.id}/analyses`],
  });

  const { data: existingTests = [] } = useQuery({
    queryKey: [`/api/projects/${project.id}/test-cases`],
  });

  const { data: mcpAgents = [] } = useQuery({
    queryKey: ['/api/mcp-agents'],
  });

  // Calculate actual test counts from existing data
  const getTestCountByType = (type: string, relatedTypes: string[] = []) => {
    const allTypes = [type, ...relatedTypes];
    return existingTests.filter(test => allTypes.includes(test.type)).length;
  };

  const testCategories = [
    {
      id: 'functional',
      name: 'Functional Testing',
      description: 'Core business logic and user workflows',
      icon: CheckCircle,
      color: 'text-blue-600',
      estimatedTests: getTestCountByType('functional', ['smoke', 'regression']),
      frameworks: ['jest', 'playwright', 'cypress']
    },
    {
      id: 'security',
      name: 'Security Testing',
      description: 'Vulnerability scanning and penetration testing',
      icon: Shield,
      color: 'text-red-600',
      estimatedTests: getTestCountByType('security'),
      frameworks: ['owasp-zap', 'jest', 'newman']
    },
    {
      id: 'performance',
      name: 'Performance Testing',
      description: 'Load testing and performance validation',
      icon: Zap,
      color: 'text-yellow-600',
      estimatedTests: getTestCountByType('performance'),
      frameworks: ['k6', 'lighthouse', 'jest']
    },
    {
      id: 'api',
      name: 'API Testing',
      description: 'REST/GraphQL endpoint validation',
      icon: Database,
      color: 'text-green-600',
      estimatedTests: getTestCountByType('api'),
      frameworks: ['newman', 'jest', 'supertest']
    },
    {
      id: 'integration',
      name: 'Integration Testing',
      description: 'Component interaction and data flow',
      icon: Target,
      color: 'text-purple-600',
      estimatedTests: getTestCountByType('integration', ['unit']),
      frameworks: ['jest', 'playwright', 'cypress']
    },
    {
      id: 'e2e',
      name: 'End-to-End Testing',
      description: 'Complete user journey validation',
      icon: PlayCircle,
      color: 'text-indigo-600',
      estimatedTests: getTestCountByType('e2e'),
      frameworks: ['playwright', 'cypress', 'selenium']
    },
    {
      id: 'accessibility',
      name: 'Accessibility Testing',
      description: 'WCAG compliance and usability',
      icon: Globe,
      color: 'text-cyan-600',
      estimatedTests: getTestCountByType('accessibility'),
      frameworks: ['axe-core', 'lighthouse', 'playwright']
    },
    {
      id: 'mobile',
      name: 'Mobile Testing',
      description: 'Mobile app and responsive testing',
      icon: Smartphone,
      color: 'text-pink-600',
      estimatedTests: getTestCountByType('mobile'),
      frameworks: ['appium', 'detox', 'playwright']
    }
  ];

  const platforms = [
    { 
      id: 'owasp-zap', 
      name: 'OWASP ZAP', 
      type: 'Security', 
      icon: Shield,
      description: 'Vulnerability scanning and penetration testing',
      capabilities: ['vulnerability-scanning', 'penetration-testing', 'security-audit']
    },
    { 
      id: 'burp-suite', 
      name: 'Burp Suite', 
      type: 'Security', 
      icon: Shield,
      description: 'Professional web security testing',
      capabilities: ['web-security-testing', 'api-security', 'authentication-testing']
    },
    { 
      id: 'nessus', 
      name: 'Nessus', 
      type: 'Security', 
      icon: Search,
      description: 'Infrastructure vulnerability scanning',
      capabilities: ['infrastructure-scanning', 'compliance-checking', 'risk-assessment']
    },
    { 
      id: 'playwright', 
      name: 'Playwright', 
      type: 'E2E/Browser', 
      icon: Globe,
      description: 'Cross-browser automation and testing',
      capabilities: ['e2e-testing', 'cross-browser-testing', 'visual-regression']
    },
    { 
      id: 'cypress', 
      name: 'Cypress', 
      type: 'E2E/Component', 
      icon: TestTube,
      description: 'Modern web application testing',
      capabilities: ['component-testing', 'e2e-testing', 'visual-testing']
    },
    { 
      id: 'k6', 
      name: 'k6', 
      type: 'Performance', 
      icon: Zap,
      description: 'Load and performance testing',
      capabilities: ['load-testing', 'stress-testing', 'performance-monitoring']
    },
    { 
      id: 'jmeter', 
      name: 'Apache JMeter', 
      type: 'Performance', 
      icon: Activity,
      description: 'Load testing and performance measurement',
      capabilities: ['load-testing', 'api-testing', 'database-testing']
    },
    { 
      id: 'appium', 
      name: 'Appium', 
      type: 'Mobile', 
      icon: Smartphone,
      description: 'Mobile application testing',
      capabilities: ['mobile-testing', 'ios-testing', 'android-testing']
    },
    { 
      id: 'browserstack', 
      name: 'BrowserStack', 
      type: 'Cloud Testing', 
      icon: Network,
      description: 'Cloud-based cross-browser testing',
      capabilities: ['cross-browser-testing', 'mobile-cloud-testing', 'visual-testing']
    },
    { 
      id: 'postman', 
      name: 'Postman', 
      type: 'API', 
      icon: Database,
      description: 'API development and testing',
      capabilities: ['api-testing', 'collection-runner', 'monitoring']
    },
    { 
      id: 'axecore', 
      name: 'Axe-Core', 
      type: 'Accessibility', 
      icon: Eye,
      description: 'Accessibility compliance testing',
      capabilities: ['accessibility-testing', 'wcag-compliance', 'audit-reporting']
    }
  ];

  const generatePlatformTestsMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      setGenerationProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 15, 90));
      }, 500);

      try {
        const response = await fetch(`/api/projects/${project.id}/generate-platform-tests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platforms: selectedPlatforms,
            categories: selectedCategories,
            complexity: testComplexity,
            frameworks: targetFrameworks,
            analysisData: analyses.find(a => a.type === 'initial_analysis')?.results,
            riskData: analyses.find(a => a.type === 'risk_assessment')?.results,
            existingTests: existingTests // Include existing test data for context
          })
        });

        clearInterval(progressInterval);
        setGenerationProgress(100);

        if (!response.ok) {
          throw new Error(`Failed to generate platform tests: ${response.statusText}`);
        }

        return response.json();
      } catch (error) {
        clearInterval(progressInterval);
        setGenerationProgress(0);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: (data) => {
      setGeneratedScripts(data.testScripts || []);
      toast({
        title: "Platform Test Scripts Generated",
        description: `Successfully generated ${data.testScripts?.length || 0} test scripts for ${selectedPlatforms.length} platforms.`,
      });
      setGenerationProgress(0);
    },
    onError: (error) => {
      toast({
        title: "Generation Failed", 
        description: error.message || "Failed to generate platform test scripts. Please try again.",
        variant: "destructive",
      });
      setGenerationProgress(0);
    }
  });

  const executePlatformTestsMutation = useMutation({
    mutationFn: async () => {
      setIsExecuting(true);
      setExecutionProgress(0);

      // Simulate execution progress
      const progressInterval = setInterval(() => {
        setExecutionProgress(prev => Math.min(prev + 8, 90));
      }, 800);

      try {
        const response = await fetch(`/api/projects/${project.id}/execute-platform-tests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testScripts: generatedScripts,
            selectedPlatforms: selectedPlatforms
          })
        });

        clearInterval(progressInterval);
        setExecutionProgress(100);

        if (!response.ok) {
          throw new Error(`Failed to execute platform tests: ${response.statusText}`);
        }

        return response.json();
      } catch (error) {
        clearInterval(progressInterval);
        setExecutionProgress(0);
        throw error;
      } finally {
        setIsExecuting(false);
      }
    },
    onSuccess: (data) => {
      setExecutionResults(data.executionResults || []);
      setAnalysisReport(data.analysisReport || null);
      setTestRecommendations(data.analysisReport?.recommendations || []);
      toast({
        title: "Platform Tests Executed",
        description: `Successfully executed tests on ${selectedPlatforms.length} platforms with detailed analysis.`,
      });
      setExecutionProgress(0);
    },
    onError: (error) => {
      toast({
        title: "Execution Failed",
        description: error.message || "Failed to execute platform tests. Please try again.",
        variant: "destructive",
      });
      setExecutionProgress(0);
    }
  });

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const getEstimatedTestCount = () => {
    return selectedCategories.reduce((total, categoryId) => {
      const category = testCategories.find(c => c.id === categoryId);
      const multiplier = testComplexity === 'basic' ? 0.5 : testComplexity === 'comprehensive' ? 1.5 : 1;
      return total + Math.ceil((category?.estimatedTests || 0) * multiplier);
    }, 0);
  };

  const getCoverageScore = () => {
    const maxCategories = testCategories.length;
    const selectedCount = selectedCategories.length;
    return Math.round((selectedCount / maxCategories) * 100);
  };

  const hasAnalysisData = analyses.some(a => a.type === 'initial_analysis' && a.results);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Automated Test Generation</h2>
            <p className="text-purple-100">
              Intelligent test case generation based on your application analysis
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{getEstimatedTestCount()}</div>
            <div className="text-sm text-purple-100">Est. Test Cases</div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/10 p-3 rounded text-center">
            <div className="text-xl font-bold">{selectedCategories.length}</div>
            <div className="text-xs text-purple-100">Categories</div>
          </div>
          <div className="bg-white/10 p-3 rounded text-center">
            <div className="text-xl font-bold">{selectedPlatforms.length}</div>
            <div className="text-xs text-purple-100">Platforms</div>
          </div>
          <div className="bg-white/10 p-3 rounded text-center">
            <div className="text-xl font-bold">{getCoverageScore()}%</div>
            <div className="text-xs text-purple-100">Coverage</div>
          </div>
          <div className="bg-white/10 p-3 rounded text-center">
            <div className="text-xl font-bold">{existingTests.length}</div>
            <div className="text-xs text-purple-100">Existing</div>
          </div>
        </div>
      </div>

      {!hasAnalysisData && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-800">Analysis Required</h3>
                <p className="text-sm text-amber-700">
                  Project analysis is needed for optimal test generation. Please run the analysis first.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="scripts">Generated Scripts</TabsTrigger>
          <TabsTrigger value="execution">Test Execution</TabsTrigger>
          <TabsTrigger value="results">Detailed Results & Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Select Test Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {testCategories.map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategories.includes(category.id);
                  
                  return (
                    <div
                      key={category.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleCategory(category.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={isSelected}
                            onChange={() => toggleCategory(category.id)}
                          />
                          <Icon className={`w-5 h-5 ${category.color}`} />
                        </div>
                        <Badge variant="secondary">
                          ~{category.estimatedTests} tests
                        </Badge>
                      </div>
                      <h3 className="font-semibold mb-1">{category.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {category.frameworks.slice(0, 3).map(fw => (
                          <Badge key={fw} variant="outline" className="text-xs">
                            {fw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Testing Platforms & Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {platforms.map((platform) => {
                  const Icon = platform.icon;
                  const isSelected = selectedPlatforms.includes(platform.id);
                  const mcpAgent = mcpAgents.agents?.find(a => a.platform === platform.id);
                  
                  return (
                    <div
                      key={platform.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => togglePlatform(platform.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={isSelected}
                            onChange={() => togglePlatform(platform.id)}
                          />
                          <Icon className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {platform.type}
                          </Badge>
                          {mcpAgent && (
                            <div className={`w-2 h-2 rounded-full ${
                              mcpAgent.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                          )}
                        </div>
                      </div>
                      <h3 className="font-semibold mb-1">{platform.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{platform.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {platform.capabilities.slice(0, 3).map(capability => (
                          <Badge key={capability} variant="outline" className="text-xs">
                            {capability.replace('-', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Generation Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-3 block">Test Complexity Level</Label>
                <Select value={testComplexity} onValueChange={(value: any) => setTestComplexity(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">
                      <div className="flex flex-col">
                        <span>Basic</span>
                        <span className="text-xs text-gray-500">Essential test cases only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="intermediate">
                      <div className="flex flex-col">
                        <span>Intermediate</span>
                        <span className="text-xs text-gray-500">Balanced coverage and depth</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="comprehensive">
                      <div className="flex flex-col">
                        <span>Comprehensive</span>
                        <span className="text-xs text-gray-500">Maximum coverage and edge cases</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Generation Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Selected Categories:</span>
                    <span className="font-medium">{selectedCategories.length}/{testCategories.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Selected Platforms:</span>
                    <span className="font-medium">{selectedPlatforms.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Test Cases:</span>
                    <span className="font-medium text-purple-600">{getEstimatedTestCount()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coverage Score:</span>
                    <span className="font-medium text-green-600">{getCoverageScore()}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scripts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Generated Test Scripts
                {generatedScripts.length > 0 && (
                  <Badge variant="secondary">{generatedScripts.length} scripts</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedScripts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No test scripts generated yet.</p>
                  <p className="text-sm">Generate platform tests first to see scripts here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generatedScripts.map((script, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{script.name}</h3>
                          <p className="text-sm text-gray-600">{script.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={script.priority === 'critical' ? 'destructive' : 'secondary'}>
                            {script.priority}
                          </Badge>
                          <Badge variant="outline">
                            {script.platform}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded p-3 mb-3">
                        <pre className="text-xs overflow-x-auto max-h-32">
                          <code>{script.script}</code>
                        </pre>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        <span>Framework: {script.framework}</span> • 
                        <span>Duration: ~{script.estimatedDuration}s</span> • 
                        <span>Category: {script.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="execution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Test Execution Status
                {executionResults && (
                  <Badge variant="secondary">{executionResults.length} tests executed</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {executionResults && executionResults.length > 0 ? (
                <div className="space-y-4">
                  {/* Execution Summary */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {executionResults.filter(r => r.status === 'passed').length}
                      </div>
                      <div className="text-sm text-gray-600">Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {executionResults.filter(r => r.status === 'failed').length}
                      </div>
                      <div className="text-sm text-gray-600">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {executionResults.filter(r => r.status === 'error').length}
                      </div>
                      <div className="text-sm text-gray-600">Errors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(executionResults.reduce((sum, r) => sum + r.duration, 0) / 1000)}s
                      </div>
                      <div className="text-sm text-gray-600">Total Time</div>
                    </div>
                  </div>

                  {/* Individual Test Results */}
                  <div className="space-y-3">
                    {executionResults.map((result, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              result.status === 'passed' ? 'bg-green-500' :
                              result.status === 'failed' ? 'bg-red-500' : 'bg-orange-500'
                            }`} />
                            <span className="font-semibold">{result.testId}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{result.platform}</Badge>
                            <Badge variant={result.status === 'passed' ? 'default' : 'destructive'}>
                              {result.status}
                            </Badge>
                          </div>
                        </div>
                        
                        {result.output && (
                          <div className="bg-gray-50 rounded p-3 mb-2">
                            <pre className="text-xs overflow-x-auto max-h-20 text-gray-700">
                              {result.output}
                            </pre>
                          </div>
                        )}
                        
                        {result.errors.length > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded p-3 mb-2">
                            <div className="text-sm text-red-800">
                              {result.errors.map((error, idx) => (
                                <div key={idx}>• {error}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          Duration: {result.duration}ms
                          {Object.keys(result.metrics).length > 0 && (
                            <span> • Metrics: {Object.entries(result.metrics).map(([k, v]) => `${k}: ${v}`).join(', ')}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <PlayCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No test execution results yet.</p>
                  <p className="text-sm">Execute platform tests to see results here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {analysisReport ? (
            <div className="space-y-6">
              {/* Executive Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Executive Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">
                        {analysisReport.summary.passRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 font-medium">Pass Rate</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">
                        {analysisReport.summary.totalTests}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">Total Tests</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-3xl font-bold text-orange-600">
                        {analysisReport.securityFindings.critical + analysisReport.securityFindings.high}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">Critical Issues</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600">
                        {analysisReport.performanceMetrics.responseTime}ms
                      </div>
                      <div className="text-sm text-gray-600 font-medium">Avg Response</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform-Specific Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    Platform Analysis Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(analysisReport.platformResults).map(([platform, data]) => (
                      <div key={platform} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold capitalize">{platform.replace('-', ' ')}</span>
                          <Badge variant={data.passRate > 80 ? 'default' : 'destructive'}>
                            {data.passRate.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Tests:</span>
                            <span>{data.testCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Critical Issues:</span>
                            <span className={data.criticalIssues > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                              {data.criticalIssues}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span className="text-green-600">{data.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Security Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Analysis & Vulnerabilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Security Summary */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-3 bg-red-50 rounded">
                        <div className="text-xl font-bold text-red-600">{analysisReport.securityFindings.critical}</div>
                        <div className="text-xs text-gray-600">Critical</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded">
                        <div className="text-xl font-bold text-orange-600">{analysisReport.securityFindings.high}</div>
                        <div className="text-xs text-gray-600">High</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded">
                        <div className="text-xl font-bold text-yellow-600">{analysisReport.securityFindings.medium}</div>
                        <div className="text-xs text-gray-600">Medium</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-xl font-bold text-gray-600">{analysisReport.securityFindings.low}</div>
                        <div className="text-xs text-gray-600">Low</div>
                      </div>
                    </div>

                    {/* Vulnerability Details */}
                    <div className="space-y-3">
                      {analysisReport.securityFindings.vulnerabilities.map((vuln, index) => (
                        <div key={index} className="border-l-4 border-red-400 bg-red-50 pl-4 py-3 rounded-r">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={vuln.severity === 'high' ? 'destructive' : 'secondary'}>
                              {vuln.severity.toUpperCase()}
                            </Badge>
                            <span className="font-semibold">{vuln.type}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-3">{vuln.description}</p>
                          <div className="bg-green-50 border border-green-200 rounded p-2">
                            <p className="text-xs text-green-800">
                              <strong>Recommendation:</strong> {vuln.recommendation}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Performance Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {analysisReport.performanceMetrics.responseTime}ms
                      </div>
                      <div className="text-sm text-gray-600">Avg Response Time</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {analysisReport.performanceMetrics.throughput}
                      </div>
                      <div className="text-sm text-gray-600">Requests/sec</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {analysisReport.performanceMetrics.errorRate}%
                      </div>
                      <div className="text-sm text-gray-600">Error Rate</div>
                    </div>
                  </div>
                  
                  {analysisReport.performanceMetrics.bottlenecks.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                      <h4 className="font-semibold text-yellow-800 mb-2">Performance Bottlenecks:</h4>
                      <ul className="space-y-1">
                        {analysisReport.performanceMetrics.bottlenecks.map((bottleneck, index) => (
                          <li key={index} className="text-sm text-yellow-700">• {bottleneck}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Accessibility Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Accessibility Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">WCAG 2.1 AA Compliance Score</span>
                      <Badge variant={analysisReport.accessibilityResults.score >= 90 ? 'default' : 'destructive'}>
                        {analysisReport.accessibilityResults.score}/100
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${analysisReport.accessibilityResults.score >= 90 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${analysisReport.accessibilityResults.score}%` }}
                      />
                    </div>
                  </div>
                  
                  {analysisReport.accessibilityResults.violations.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold">Accessibility Violations:</h4>
                      {analysisReport.accessibilityResults.violations.map((violation, index) => (
                        <div key={index} className="border-l-4 border-orange-400 bg-orange-50 pl-4 py-2 rounded-r">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary">{violation.impact}</Badge>
                            <span className="text-sm font-medium">{violation.element}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{violation.description}</p>
                          <p className="text-xs text-orange-800">
                            <strong>Fix:</strong> {violation.recommendation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Items & Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Action Items & Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisReport.recommendations.map((rec, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-lg">{rec.title}</span>
                          <div className="flex gap-2">
                            <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                              {rec.priority} priority
                            </Badge>
                            <Badge variant="outline">{rec.category}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                          <div>
                            <strong>Impact:</strong> {rec.impact}
                          </div>
                          <div>
                            <strong>Effort:</strong> {rec.effort}
                          </div>
                        </div>
                        {rec.actionable && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Actionable
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BarChart3 className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Analysis Results Available</h3>
                <p className="text-gray-500 mb-4">Execute platform tests to generate comprehensive analysis and recommendations.</p>
                <p className="text-sm text-gray-400">
                  The detailed analysis will include security findings, performance metrics, accessibility compliance, and actionable recommendations.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {testRecommendations && testRecommendations.length > 0 ? (
            <div className="space-y-4">
              {/* Recommendations Header */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    AI-Generated Test Recommendations
                    <Badge variant="secondary">{testRecommendations.length} recommendations</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Based on the comprehensive test execution across {selectedPlatforms.length} platforms, 
                    our AI has identified key areas for improvement and actionable recommendations to enhance your application quality.
                  </p>
                </CardContent>
              </Card>

              {/* Priority Categories */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {testRecommendations.filter(r => r.priority === 'high').length}
                    </div>
                    <div className="text-sm text-red-700">High Priority</div>
                  </CardContent>
                </Card>
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {testRecommendations.filter(r => r.priority === 'medium').length}
                    </div>
                    <div className="text-sm text-orange-700">Medium Priority</div>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {testRecommendations.filter(r => r.priority === 'low').length}
                    </div>
                    <div className="text-sm text-blue-700">Low Priority</div>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations by Category */}
              {['security', 'performance', 'quality', 'accessibility'].map(category => {
                const categoryRecs = testRecommendations.filter(r => r.category === category);
                if (categoryRecs.length === 0) return null;

                const categoryIcons = {
                  security: Shield,
                  performance: Zap,
                  quality: CheckCircle,
                  accessibility: Eye
                };
                
                const CategoryIcon = categoryIcons[category] || Target;

                return (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 capitalize">
                        <CategoryIcon className="w-5 h-5" />
                        {category} Recommendations
                        <Badge variant="outline">{categoryRecs.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {categoryRecs.map((rec, index) => (
                          <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg mb-1">{rec.title}</h4>
                                <p className="text-gray-600 text-sm mb-3">{rec.description}</p>
                              </div>
                              <div className="flex flex-col gap-2 ml-4">
                                <Badge variant={
                                  rec.priority === 'high' ? 'destructive' : 
                                  rec.priority === 'medium' ? 'default' : 'secondary'
                                }>
                                  {rec.priority} priority
                                </Badge>
                                {rec.actionable && (
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    Actionable
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                <div className="font-medium text-blue-800 mb-1">Expected Impact</div>
                                <div className="text-blue-700">{rec.impact}</div>
                              </div>
                              <div className="bg-purple-50 border border-purple-200 rounded p-3">
                                <div className="font-medium text-purple-800 mb-1">Implementation Effort</div>
                                <div className="text-purple-700">{rec.effort}</div>
                              </div>
                            </div>

                            {/* Implementation Timeline */}
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>
                                  Recommended timeline: {
                                    rec.priority === 'high' ? 'Immediate (1-2 weeks)' :
                                    rec.priority === 'medium' ? 'Short-term (2-4 weeks)' : 
                                    'Long-term (1-3 months)'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Implementation Roadmap */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Implementation Roadmap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['high', 'medium', 'low'].map((priority, phaseIndex) => {
                      const priorityRecs = testRecommendations.filter(r => r.priority === priority);
                      if (priorityRecs.length === 0) return null;

                      return (
                        <div key={priority} className="border rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                              priority === 'high' ? 'bg-red-500' :
                              priority === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
                            }`}>
                              {phaseIndex + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold capitalize">Phase {phaseIndex + 1}: {priority} Priority Items</h4>
                              <p className="text-sm text-gray-600">
                                {priorityRecs.length} recommendations • Est. {
                                  priority === 'high' ? '1-2 weeks' :
                                  priority === 'medium' ? '2-4 weeks' : '1-3 months'
                                }
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {priorityRecs.map((rec, index) => (
                              <div key={index} className="text-sm p-2 bg-gray-50 rounded border-l-4 border-gray-300">
                                <div className="font-medium">{rec.title}</div>
                                <div className="text-gray-600 text-xs">{rec.category}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Recommendations Available</h3>
                <p className="text-gray-500 mb-4">Execute platform tests to generate intelligent recommendations with MATT.</p>
                <p className="text-sm text-gray-400">
                  Our AI will analyze test results and provide actionable recommendations to improve your application quality, security, and performance.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Progress Indicators */}
      {isGenerating && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold">Generating Platform Test Scripts...</h3>
              <p className="text-sm text-gray-600">AI is creating platform-specific test scripts for {selectedPlatforms.length} platforms</p>
            </div>
            <Progress value={generationProgress} className="mb-2" />
            <p className="text-xs text-center text-gray-500">{generationProgress}% complete</p>
          </CardContent>
        </Card>
      )}

      {isExecuting && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold">Executing Tests via MCP Agents...</h3>
              <p className="text-sm text-gray-600">Running tests across {selectedPlatforms.length} platforms and generating analysis</p>
            </div>
            <Progress value={executionProgress} className="mb-2" />
            <p className="text-xs text-center text-gray-500">{executionProgress}% complete</p>
          </CardContent>
        </Card>
      )}

      {/* Action Status */}
      {(selectedCategories.length === 0 || selectedPlatforms.length === 0) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-800">Ready to Generate Tests</h3>
                <p className="text-sm text-amber-700">
                  {selectedCategories.length === 0 && selectedPlatforms.length === 0 
                    ? "Please select test categories and platforms to begin generation."
                    : selectedCategories.length === 0 
                    ? "Please select at least one test category to continue."
                    : "Please select at least one testing platform to continue."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={selectedCategories.length === 0 || selectedPlatforms.length === 0 || generatePlatformTestsMutation.isPending}
          onClick={() => generatePlatformTestsMutation.mutate()}
          title={selectedCategories.length === 0 ? "Please select test categories first" : 
                 selectedPlatforms.length === 0 ? "Please select testing platforms first" : 
                 "Generate platform-specific test scripts"}
        >
          {generatePlatformTestsMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Scripts...
            </>
          ) : (
            <>
              <Bot className="w-5 h-5 mr-2" />
              Generate Platform Test Scripts
            </>
          )}
        </Button>

        {generatedScripts.length > 0 && (
          <Button 
            size="lg"
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3"
            disabled={executePlatformTestsMutation.isPending || selectedPlatforms.length === 0}
            onClick={() => executePlatformTestsMutation.mutate()}
          >
            {executePlatformTestsMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Executing via MCP...
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5 mr-2" />
                Execute Tests & Analyze
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}