import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  Shield,
  Zap,
  BarChart3,
  Users,
  Lock,
  Target,
  TrendingUp,
  AlertCircle,
  Play,
  Pause,
  Settings,
  GitBranch,
  Rocket
} from "lucide-react";

interface QualityGatesProps {
  projectId?: number;
}

interface QualityGate {
  id: string;
  name: string;
  description: string;
  category: 'security' | 'performance' | 'quality' | 'coverage' | 'compliance';
  status: 'passed' | 'failed' | 'warning' | 'pending';
  score: number;
  threshold: number;
  weight: number;
  details: string[];
  lastUpdated: Date;
  trend: 'up' | 'down' | 'stable';
  blocking: boolean;
}

interface DeploymentReadiness {
  overallScore: number;
  readyToDeploy: boolean;
  blockingIssues: number;
  warningIssues: number;
  lastAssessment: Date;
  estimatedRisk: 'low' | 'medium' | 'high';
}

export default function QualityGates({ projectId }: QualityGatesProps) {
  const [selectedEnvironment, setSelectedEnvironment] = useState<'staging' | 'production'>('staging');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock quality gates data - in production this would come from API
  const mockQualityGates: QualityGate[] = [
    {
      id: 'test-coverage',
      name: 'Code Coverage',
      description: 'Minimum test coverage threshold',
      category: 'coverage',
      status: 'passed',
      score: 87.5,
      threshold: 80,
      weight: 20,
      details: [
        'Line coverage: 87.5% (target: 80%)',
        'Branch coverage: 82.3%',
        'Function coverage: 94.1%',
        'Uncovered files: 3'
      ],
      lastUpdated: new Date(Date.now() - 300000),
      trend: 'up',
      blocking: true
    },
    {
      id: 'security-scan',
      name: 'Security Vulnerabilities',
      description: 'No critical security vulnerabilities',
      category: 'security',
      status: 'warning',
      score: 75,
      threshold: 90,
      weight: 30,
      details: [
        'Critical vulnerabilities: 0',
        'High vulnerabilities: 2',
        'Medium vulnerabilities: 5',
        'Dependencies scanned: 247'
      ],
      lastUpdated: new Date(Date.now() - 600000),
      trend: 'down',
      blocking: false
    },
    {
      id: 'performance-tests',
      name: 'Performance Benchmarks',
      description: 'API response times within limits',
      category: 'performance',
      status: 'passed',
      score: 92,
      threshold: 85,
      weight: 25,
      details: [
        'Average response time: 145ms (target: <200ms)',
        'P95 response time: 298ms',
        'Error rate: 0.02%',
        'Throughput: 1,240 req/min'
      ],
      lastUpdated: new Date(Date.now() - 180000),
      trend: 'stable',
      blocking: true
    },
    {
      id: 'code-quality',
      name: 'Code Quality Score',
      description: 'Maintainability and technical debt',
      category: 'quality',
      status: 'passed',
      score: 88,
      threshold: 75,
      weight: 15,
      details: [
        'Maintainability: A',
        'Technical debt: 2.1 hours',
        'Code smells: 12',
        'Duplicated lines: 1.2%'
      ],
      lastUpdated: new Date(Date.now() - 900000),
      trend: 'up',
      blocking: false
    },
    {
      id: 'accessibility',
      name: 'Accessibility Compliance',
      description: 'WCAG 2.1 AA compliance',
      category: 'compliance',
      status: 'failed',
      score: 65,
      threshold: 85,
      weight: 10,
      details: [
        'WCAG violations: 8',
        'Color contrast issues: 3',
        'Missing alt text: 2',
        'Keyboard navigation: 3 issues'
      ],
      lastUpdated: new Date(Date.now() - 1200000),
      trend: 'down',
      blocking: true
    }
  ];

  const calculateDeploymentReadiness = (): DeploymentReadiness => {
    const totalWeight = mockQualityGates.reduce((sum, gate) => sum + gate.weight, 0);
    const weightedScore = mockQualityGates.reduce((sum, gate) => sum + (gate.score * gate.weight), 0);
    const overallScore = Math.round(weightedScore / totalWeight);
    
    const blockingIssues = mockQualityGates.filter(gate => gate.blocking && gate.status === 'failed').length;
    const warningIssues = mockQualityGates.filter(gate => gate.status === 'warning').length;
    
    const readyToDeploy = blockingIssues === 0 && overallScore >= 80;
    
    let estimatedRisk: 'low' | 'medium' | 'high' = 'low';
    if (blockingIssues > 0 || overallScore < 70) estimatedRisk = 'high';
    else if (warningIssues > 2 || overallScore < 85) estimatedRisk = 'medium';
    
    return {
      overallScore,
      readyToDeploy,
      blockingIssues,
      warningIssues,
      lastAssessment: new Date(),
      estimatedRisk
    };
  };

  const deploymentReadiness = calculateDeploymentReadiness();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'performance':
        return <Zap className="h-4 w-4" />;
      case 'quality':
        return <BarChart3 className="h-4 w-4" />;
      case 'coverage':
        return <Target className="h-4 w-4" />;
      case 'compliance':
        return <Lock className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quality Gates & Deployment Readiness</h2>
          <p className="text-gray-600">Automated quality checks and deployment decision support</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Environment Selector */}
          <div className="flex rounded-lg border border-gray-300 p-1">
            {(['staging', 'production'] as const).map((env) => (
              <Button
                key={env}
                variant={selectedEnvironment === env ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedEnvironment(env)}
                className="px-3 py-1 capitalize"
              >
                {env}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            Auto Refresh
          </Button>
        </div>
      </div>

      {/* Deployment Readiness Summary */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-blue-500" />
              Deployment Readiness Assessment
            </CardTitle>
            <Badge className={`${deploymentReadiness.readyToDeploy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {deploymentReadiness.readyToDeploy ? 'READY TO DEPLOY' : 'NOT READY'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{deploymentReadiness.overallScore}%</div>
              <div className="text-sm text-gray-600">Overall Quality Score</div>
              <Progress value={deploymentReadiness.overallScore} className="mt-2" />
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{deploymentReadiness.blockingIssues}</div>
              <div className="text-sm text-gray-600">Blocking Issues</div>
              <div className="text-xs text-gray-500 mt-1">Must be resolved</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{deploymentReadiness.warningIssues}</div>
              <div className="text-sm text-gray-600">Warning Issues</div>
              <div className="text-xs text-gray-500 mt-1">Recommended to fix</div>
            </div>
            
            <div className="text-center">
              <Badge className={`text-lg px-4 py-2 ${getRiskColor(deploymentReadiness.estimatedRisk)}`}>
                {deploymentReadiness.estimatedRisk.toUpperCase()} RISK
              </Badge>
              <div className="text-sm text-gray-600 mt-2">Deployment Risk</div>
            </div>
          </div>

          {!deploymentReadiness.readyToDeploy && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Deployment blocked:</strong> {deploymentReadiness.blockingIssues} quality gate(s) failed. 
                Resolve blocking issues before deploying to {selectedEnvironment}.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button 
              className={`${deploymentReadiness.readyToDeploy ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'}`}
              disabled={!deploymentReadiness.readyToDeploy}
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Deploy to {selectedEnvironment}
            </Button>
            
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configure Gates
            </Button>
            
            <Button variant="outline">
              View Deployment History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quality Gates Details */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Gates Overview</TabsTrigger>
          <TabsTrigger value="history">History & Trends</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mockQualityGates.map((gate) => (
              <Card key={gate.id} className={`${gate.blocking && gate.status === 'failed' ? 'border-red-300' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(gate.category)}
                      <CardTitle className="text-lg">{gate.name}</CardTitle>
                      {gate.blocking && (
                        <Badge variant="outline" className="text-xs">
                          BLOCKING
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(gate.trend)}
                      {getStatusIcon(gate.status)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{gate.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{gate.score}%</span>
                        <span className="text-sm text-gray-500">/ {gate.threshold}%</span>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(gate.status)}`}>
                        {gate.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Weight: {gate.weight}%</div>
                      <div className="text-xs text-gray-500">
                        Updated {gate.lastUpdated.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  <Progress 
                    value={gate.score} 
                    className={`h-2 ${gate.score >= gate.threshold ? 'bg-green-100' : 'bg-red-100'}`}
                  />
                  
                  <div className="space-y-1">
                    {gate.details.map((detail, index) => (
                      <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full" />
                        {detail}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quality Score Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockQualityGates.map((gate) => (
                    <div key={gate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(gate.category)}
                        <span className="font-medium">{gate.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{gate.score}%</span>
                        {getTrendIcon(gate.trend)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deployment History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { date: '2024-01-15', environment: 'Production', status: 'success', score: 92 },
                    { date: '2024-01-14', environment: 'Staging', status: 'success', score: 89 },
                    { date: '2024-01-13', environment: 'Staging', status: 'blocked', score: 74 },
                    { date: '2024-01-12', environment: 'Production', status: 'success', score: 88 }
                  ].map((deployment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{deployment.environment}</div>
                        <div className="text-sm text-gray-600">{deployment.date}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{deployment.score}%</span>
                        {deployment.status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle>Quality Gate Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">Configure thresholds and weights for quality gates.</p>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Quality Gates
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}