import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Info, 
  Lightbulb,
  Code,
  GitBranch,
  Bug,
  Zap,
  ChevronDown,
  ChevronRight,
  FileCode,
  Target,
  Shield,
  TrendingUp
} from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

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
    type: string;
    missed: string[];
    complexity: number;
  }[];
  suggestedTests: {
    testName: string;
    testType: string;
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
  category: string;
  references?: string[];
}

interface AICodeReviewProps {
  projectId: number;
  onTestGenerated?: (test: any) => void;
}

export const AICodeReview: React.FC<AICodeReviewProps> = ({ projectId, onTestGenerated }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('suggestions');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [realtimeSuggestions, setRealtimeSuggestions] = useState<CodeReviewSuggestion[]>([]);
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const codeEditorRef = useRef<any>(null);

  // Mock code for demonstration
  const [currentCode, setCurrentCode] = useState(`
function calculateOrderTotal(items, discountCode) {
  let total = 0;
  
  for (let item of items) {
    total += item.price * item.quantity;
  }
  
  // Apply discount
  if (discountCode) {
    const discount = getDiscount(discountCode);
    total = total * (1 - discount);
  }
  
  return total;
}

async function processPayment(amount, cardInfo) {
  const response = await fetch('/api/payment', {
    method: 'POST',
    body: JSON.stringify({ amount, cardInfo })
  });
  
  return response.json();
}
`);

  // Fetch code review suggestions
  const { data: suggestions, isLoading: suggestionsLoading, refetch: refetchSuggestions } = useQuery({
    queryKey: ['codeReviewSuggestions', projectId],
    queryFn: async () => {
      const response = await fetch('/api/ai/code-review/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          fileContent: currentCode,
          filePath: 'src/services/order.js'
        })
      });
      const data = await response.json();
      return data.suggestions as CodeReviewSuggestion[];
    }
  });

  // Fetch coverage gaps
  const { data: coverageGaps, isLoading: coverageLoading } = useQuery({
    queryKey: ['coverageGaps', projectId],
    queryFn: async () => {
      const response = await fetch('/api/ai/code-review/coverage-gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      });
      const data = await response.json();
      return data.gaps as CoverageGap[];
    }
  });

  // Fetch anti-patterns
  const { data: antiPatterns, isLoading: antiPatternsLoading } = useQuery({
    queryKey: ['antiPatterns', projectId],
    queryFn: async () => {
      const response = await fetch('/api/ai/code-review/anti-patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      });
      const data = await response.json();
      return data.antiPatterns as TestAntiPattern[];
    }
  });

  // Real-time suggestions WebSocket
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      const ws = new WebSocket(`wss://${window.location.host}/api/ai/code-review/realtime`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'suggestions') {
          setRealtimeSuggestions(message.data);
        }
      };

      return () => {
        ws.close();
      };
    }
  }, []);

  // Apply auto-fix mutation
  const applyAutoFix = useMutation({
    mutationFn: async (suggestion: CodeReviewSuggestion) => {
      if (suggestion.suggestedCode) {
        // Apply the suggested code
        const lines = currentCode.split('\n');
        const before = lines.slice(0, suggestion.lineStart - 1);
        const after = lines.slice(suggestion.lineEnd);
        const newCode = [...before, suggestion.suggestedCode, ...after].join('\n');
        setCurrentCode(newCode);
        
        toast({
          title: "Auto-fix applied",
          description: `Applied fix for: ${suggestion.title}`,
          duration: 3000
        });
      }
    }
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'medium':
      case 'major':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low':
      case 'minor':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'info':
        return <Lightbulb className="h-4 w-4 text-gray-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'test':
        return <FileCode className="h-4 w-4" />;
      case 'coverage':
        return <Target className="h-4 w-4" />;
      case 'antipattern':
        return <Bug className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'optimization':
        return <Zap className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  const toggleSuggestion = (id: string) => {
    setExpandedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const renderSuggestions = () => (
    <ScrollArea className="h-[600px]">
      <div className="space-y-4 p-4">
        {suggestions?.map((suggestion) => (
          <Collapsible
            key={suggestion.id}
            open={expandedSuggestions.has(suggestion.id)}
            onOpenChange={() => toggleSuggestion(suggestion.id)}
          >
            <Card className="border-l-4" style={{
              borderLeftColor: 
                suggestion.severity === 'critical' ? '#ef4444' :
                suggestion.severity === 'high' ? '#f97316' :
                suggestion.severity === 'medium' ? '#eab308' :
                suggestion.severity === 'low' ? '#3b82f6' : '#6b7280'
            }}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getSeverityIcon(suggestion.severity)}
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        {getTypeIcon(suggestion.type)}
                        {suggestion.title}
                        {suggestion.realtime && (
                          <Badge variant="secondary" className="text-xs">
                            Real-time
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {suggestion.description}
                      </CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {suggestion.file}:{suggestion.lineStart}-{suggestion.lineEnd}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {suggestion.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {suggestion.confidence}% confidence
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {suggestion.autoFixAvailable && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyAutoFix.mutate(suggestion)}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Auto-fix
                      </Button>
                    )}
                    <CollapsibleTrigger asChild>
                      <Button size="sm" variant="ghost">
                        {expandedSuggestions.has(suggestion.id) ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                        }
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  {suggestion.suggestedCode && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Suggested Code:</p>
                      <CodeMirror
                        value={suggestion.suggestedCode}
                        height="200px"
                        theme={oneDark}
                        extensions={[javascript()]}
                        editable={false}
                      />
                    </div>
                  )}
                  {suggestion.relatedDocs && suggestion.relatedDocs.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-1">Related Documentation:</p>
                      <ul className="text-xs space-y-1">
                        {suggestion.relatedDocs.map((doc, idx) => (
                          <li key={idx}>
                            <a href={doc} target="_blank" rel="noopener noreferrer" 
                               className="text-blue-500 hover:underline">
                              {doc}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </ScrollArea>
  );

  const renderCoverageGaps = () => (
    <ScrollArea className="h-[600px]">
      <div className="space-y-4 p-4">
        {coverageGaps?.map((gap, idx) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {gap.file}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">
                    {gap.coverageImpact.current}% covered
                  </Badge>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <Badge variant="secondary">
                    {gap.coverageImpact.potential}% potential
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Uncovered Functions ({gap.uncoveredFunctions.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {gap.uncoveredFunctions.map((func, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {func}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-1">Uncovered Branches ({gap.uncoveredBranches.length}):</p>
                  <div className="space-y-1">
                    {gap.uncoveredBranches.slice(0, 3).map((branch, i) => (
                      <div key={i} className="text-xs text-muted-foreground">
                        Line {branch.line}: {branch.type} - {branch.missed.join(', ')} 
                        (complexity: {branch.complexity})
                      </div>
                    ))}
                  </div>
                </div>

                {gap.suggestedTests.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Suggested Tests:</p>
                    <div className="space-y-2">
                      {gap.suggestedTests.slice(0, 2).map((test, i) => (
                        <Alert key={i}>
                          <Lightbulb className="h-4 w-4" />
                          <AlertTitle className="text-sm">{test.testName}</AlertTitle>
                          <AlertDescription className="text-xs">
                            {test.description} (+{test.estimatedCoverage}% coverage)
                          </AlertDescription>
                          <Button 
                            size="sm" 
                            className="mt-2"
                            onClick={() => onTestGenerated?.(test)}
                          >
                            Generate Test
                          </Button>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );

  const renderAntiPatterns = () => (
    <ScrollArea className="h-[600px]">
      <div className="space-y-4 p-4">
        {antiPatterns?.map((pattern) => (
          <Card key={pattern.id} className="border-l-4" style={{
            borderLeftColor: 
              pattern.severity === 'critical' ? '#ef4444' :
              pattern.severity === 'major' ? '#f97316' :
              pattern.severity === 'minor' ? '#eab308' : '#6b7280'
          }}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Bug className="h-4 w-4" />
                {pattern.pattern}
                <Badge variant="outline" className="text-xs">
                  {pattern.category}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                {pattern.file}:{pattern.line}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Description:</p>
                  <p className="text-xs text-muted-foreground">{pattern.description}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Impact:</p>
                  <p className="text-xs text-muted-foreground">{pattern.impact}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Suggestion:</p>
                  <p className="text-xs text-muted-foreground">{pattern.suggestion}</p>
                </div>
                {pattern.example && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs font-medium mb-1 text-red-500">❌ Bad:</p>
                      <CodeMirror
                        value={pattern.example.bad}
                        height="100px"
                        theme={oneDark}
                        extensions={[javascript()]}
                        editable={false}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1 text-green-500">✅ Good:</p>
                      <CodeMirror
                        value={pattern.example.good}
                        height="100px"
                        theme={oneDark}
                        extensions={[javascript()]}
                        editable={false}
                      />
                    </div>
                  </div>
                )}
                {pattern.autoFixCode && (
                  <Button size="sm" variant="outline">
                    <Zap className="h-3 w-3 mr-1" />
                    Apply Fix
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Code Review & Test Suggestions</CardTitle>
          <CardDescription>
            Real-time code analysis with AI-powered test suggestions and anti-pattern detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Code Editor */}
            <div>
              <h3 className="text-sm font-medium mb-2">Code Editor</h3>
              <CodeMirror
                ref={codeEditorRef}
                value={currentCode}
                height="400px"
                theme={oneDark}
                extensions={[javascript()]}
                onChange={(value) => setCurrentCode(value)}
              />
              <div className="mt-2 flex items-center gap-2">
                <Button 
                  onClick={() => refetchSuggestions()}
                  disabled={suggestionsLoading}
                >
                  Analyze Code
                </Button>
                {realtimeSuggestions.length > 0 && (
                  <Badge variant="secondary">
                    {realtimeSuggestions.length} real-time suggestions
                  </Badge>
                )}
              </div>
            </div>

            {/* Real-time Suggestions */}
            <div>
              <h3 className="text-sm font-medium mb-2">Real-time Suggestions</h3>
              <ScrollArea className="h-[400px] border rounded-md p-3">
                {realtimeSuggestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Start typing to see real-time suggestions...
                  </p>
                ) : (
                  <div className="space-y-2">
                    {realtimeSuggestions.map((suggestion) => (
                      <Alert key={suggestion.id}>
                        <div className="flex items-start gap-2">
                          {getSeverityIcon(suggestion.severity)}
                          <div className="flex-1">
                            <AlertTitle className="text-sm">{suggestion.title}</AlertTitle>
                            <AlertDescription className="text-xs">
                              {suggestion.description}
                            </AlertDescription>
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="suggestions">
                Suggestions ({suggestions?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="coverage">
                Coverage Gaps ({coverageGaps?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="antipatterns">
                Anti-patterns ({antiPatterns?.length || 0})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="suggestions">
              {suggestionsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Analyzing code...</p>
                  </div>
                </div>
              ) : (
                renderSuggestions()
              )}
            </TabsContent>
            <TabsContent value="coverage">
              {coverageLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Detecting coverage gaps...</p>
                  </div>
                </div>
              ) : (
                renderCoverageGaps()
              )}
            </TabsContent>
            <TabsContent value="antipatterns">
              {antiPatternsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Detecting anti-patterns...</p>
                  </div>
                </div>
              ) : (
                renderAntiPatterns()
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};