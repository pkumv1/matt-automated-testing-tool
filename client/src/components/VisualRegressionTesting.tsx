import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Camera, 
  Monitor, 
  Smartphone, 
  Tablet,
  Sun,
  Moon,
  Contrast,
  Globe,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Settings,
  Layers,
  Grid,
  Maximize,
  Minimize
} from "lucide-react";

interface VisualTestResult {
  testId: string;
  name: string;
  browser: string;
  viewport: string;
  theme: string;
  status: 'passed' | 'failed' | 'new' | 'updated';
  screenshots: {
    baseline?: string;
    current: string;
    diff?: string;
  };
  diffResults?: {
    diffPercentage: number;
    passed: boolean;
    aiAnalysis?: {
      significantChanges: boolean;
      changeDescription: string;
      acceptableChange: boolean;
      confidence: number;
      detectedElements: any[];
      recommendations: string[];
    };
  };
  timestamp: Date;
  duration: number;
}

interface VisualRegressionTestingProps {
  projectId: number;
  targetUrl?: string;
}

export const VisualRegressionTesting: React.FC<VisualRegressionTestingProps> = ({ 
  projectId, 
  targetUrl = 'https://example.com' 
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('configure');
  const [selectedBrowsers, setSelectedBrowsers] = useState(['chrome', 'firefox']);
  const [selectedViewports, setSelectedViewports] = useState(['desktop', 'mobile']);
  const [selectedThemes, setSelectedThemes] = useState(['light', 'dark']);
  const [aiDiffThreshold, setAiDiffThreshold] = useState(5);
  const [testComponents, setTestComponents] = useState(false);
  const [selectedResult, setSelectedResult] = useState<VisualTestResult | null>(null);
  const [compareMode, setCompareMode] = useState<'side-by-side' | 'overlay' | 'diff'>('side-by-side');

  // Mock test results for demonstration
  const mockResults: VisualTestResult[] = [
    {
      testId: 'chrome-desktop-light',
      name: 'Chrome Desktop Light',
      browser: 'chrome',
      viewport: 'desktop',
      theme: 'light',
      status: 'passed',
      screenshots: {
        baseline: '/visual-baselines/chrome-desktop-light.png',
        current: '/visual-screenshots/chrome-desktop-light.png'
      },
      diffResults: {
        diffPercentage: 0.2,
        passed: true,
        aiAnalysis: {
          significantChanges: false,
          changeDescription: 'Minor sub-pixel rendering differences detected',
          acceptableChange: true,
          confidence: 98,
          detectedElements: [],
          recommendations: ['No action required']
        }
      },
      timestamp: new Date(),
      duration: 3245
    },
    {
      testId: 'chrome-mobile-dark',
      name: 'Chrome Mobile Dark',
      browser: 'chrome',
      viewport: 'mobile',
      theme: 'dark',
      status: 'failed',
      screenshots: {
        baseline: '/visual-baselines/chrome-mobile-dark.png',
        current: '/visual-screenshots/chrome-mobile-dark.png',
        diff: '/visual-diffs/chrome-mobile-dark-diff.png'
      },
      diffResults: {
        diffPercentage: 12.5,
        passed: false,
        aiAnalysis: {
          significantChanges: true,
          changeDescription: 'Button styling changed, navigation menu color different',
          acceptableChange: false,
          confidence: 85,
          detectedElements: [
            { type: 'button', changeType: 'styled' },
            { type: 'nav', changeType: 'styled' }
          ],
          recommendations: [
            'Review button styling changes',
            'Check navigation menu dark mode styles'
          ]
        }
      },
      timestamp: new Date(),
      duration: 4567
    }
  ];

  // Execute visual tests mutation
  const executeTests = useMutation({
    mutationFn: async () => {
      const config = {
        browsers: selectedBrowsers.map(name => ({ name })),
        viewports: getViewportConfigs(selectedViewports),
        themes: getThemeConfigs(selectedThemes),
        aiDiffThreshold,
        components: testComponents ? getComponentConfigs() : undefined
      };

      const response = await fetch('/api/visual-testing/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          url: targetUrl,
          config
        })
      });

      if (!response.ok) {
        throw new Error('Failed to execute visual tests');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Visual tests completed",
        description: `Executed ${data.results.length} visual tests`,
        duration: 5000
      });
      setActiveTab('results');
    },
    onError: (error) => {
      toast({
        title: "Test execution failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Test dark mode mutation
  const testDarkMode = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/visual-testing/dark-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          url: targetUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to test dark mode');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Dark mode tests completed",
        description: `Tested across ${data.results.length} configurations`,
        duration: 5000
      });
    }
  });

  const getViewportConfigs = (viewports: string[]) => {
    const configs = {
      desktop: { name: 'desktop', width: 1920, height: 1080 },
      tablet: { name: 'tablet', width: 768, height: 1024 },
      mobile: { name: 'mobile', width: 375, height: 667 }
    };
    return viewports.map(v => configs[v]);
  };

  const getThemeConfigs = (themes: string[]) => {
    const configs = {
      light: { name: 'light' as const, className: 'light-theme' },
      dark: { name: 'dark' as const, className: 'dark-theme' },
      'high-contrast': { name: 'high-contrast' as const, className: 'high-contrast-theme' }
    };
    return themes.map(t => configs[t]);
  };

  const getComponentConfigs = () => [
    {
      selector: '.hero-section',
      name: 'Hero Section',
      states: [
        { name: 'default', setup: '' },
        { name: 'hover', setup: 'document.querySelector(".hero-button").classList.add("hover")' }
      ]
    },
    {
      selector: '.navigation',
      name: 'Navigation',
      states: [
        { name: 'collapsed', setup: '' },
        { name: 'expanded', setup: 'document.querySelector(".nav-toggle").click()' }
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'new':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'updated':
        return <RefreshCw className="h-5 w-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const getBrowserIcon = (browser: string) => {
    switch (browser) {
      case 'chrome':
        return <Globe className="h-4 w-4" />;
      case 'firefox':
        return <Globe className="h-4 w-4" />;
      case 'safari':
        return <Globe className="h-4 w-4" />;
      case 'edge':
        return <Globe className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getViewportIcon = (viewport: string) => {
    switch (viewport) {
      case 'desktop':
        return <Monitor className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'high-contrast':
        return <Contrast className="h-4 w-4" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  const renderConfiguration = () => (
    <div className="space-y-6">
      {/* Target URL */}
      <div>
        <Label htmlFor="target-url">Target URL</Label>
        <Input
          id="target-url"
          type="url"
          value={targetUrl}
          className="mt-1"
          readOnly
        />
      </div>

      {/* Browser Selection */}
      <div>
        <Label>Browsers</Label>
        <div className="mt-2 space-y-2">
          {['chrome', 'firefox', 'safari', 'edge'].map(browser => (
            <div key={browser} className="flex items-center space-x-2">
              <Checkbox
                id={browser}
                checked={selectedBrowsers.includes(browser)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedBrowsers([...selectedBrowsers, browser]);
                  } else {
                    setSelectedBrowsers(selectedBrowsers.filter(b => b !== browser));
                  }
                }}
              />
              <Label 
                htmlFor={browser} 
                className="flex items-center gap-2 cursor-pointer"
              >
                {getBrowserIcon(browser)}
                {browser.charAt(0).toUpperCase() + browser.slice(1)}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Viewport Selection */}
      <div>
        <Label>Viewports</Label>
        <div className="mt-2 space-y-2">
          {['desktop', 'tablet', 'mobile'].map(viewport => (
            <div key={viewport} className="flex items-center space-x-2">
              <Checkbox
                id={viewport}
                checked={selectedViewports.includes(viewport)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedViewports([...selectedViewports, viewport]);
                  } else {
                    setSelectedViewports(selectedViewports.filter(v => v !== viewport));
                  }
                }}
              />
              <Label 
                htmlFor={viewport} 
                className="flex items-center gap-2 cursor-pointer"
              >
                {getViewportIcon(viewport)}
                {viewport.charAt(0).toUpperCase() + viewport.slice(1)}
                <span className="text-xs text-muted-foreground">
                  {viewport === 'desktop' && '(1920x1080)'}
                  {viewport === 'tablet' && '(768x1024)'}
                  {viewport === 'mobile' && '(375x667)'}
                </span>
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Theme Selection */}
      <div>
        <Label>Themes</Label>
        <div className="mt-2 space-y-2">
          {['light', 'dark', 'high-contrast'].map(theme => (
            <div key={theme} className="flex items-center space-x-2">
              <Checkbox
                id={theme}
                checked={selectedThemes.includes(theme)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedThemes([...selectedThemes, theme]);
                  } else {
                    setSelectedThemes(selectedThemes.filter(t => t !== theme));
                  }
                }}
              />
              <Label 
                htmlFor={theme} 
                className="flex items-center gap-2 cursor-pointer"
              >
                {getThemeIcon(theme)}
                {theme.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* AI Diff Threshold */}
      <div>
        <Label htmlFor="ai-threshold">
          AI Diff Threshold: {aiDiffThreshold}%
        </Label>
        <Slider
          id="ai-threshold"
          min={1}
          max={20}
          step={1}
          value={[aiDiffThreshold]}
          onValueChange={(value) => setAiDiffThreshold(value[0])}
          className="mt-2"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Changes below {aiDiffThreshold}% will be automatically approved by AI
        </p>
      </div>

      {/* Component Testing */}
      <div className="flex items-center space-x-2">
        <Switch
          id="component-testing"
          checked={testComponents}
          onCheckedChange={setTestComponents}
        />
        <Label htmlFor="component-testing">
          Enable component-level visual testing
        </Label>
      </div>

      {/* Execute Tests */}
      <div className="flex gap-2">
        <Button 
          onClick={() => executeTests.mutate()}
          disabled={executeTests.isPending || 
                   selectedBrowsers.length === 0 || 
                   selectedViewports.length === 0 ||
                   selectedThemes.length === 0}
        >
          {executeTests.isPending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Execute Visual Tests
            </>
          )}
        </Button>
        <Button 
          variant="outline"
          onClick={() => testDarkMode.mutate()}
          disabled={testDarkMode.isPending}
        >
          {testDarkMode.isPending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              Test Dark Mode
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockResults.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {mockResults.filter(r => r.status === 'passed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {mockResults.filter(r => r.status === 'failed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((mockResults.filter(r => r.status === 'passed').length / mockResults.length) * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {mockResults.map((result) => (
                <Card 
                  key={result.testId} 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setSelectedResult(result)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{result.name}</span>
                            <div className="flex items-center gap-1">
                              {getBrowserIcon(result.browser)}
                              {getViewportIcon(result.viewport)}
                              {getThemeIcon(result.theme)}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Duration: {result.duration}ms
                            {result.diffResults && (
                              <> • Diff: {result.diffResults.diffPercentage.toFixed(2)}%</>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.diffResults?.aiAnalysis && (
                          <Badge variant={result.diffResults.aiAnalysis.acceptableChange ? "secondary" : "destructive"}>
                            AI: {result.diffResults.aiAnalysis.confidence}% confident
                          </Badge>
                        )}
                        <Button size="sm" variant="ghost">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const renderImageComparison = () => {
    if (!selectedResult) return null;

    return (
      <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>{selectedResult.name}</DialogTitle>
            <DialogDescription>
              Visual comparison for {selectedResult.browser} - {selectedResult.viewport} - {selectedResult.theme}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Comparison Mode Selector */}
            <div className="flex items-center gap-2">
              <Label>View Mode:</Label>
              <Select value={compareMode} onValueChange={(value: any) => setCompareMode(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="side-by-side">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Side by Side
                    </div>
                  </SelectItem>
                  <SelectItem value="overlay">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Overlay
                    </div>
                  </SelectItem>
                  <SelectItem value="diff">
                    <div className="flex items-center gap-2">
                      <Grid className="h-4 w-4" />
                      Difference
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* AI Analysis */}
            {selectedResult.diffResults?.aiAnalysis && (
              <Alert className={selectedResult.diffResults.aiAnalysis.acceptableChange ? "" : "border-red-500"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>AI Analysis</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2">
                    <p>{selectedResult.diffResults.aiAnalysis.changeDescription}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedResult.diffResults.aiAnalysis.acceptableChange ? "default" : "destructive"}>
                        {selectedResult.diffResults.aiAnalysis.acceptableChange ? "Acceptable" : "Review Required"}
                      </Badge>
                      <span className="text-sm">
                        Confidence: {selectedResult.diffResults.aiAnalysis.confidence}%
                      </span>
                    </div>
                    {selectedResult.diffResults.aiAnalysis.recommendations.length > 0 && (
                      <div>
                        <p className="font-medium text-sm mb-1">Recommendations:</p>
                        <ul className="list-disc list-inside text-sm">
                          {selectedResult.diffResults.aiAnalysis.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Image Comparison */}
            <div className="border rounded-lg overflow-hidden">
              {compareMode === 'side-by-side' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="bg-muted p-2 text-center text-sm font-medium">Baseline</div>
                    <img 
                      src={selectedResult.screenshots.baseline || '/placeholder.png'} 
                      alt="Baseline"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="bg-muted p-2 text-center text-sm font-medium">Current</div>
                    <img 
                      src={selectedResult.screenshots.current} 
                      alt="Current"
                      className="w-full"
                    />
                  </div>
                </div>
              )}
              
              {compareMode === 'overlay' && (
                <div className="relative">
                  <img 
                    src={selectedResult.screenshots.baseline || '/placeholder.png'} 
                    alt="Baseline"
                    className="w-full"
                  />
                  <img 
                    src={selectedResult.screenshots.current} 
                    alt="Current"
                    className="w-full absolute top-0 left-0 opacity-50"
                  />
                </div>
              )}
              
              {compareMode === 'diff' && selectedResult.screenshots.diff && (
                <div>
                  <div className="bg-muted p-2 text-center text-sm font-medium">
                    Difference ({selectedResult.diffResults?.diffPercentage.toFixed(2)}%)
                  </div>
                  <img 
                    src={selectedResult.screenshots.diff} 
                    alt="Difference"
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Download Images
              </Button>
              {selectedResult.status === 'failed' && (
                <Button variant="default" size="sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve as Baseline
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Visual Regression Testing</CardTitle>
          <CardDescription>
            AI-powered visual testing across browsers, viewports, and themes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="configure">Configure</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
            <TabsContent value="configure" className="mt-6">
              {renderConfiguration()}
            </TabsContent>
            <TabsContent value="results" className="mt-6">
              {renderResults()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Image Comparison Dialog */}
      {renderImageComparison()}
    </div>
  );
};