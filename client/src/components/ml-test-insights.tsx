import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, TrendingUp, AlertTriangle, Zap, Target, 
  GitBranch, Clock, CheckCircle, XCircle, Activity,
  FileCode, Bug, Lightbulb, ArrowUp, ArrowDown
} from "lucide-react";
import type { Project } from "@shared/schema";

interface MLTestInsightsProps {
  project: Project;
}

interface RiskScore {
  testCaseId: number;
  testName: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  score: number;
  factors: {
    historicalFailureRate: number;
    recentChanges: number;
    complexity: number;
    dependencies: number;
    lastFailureRecency: number;
  };
  recommendation: string;
}

interface TestPrediction {
  testCaseId: number;
  testName: string;
  predictedOutcome: 'pass' | 'fail';
  confidence: number;
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

export default function MLTestInsights({ project }: MLTestInsightsProps) {
  const [changedFiles, setChangedFiles] = useState<string[]>([]);
  const [fileInput, setFileInput] = useState("");

  // Fetch ML insights
  const { data: riskScores = [] } = useQuery<RiskScore[]>({
    queryKey: [`/api/projects/${project.id}/ml/risk-scores`],
  });

  const { data: predictions = [] } = useQuery<TestPrediction[]>({
    queryKey: [`/api/projects/${project.id}/ml/failure-predictions`],
  });

  const { data: optimalOrder } = useQuery<OptimalTestOrder>({
    queryKey: [`/api/projects/${project.id}/ml/optimal-test-order`, { method: 'POST' }],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${project.id}/ml/optimal-test-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCaseIds: [] })
      });
      if (!response.ok) throw new Error('Failed to fetch optimal test order');
      return response.json();
    },
  });

  const { data: codeImpact, refetch: refetchCodeImpact } = useQuery({
    queryKey: [`/api/projects/${project.id}/ml/smart-test-selection`, changedFiles],
    queryFn: async () => {
      if (changedFiles.length === 0) return null;
      const response = await fetch(`/api/projects/${project.id}/ml/smart-test-selection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changedFiles })
      });
      if (!response.ok) throw new Error('Failed to fetch code impact');
      return response.json();
    },
    enabled: changedFiles.length > 0,
  });

  const addChangedFile = () => {
    if (fileInput && !changedFiles.includes(fileInput)) {
      setChangedFiles([...changedFiles, fileInput]);
      setFileInput("");
    }
  };

  const removeChangedFile = (file: string) => {
    setChangedFiles(changedFiles.filter(f => f !== file));
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="w-8 h-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ML Testing Intelligence</h2>
            <p className="text-sm text-gray-600">AI-powered test optimization and predictions</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="risk-scores" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="risk-scores">Risk Scoring</TabsTrigger>
          <TabsTrigger value="smart-selection">Smart Selection</TabsTrigger>
          <TabsTrigger value="predictions">Failure Prediction</TabsTrigger>
          <TabsTrigger value="optimal-order">Optimal Order</TabsTrigger>
        </TabsList>

        <TabsContent value="risk-scores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>ML-Based Risk Scores</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {riskScores.map((risk) => (
                    <Card key={risk.testCaseId} className="border-l-4" style={{
                      borderLeftColor: risk.riskLevel === 'critical' ? '#dc2626' :
                                       risk.riskLevel === 'high' ? '#f97316' :
                                       risk.riskLevel === 'medium' ? '#eab308' : '#22c55e'
                    }}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{risk.testName}</h4>
                            <div className="flex items-center space-x-4 mt-2">
                              <Badge className={getRiskLevelColor(risk.riskLevel)}>
                                {risk.riskLevel.toUpperCase()} RISK
                              </Badge>
                              <span className="text-2xl font-bold text-gray-900">
                                {risk.score}%
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                              {risk.recommendation}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-5 gap-2 mt-4">
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Failure Rate</div>
                            <div className="font-semibold">{risk.factors.historicalFailureRate}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Recent Changes</div>
                            <div className="font-semibold">{risk.factors.recentChanges}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Complexity</div>
                            <div className="font-semibold">{risk.factors.complexity}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Dependencies</div>
                            <div className="font-semibold">{risk.factors.dependencies}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Last Failure</div>
                            <div className="font-semibold">{risk.factors.lastFailureRecency}%</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smart-selection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GitBranch className="w-5 h-5" />
                <span>Smart Test Selection</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Enter changed file path (e.g., src/auth/login.ts)"
                    value={fileInput}
                    onChange={(e) => setFileInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addChangedFile()}
                  />
                  <Button onClick={addChangedFile}>Add File</Button>
                </div>

                {changedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Changed Files:</h4>
                    <div className="flex flex-wrap gap-2">
                      {changedFiles.map((file) => (
                        <Badge key={file} variant="secondary" className="flex items-center space-x-1">
                          <FileCode className="w-3 h-3" />
                          <span>{file}</span>
                          <button
                            onClick={() => removeChangedFile(file)}
                            className="ml-1 hover:text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {codeImpact && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Impact Analysis</h4>
                          <Badge className={{
                            'high': 'bg-red-600 text-white',
                            'medium': 'bg-yellow-500 text-white',
                            'low': 'bg-green-500 text-white'
                          }[codeImpact.riskLevel]}>
                            {codeImpact.riskLevel.toUpperCase()} RISK
                          </Badge>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Affected Components:</h5>
                          <div className="flex flex-wrap gap-2">
                            {codeImpact.affectedComponents.map((component: string) => (
                              <Badge key={component} variant="outline">{component}</Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Recommended Tests ({codeImpact.impactedTests.length}):
                          </h5>
                          <ScrollArea className="h-64">
                            <div className="space-y-2">
                              {codeImpact.impactedTests.map((test: any) => (
                                <div key={test.testCaseId} className="p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h6 className="font-medium">{test.testName}</h6>
                                      <p className="text-sm text-gray-600">{test.reason}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Progress value={test.confidence} className="w-20 h-2" />
                                      <span className="text-sm font-medium">{test.confidence}%</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Test Failure Predictions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {predictions.map((prediction) => (
                    <Card key={prediction.testCaseId} className={`border-l-4 ${
                      prediction.predictedOutcome === 'fail' ? 'border-l-red-500' : 'border-l-green-500'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{prediction.testName}</h4>
                            <div className="flex items-center space-x-4 mt-2">
                              <Badge className={prediction.predictedOutcome === 'fail' ? 
                                'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }>
                                {prediction.predictedOutcome === 'fail' ? (
                                  <><XCircle className="w-3 h-3 mr-1" /> LIKELY TO FAIL</>
                                ) : (
                                  <><CheckCircle className="w-3 h-3 mr-1" /> LIKELY TO PASS</>
                                )}
                              </Badge>
                              <span className="text-sm font-medium">
                                Confidence: {prediction.confidence}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {prediction.riskFactors.length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Risk Factors:</h5>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                              {prediction.riskFactors.map((factor, idx) => (
                                <li key={idx}>{factor}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {prediction.similarFailures.length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Similar Failures:</h5>
                            <div className="space-y-1">
                              {prediction.similarFailures.map((failure, idx) => (
                                <div key={idx} className="text-sm text-gray-600">
                                  <Bug className="w-3 h-3 inline mr-1" />
                                  {failure.pattern} - {new Date(failure.date).toLocaleDateString()}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimal-order" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Optimal Test Execution Order</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {optimalOrder && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-600">Total Execution Time</p>
                            <p className="text-xl font-bold text-blue-600">
                              {formatDuration(optimalOrder.estimatedTotalTime)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-purple-50">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Target className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="text-sm text-gray-600">Expected Failure Detection</p>
                            <p className="text-xl font-bold text-purple-600">
                              {formatDuration(optimalOrder.expectedFailureDetectionTime)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {optimalOrder.orderedTests.map((test, index) => (
                        <div key={test.testCaseId} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-sm font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium">{test.testName}</h5>
                            <p className="text-sm text-gray-600">{test.reason}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{formatDuration(test.estimatedDuration)}</div>
                            <div className="text-xs text-gray-500">
                              {test.failureProbability}% fail chance
                            </div>
                          </div>
                          <div className="flex items-center">
                            {index === 0 ? (
                              <Lightbulb className="w-5 h-5 text-yellow-500" />
                            ) : test.priority > 80 ? (
                              <ArrowUp className="w-5 h-5 text-green-500" />
                            ) : (
                              <ArrowDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}