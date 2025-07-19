import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Download, 
  FileText, 
  Mail, 
  Calendar, 
  Settings, 
  Share,
  Clock,
  Users,
  FileSpreadsheet,
  FileImage,
  Send,
  CheckCircle,
  AlertCircle,
  Copy
} from "lucide-react";

interface AdvancedExportProps {
  projectId?: number;
  projectName?: string;
}

interface ExportConfig {
  format: 'pdf' | 'excel' | 'csv' | 'json' | 'html';
  sections: string[];
  includeCharts: boolean;
  includeRawData: boolean;
  timeRange: '7d' | '30d' | '90d' | 'all';
  customDateRange?: { start: string; end: string };
}

interface ScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  recipients: string[];
  subject: string;
  message: string;
}

export default function AdvancedExport({ projectId, projectName = "Current Project" }: AdvancedExportProps) {
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'pdf',
    sections: ['summary', 'trends', 'test-results'],
    includeCharts: true,
    includeRawData: false,
    timeRange: '30d'
  });

  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    enabled: false,
    frequency: 'weekly',
    time: '09:00',
    recipients: [],
    subject: `Weekly Test Report - ${projectName}`,
    message: 'Please find the automated test report attached.'
  });

  const [newRecipient, setNewRecipient] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');

  const availableSections = [
    { id: 'summary', label: 'Executive Summary', description: 'High-level metrics and key insights' },
    { id: 'trends', label: 'Historical Trends', description: 'Charts showing performance over time' },
    { id: 'test-results', label: 'Detailed Test Results', description: 'Individual test outcomes and details' },
    { id: 'performance', label: 'Performance Analysis', description: 'Execution times and resource usage' },
    { id: 'security', label: 'Security Assessment', description: 'Security scan results and vulnerabilities' },
    { id: 'coverage', label: 'Code Coverage', description: 'Test coverage analysis and gaps' },
    { id: 'recommendations', label: 'AI Recommendations', description: 'Suggested improvements and actions' },
    { id: 'logs', label: 'Execution Logs', description: 'Detailed execution logs and debug info' }
  ];

  const exportFormats = [
    { value: 'pdf', label: 'PDF Report', icon: FileText, description: 'Professional report with charts' },
    { value: 'excel', label: 'Excel Workbook', icon: FileSpreadsheet, description: 'Detailed data with multiple sheets' },
    { value: 'csv', label: 'CSV Data', icon: FileSpreadsheet, description: 'Raw data for analysis' },
    { value: 'json', label: 'JSON Export', icon: FileText, description: 'Structured data for APIs' },
    { value: 'html', label: 'HTML Report', icon: FileImage, description: 'Interactive web report' }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('exporting');
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate mock file based on format
      const fileName = `test-report-${projectName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.${exportConfig.format}`;
      
      // Create download link (in real implementation, this would be actual file content)
      const mockContent = generateMockExportContent();
      const blob = new Blob([mockContent], { 
        type: exportConfig.format === 'pdf' ? 'application/pdf' : 
              exportConfig.format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
              exportConfig.format === 'json' ? 'application/json' :
              exportConfig.format === 'html' ? 'text/html' : 'text/csv'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      
      setExportStatus('success');
      
      // Send email if recipients are configured
      if (scheduleConfig.recipients.length > 0) {
        await sendReportEmail();
      }
      
    } catch (error) {
      setExportStatus('error');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  };

  const generateMockExportContent = (): string => {
    const timestamp = new Date().toISOString();
    
    if (exportConfig.format === 'json') {
      return JSON.stringify({
        report: {
          projectName,
          generatedAt: timestamp,
          timeRange: exportConfig.timeRange,
          sections: exportConfig.sections,
          summary: {
            totalTests: 156,
            passedTests: 142,
            failedTests: 14,
            successRate: 91.03,
            avgExecutionTime: 234.5,
            coverage: 87.2
          },
          trends: "Historical trend data would be included here",
          testResults: "Detailed test results would be included here"
        }
      }, null, 2);
    }
    
    if (exportConfig.format === 'csv') {
      return [
        'Date,Total Tests,Passed,Failed,Success Rate,Execution Time,Coverage',
        '2024-01-15,156,142,14,91.03,234.5,87.2',
        '2024-01-14,154,140,14,90.91,245.1,86.8',
        '2024-01-13,152,138,14,90.79,239.7,87.1'
      ].join('\n');
    }
    
    // HTML format
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Test Report - ${projectName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #3B82F6; padding-bottom: 20px; margin-bottom: 30px; }
        .metric { display: inline-block; margin: 10px 20px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #3B82F6; }
        .metric-label { font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Automated Test Report</h1>
        <p><strong>Project:</strong> ${projectName}</p>
        <p><strong>Generated:</strong> ${timestamp}</p>
    </div>
    
    <div class="summary">
        <h2>Executive Summary</h2>
        <div class="metric">
            <div class="metric-value">91.03%</div>
            <div class="metric-label">Success Rate</div>
        </div>
        <div class="metric">
            <div class="metric-value">156</div>
            <div class="metric-label">Total Tests</div>
        </div>
        <div class="metric">
            <div class="metric-value">234.5s</div>
            <div class="metric-label">Avg Execution</div>
        </div>
        <div class="metric">
            <div class="metric-value">87.2%</div>
            <div class="metric-label">Coverage</div>
        </div>
    </div>
    
    <h2>Test Results Summary</h2>
    <p>This report includes ${exportConfig.sections.length} sections: ${exportConfig.sections.join(', ')}</p>
</body>
</html>
    `;
  };

  const sendReportEmail = async () => {
    // Mock email sending
    console.log('Sending report to:', scheduleConfig.recipients);
    // In real implementation, this would call an API endpoint
  };

  const addRecipient = () => {
    if (newRecipient && !scheduleConfig.recipients.includes(newRecipient)) {
      setScheduleConfig(prev => ({
        ...prev,
        recipients: [...prev.recipients, newRecipient]
      }));
      setNewRecipient('');
    }
  };

  const removeRecipient = (email: string) => {
    setScheduleConfig(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email)
    }));
  };

  const toggleSection = (sectionId: string) => {
    setExportConfig(prev => ({
      ...prev,
      sections: prev.sections.includes(sectionId)
        ? prev.sections.filter(s => s !== sectionId)
        : [...prev.sections, sectionId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Export & Reporting</h2>
          <p className="text-gray-600">Generate comprehensive reports and schedule automated delivery</p>
        </div>
        
        <div className="flex items-center gap-3">
          {exportStatus === 'success' && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Export Complete
            </Badge>
          )}
          {exportStatus === 'error' && (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              Export Failed
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="export" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="export">Export Configuration</TabsTrigger>
          <TabsTrigger value="schedule">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
        </TabsList>

        {/* Export Configuration */}
        <TabsContent value="export" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Format Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Format
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {exportFormats.map((format) => {
                    const IconComponent = format.icon;
                    return (
                      <div
                        key={format.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          exportConfig.format === format.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setExportConfig(prev => ({ ...prev, format: format.value as any }))}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium">{format.label}</p>
                            <p className="text-sm text-gray-600">{format.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Report Sections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Report Sections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {availableSections.map((section) => (
                    <div key={section.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={section.id}
                        checked={exportConfig.sections.includes(section.id)}
                        onCheckedChange={() => toggleSection(section.id)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor={section.id} className="font-medium cursor-pointer">
                          {section.label}
                        </Label>
                        <p className="text-xs text-gray-600">{section.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Time Range</Label>
                  <Select 
                    value={exportConfig.timeRange} 
                    onValueChange={(value: any) => setExportConfig(prev => ({ ...prev, timeRange: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="include-charts"
                    checked={exportConfig.includeCharts}
                    onCheckedChange={(checked) => setExportConfig(prev => ({ ...prev, includeCharts: checked }))}
                  />
                  <Label htmlFor="include-charts">Include Charts</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="include-raw-data"
                    checked={exportConfig.includeRawData}
                    onCheckedChange={(checked) => setExportConfig(prev => ({ ...prev, includeRawData: checked }))}
                  />
                  <Label htmlFor="include-raw-data">Include Raw Data</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleExport}
                    disabled={isExporting || exportConfig.sections.length === 0}
                    className="w-full"
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Reports */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Automated Report Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enable-scheduling"
                  checked={scheduleConfig.enabled}
                  onCheckedChange={(checked) => setScheduleConfig(prev => ({ ...prev, enabled: checked }))}
                />
                <Label htmlFor="enable-scheduling" className="font-medium">
                  Enable Scheduled Reports
                </Label>
              </div>

              {scheduleConfig.enabled && (
                <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select 
                        value={scheduleConfig.frequency} 
                        onValueChange={(value: any) => setScheduleConfig(prev => ({ ...prev, frequency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={scheduleConfig.time}
                        onChange={(e) => setScheduleConfig(prev => ({ ...prev, time: e.target.value }))}
                      />
                    </div>

                    {scheduleConfig.frequency === 'weekly' && (
                      <div className="space-y-2">
                        <Label>Day of Week</Label>
                        <Select 
                          value={scheduleConfig.dayOfWeek?.toString()} 
                          onValueChange={(value) => setScheduleConfig(prev => ({ ...prev, dayOfWeek: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Monday</SelectItem>
                            <SelectItem value="2">Tuesday</SelectItem>
                            <SelectItem value="3">Wednesday</SelectItem>
                            <SelectItem value="4">Thursday</SelectItem>
                            <SelectItem value="5">Friday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email Recipients</Label>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="Enter email address"
                          value={newRecipient}
                          onChange={(e) => setNewRecipient(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addRecipient()}
                        />
                        <Button onClick={addRecipient} variant="outline" size="sm">
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {scheduleConfig.recipients.map((email) => (
                          <Badge key={email} variant="secondary" className="flex items-center gap-1">
                            {email}
                            <button
                              onClick={() => removeRecipient(email)}
                              className="ml-1 text-gray-500 hover:text-gray-700"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Email Subject</Label>
                      <Input
                        value={scheduleConfig.subject}
                        onChange={(e) => setScheduleConfig(prev => ({ ...prev, subject: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Email Message</Label>
                      <Textarea
                        value={scheduleConfig.message}
                        onChange={(e) => setScheduleConfig(prev => ({ ...prev, message: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report Templates */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Executive Summary', description: 'High-level overview for stakeholders' },
              { name: 'Technical Deep Dive', description: 'Detailed technical analysis' },
              { name: 'Security Assessment', description: 'Focus on security findings' },
              { name: 'Performance Report', description: 'Performance metrics and trends' },
              { name: 'Quality Gates', description: 'Deployment readiness assessment' }
            ].map((template) => (
              <Card key={template.name} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-sm text-gray-600">{template.description}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Copy className="h-3 w-3 mr-1" />
                        Use Template
                      </Button>
                      <Button size="sm" variant="ghost">
                        Preview
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}