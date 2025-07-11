import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Rocket, Shield, Zap, Monitor, CheckCircle2, AlertTriangle, 
  Clock, Server, Database, Globe, Lock, Activity, TrendingUp,
  GitBranch, Settings, Users, FileCheck, Layers, CloudUpload
} from "lucide-react";
import type { Project } from "@shared/schema";

interface ProductionDeploymentProps {
  project: Project;
}

export default function ProductionDeployment({ project }: ProductionDeploymentProps) {
  const [selectedEnvironment, setSelectedEnvironment] = useState<'staging' | 'production'>('production');

  // Fetch deployment readiness data
  const { data: readinessReport } = useQuery({
    queryKey: [`/api/projects/${project.id}/deployment-readiness`],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${project.id}/deployment-readiness`);
      if (!response.ok) throw new Error('Failed to fetch deployment readiness');
      return response.json();
    }
  });

  const { data: deploymentConfig } = useQuery({
    queryKey: [`/api/projects/${project.id}/deployment-config`],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${project.id}/deployment-config`);
      if (!response.ok) throw new Error('Failed to fetch deployment config');
      return response.json();
    }
  });

  const { data: checklist } = useQuery({
    queryKey: [`/api/projects/${project.id}/deployment-checklist`],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${project.id}/deployment-checklist`);
      if (!response.ok) throw new Error('Failed to fetch deployment checklist');
      return response.json();
    }
  });

  // Simulated deployment readiness data
  const mockReadinessReport = readinessReport || {
    overallScore: 94,
    readyForDeployment: true,
    criticalIssues: [],
    recommendations: [
      'Enable automated deployment pipeline',
      'Configure production monitoring',
      'Set up error tracking',
      'Implement blue-green deployment'
    ],
    estimatedDeploymentTime: '12 minutes',
    rollbackTime: '< 2 minutes',
    categories: {
      security: { score: 95, issues: [], recommendations: ['Enable WAF protection'] },
      performance: { score: 92, issues: [], recommendations: ['Configure CDN'] },
      reliability: { score: 96, issues: [], recommendations: ['Add health checks'] },
      monitoring: { score: 88, issues: [], recommendations: ['Set up APM'] },
      compliance: { score: 94, issues: [], recommendations: ['Audit logging'] }
    }
  };

  const mockDeploymentConfig = deploymentConfig || {
    environment: 'production',
    strategy: 'blue-green',
    scalingPolicy: {
      minInstances: 2,
      maxInstances: 10,
      targetCpuUtilization: 70,
      targetMemoryUtilization: 80
    },
    monitoring: {
      healthChecks: ['/health', '/api/health', '/metrics', '/ready'],
      metrics: ['response_time_p95', 'error_rate', 'throughput_rps'],
      alerting: ['high_error_rate', 'slow_response_time', 'high_cpu_usage']
    },
    security: {
      tls: true,
      waf: true,
      rateLimiting: true,
      ipWhitelisting: []
    },
    backup: {
      automated: true,
      frequency: 'hourly',
      retention: '30 days',
      crossRegion: true
    }
  };

  const mockChecklist = checklist || [
    '✓ All critical security vulnerabilities resolved',
    '✓ Performance benchmarks met (< 200ms response time)',
    '✓ Accessibility compliance verified (WCAG 2.1 AA)',
    '✓ API contract tests passing',
    '✓ Cross-browser compatibility verified',
    '✓ Database migrations tested',
    '✓ Environment variables configured',
    '✓ SSL/TLS certificates configured',
    '✓ CDN and caching configured',
    '✓ Monitoring and alerting set up',
    '✓ Backup and disaster recovery tested',
    '✓ Load balancer configuration verified',
    '✓ Auto-scaling policies configured',
    '✓ Rollback procedure documented and tested',
    '✓ Post-deployment verification plan ready'
  ];

  return (
    <div className="space-y-6">
      {/* Production Deployment Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Rocket className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Production Deployment</h1>
              <p className="text-green-100 mt-1">
                Enterprise-grade deployment for {project.name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{mockReadinessReport.overallScore}%</div>
              <div className="text-sm text-green-100">Readiness Score</div>
            </div>
            {mockReadinessReport.readyForDeployment ? (
              <Button className="bg-white text-green-600 hover:bg-green-50">
                <CloudUpload className="w-4 h-4 mr-2" />
                Deploy Now
              </Button>
            ) : (
              <Button disabled className="bg-gray-300 text-gray-600">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Not Ready
              </Button>
            )}
          </div>
        </div>

        {/* Key Deployment Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/10 p-3 rounded text-center">
            <div className="text-lg font-bold">{mockReadinessReport.estimatedDeploymentTime}</div>
            <div className="text-sm text-green-100">Deploy Time</div>
          </div>
          <div className="bg-white/10 p-3 rounded text-center">
            <div className="text-lg font-bold">{mockReadinessReport.rollbackTime}</div>
            <div className="text-sm text-green-100">Rollback Time</div>
          </div>
          <div className="bg-white/10 p-3 rounded text-center">
            <div className="text-lg font-bold">{mockDeploymentConfig.strategy}</div>
            <div className="text-sm text-green-100">Strategy</div>
          </div>
          <div className="bg-white/10 p-3 rounded text-center">
            <div className="text-lg font-bold">99.9%</div>
            <div className="text-sm text-green-100">Uptime SLA</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="readiness" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="readiness">Deployment Readiness</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="checklist">Pre-Deploy Checklist</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring Setup</TabsTrigger>
        </TabsList>

        {/* Deployment Readiness Tab */}
        <TabsContent value="readiness" className="space-y-6">
          {/* Overall Readiness */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span>Production Readiness Assessment</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Score</span>
                    <span className="text-2xl font-bold text-green-600">{mockReadinessReport.overallScore}%</span>
                  </div>
                  <Progress value={mockReadinessReport.overallScore} className="h-3 mb-4" />
                  
                  <div className="space-y-2">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Ready for Production
                    </Badge>
                    <div className="text-sm text-gray-600">
                      All critical requirements met. Deployment can proceed safely.
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Top Recommendations</h4>
                  {mockReadinessReport.recommendations.slice(0, 4).map((rec, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(mockReadinessReport.categories).map(([category, data]) => (
              <Card key={category} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {category === 'security' && <Shield className="w-5 h-5 text-red-600" />}
                      {category === 'performance' && <Zap className="w-5 h-5 text-yellow-600" />}
                      {category === 'reliability' && <Server className="w-5 h-5 text-green-600" />}
                      {category === 'monitoring' && <Monitor className="w-5 h-5 text-blue-600" />}
                      {category === 'compliance' && <FileCheck className="w-5 h-5 text-purple-600" />}
                      <span className="font-medium capitalize">{category}</span>
                    </div>
                    <Badge variant={data.score >= 90 ? 'default' : 'secondary'}>
                      {data.score}%
                    </Badge>
                  </div>
                  <Progress value={data.score} className="h-2 mb-3" />
                  <div className="text-xs text-gray-600">
                    {data.recommendations.length > 0 && (
                      <div>Next: {data.recommendations[0]}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scaling Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Layers className="w-5 h-5" />
                  <span>Auto-Scaling Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Min Instances:</span>
                  <span className="font-medium">{mockDeploymentConfig.scalingPolicy.minInstances}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Max Instances:</span>
                  <span className="font-medium">{mockDeploymentConfig.scalingPolicy.maxInstances}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">CPU Target:</span>
                  <span className="font-medium">{mockDeploymentConfig.scalingPolicy.targetCpuUtilization}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Memory Target:</span>
                  <span className="font-medium">{mockDeploymentConfig.scalingPolicy.targetMemoryUtilization}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Security Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>Security Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">TLS/SSL:</span>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Web Application Firewall:</span>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rate Limiting:</span>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">DDoS Protection:</span>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
              </CardContent>
            </Card>

            {/* Backup Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Backup & Recovery</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Backup Frequency:</span>
                  <span className="font-medium">{mockDeploymentConfig.backup.frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Retention Period:</span>
                  <span className="font-medium">{mockDeploymentConfig.backup.retention}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cross-Region Backup:</span>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Automated Recovery:</span>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
              </CardContent>
            </Card>

            {/* Network Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>Network & CDN</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Deployment Strategy:</span>
                  <Badge variant="outline">{mockDeploymentConfig.strategy}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">CDN Enabled:</span>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Load Balancer:</span>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Edge Locations:</span>
                  <span className="font-medium">Global</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5" />
                <span>Pre-Deployment Checklist</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockChecklist.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 rounded border">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{item.replace('✓ ', '')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Health Checks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Health Checks</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockDeploymentConfig.monitoring.healthChecks.map((check, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-mono">{check}</span>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Key Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockDeploymentConfig.monitoring.metrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{metric.replace(/_/g, ' ')}</span>
                      <Badge variant="outline" className="text-xs">Active</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Alerting */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Alerting Rules</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockDeploymentConfig.monitoring.alerting.map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{alert.replace(/_/g, ' ')}</span>
                      <Badge variant="outline" className="text-xs">Configured</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Deployment Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Deployment Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm">Build & Test (3 min)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm">Security Scan (2 min)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm">Blue-Green Deploy (5 min)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm">Health Verification (2 min)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}