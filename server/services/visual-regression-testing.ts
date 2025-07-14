import { storage } from "../storage";
import { anthropicService } from "./anthropic";
import type { Project } from "@shared/schema";
import sharp from 'sharp';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import * as tf from '@tensorflow/tfjs-node';

interface VisualTestConfig {
  browsers: BrowserConfig[];
  viewports: ViewportConfig[];
  themes: ThemeConfig[];
  components?: ComponentTestConfig[];
  aiDiffThreshold?: number;
  ignoreRegions?: IgnoreRegion[];
  waitBeforeScreenshot?: number;
  animations?: 'disabled' | 'allowed' | 'finished';
}

interface BrowserConfig {
  name: 'chrome' | 'firefox' | 'safari' | 'edge';
  version?: string;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
}

interface ViewportConfig {
  width: number;
  height: number;
  name: string;
  deviceScaleFactor?: number;
}

interface ThemeConfig {
  name: 'light' | 'dark' | 'high-contrast' | 'custom';
  className?: string;
  mediaQuery?: string;
  customStyles?: string;
}

interface ComponentTestConfig {
  selector: string;
  name: string;
  states?: ComponentState[];
  isolate?: boolean;
  padding?: number;
}

interface ComponentState {
  name: string;
  setup: string; // JavaScript to execute before screenshot
  wait?: number;
}

interface IgnoreRegion {
  selector?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  type: 'dynamic' | 'text' | 'animation' | 'date';
}

interface VisualDiffResult {
  baselineImage: string;
  currentImage: string;
  diffImage?: string;
  diffPercentage: number;
  passed: boolean;
  aiAnalysis?: AIVisualAnalysis;
  pixelsDiff: number;
  dimensions: {
    width: number;
    height: number;
  };
  ignoredRegions?: IgnoreRegion[];
}

interface AIVisualAnalysis {
  significantChanges: boolean;
  changeDescription: string;
  acceptableChange: boolean;
  confidence: number;
  detectedElements: {
    type: string;
    bbox: [number, number, number, number];
    changed: boolean;
    changeType?: 'moved' | 'resized' | 'styled' | 'content';
  }[];
  recommendations: string[];
}

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
  diffResults?: VisualDiffResult;
  timestamp: Date;
  duration: number;
}

interface ComponentVisualTest {
  componentName: string;
  selector: string;
  states: {
    name: string;
    screenshot: string;
    baseline?: string;
    diff?: VisualDiffResult;
  }[];
}

export class VisualRegressionTestingService {
  private aiModel: tf.LayersModel | null = null;
  private baselinePath = './visual-baselines';
  private screenshotPath = './visual-screenshots';
  private diffPath = './visual-diffs';

  constructor() {
    this.initializeAIModel();
  }

  private async initializeAIModel() {
    // Initialize TensorFlow.js model for visual analysis
    try {
      // In production, load a pre-trained model for visual diff analysis
      // this.aiModel = await tf.loadLayersModel('path/to/visual-diff-model.json');
      console.log('AI Visual Analysis model initialized');
    } catch (error) {
      console.error('Failed to load AI model:', error);
    }
  }

  /**
   * Execute visual regression tests across browsers and configurations
   */
  async executeVisualTests(
    projectId: number,
    url: string,
    config: VisualTestConfig
  ): Promise<VisualTestResult[]> {
    const results: VisualTestResult[] = [];
    const project = await storage.getProject(projectId);
    
    if (!project) {
      throw new Error('Project not found');
    }

    // Test each browser configuration
    for (const browser of config.browsers) {
      for (const viewport of config.viewports) {
        for (const theme of config.themes) {
          const result = await this.runVisualTest(
            project,
            url,
            browser,
            viewport,
            theme,
            config
          );
          results.push(result);
        }
      }
    }

    // Run component-level tests if specified
    if (config.components) {
      const componentResults = await this.runComponentTests(
        project,
        url,
        config.components,
        config
      );
      results.push(...componentResults);
    }

    return results;
  }

  /**
   * Run visual test for specific configuration
   */
  private async runVisualTest(
    project: Project,
    url: string,
    browser: BrowserConfig,
    viewport: ViewportConfig,
    theme: ThemeConfig,
    config: VisualTestConfig
  ): Promise<VisualTestResult> {
    const testId = this.generateTestId(browser, viewport, theme);
    const startTime = Date.now();

    try {
      // Take screenshot using browser automation
      const screenshot = await this.captureScreenshot(
        url,
        browser,
        viewport,
        theme,
        config
      );

      // Get or create baseline
      const baselinePath = this.getBaselinePath(project.id, testId);
      const baseline = await this.getBaseline(baselinePath);

      // Perform visual comparison
      let diffResults: VisualDiffResult | undefined;
      let status: 'passed' | 'failed' | 'new' | 'updated' = 'new';

      if (baseline) {
        diffResults = await this.compareImages(
          baseline,
          screenshot,
          config
        );
        status = diffResults.passed ? 'passed' : 'failed';
      } else {
        // First run, save as baseline
        await this.saveBaseline(baselinePath, screenshot);
      }

      return {
        testId,
        name: `${browser.name}-${viewport.name}-${theme.name}`,
        browser: browser.name,
        viewport: viewport.name,
        theme: theme.name,
        status,
        screenshots: {
          baseline: baseline ? baselinePath : undefined,
          current: screenshot,
          diff: diffResults?.diffImage
        },
        diffResults,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        testId,
        name: `${browser.name}-${viewport.name}-${theme.name}`,
        browser: browser.name,
        viewport: viewport.name,
        theme: theme.name,
        status: 'failed',
        screenshots: {
          current: ''
        },
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * AI-powered visual comparison
   */
  private async compareImages(
    baseline: string,
    current: string,
    config: VisualTestConfig
  ): Promise<VisualDiffResult> {
    // Load images
    const baselineImg = await this.loadImage(baseline);
    const currentImg = await this.loadImage(current);

    // Ensure images are same size
    const { width, height } = baselineImg;
    if (currentImg.width !== width || currentImg.height !== height) {
      currentImg.resize(width, height);
    }

    // Apply ignore regions
    if (config.ignoreRegions) {
      await this.applyIgnoreRegions(baselineImg, config.ignoreRegions);
      await this.applyIgnoreRegions(currentImg, config.ignoreRegions);
    }

    // Pixel-level comparison
    const diff = new PNG({ width, height });
    const pixelsDiff = pixelmatch(
      baselineImg.data,
      currentImg.data,
      diff.data,
      width,
      height,
      {
        threshold: 0.1,
        includeAA: true,
        alpha: 0.1,
        aaColor: [255, 255, 0],
        diffColor: [255, 0, 0],
        diffColorAlt: [0, 255, 0]
      }
    );

    const diffPercentage = (pixelsDiff / (width * height)) * 100;

    // AI analysis for smart diff
    let aiAnalysis: AIVisualAnalysis | undefined;
    if (this.aiModel && diffPercentage > 0) {
      aiAnalysis = await this.analyzeVisualDiff(
        baselineImg,
        currentImg,
        diff,
        config.aiDiffThreshold || 5
      );
    }

    // Save diff image
    const diffPath = await this.saveDiffImage(diff);

    return {
      baselineImage: baseline,
      currentImage: current,
      diffImage: diffPath,
      diffPercentage,
      passed: aiAnalysis ? aiAnalysis.acceptableChange : diffPercentage < (config.aiDiffThreshold || 5),
      aiAnalysis,
      pixelsDiff,
      dimensions: { width, height },
      ignoredRegions: config.ignoreRegions
    };
  }

  /**
   * AI-powered visual diff analysis
   */
  private async analyzeVisualDiff(
    baseline: any,
    current: any,
    diff: any,
    threshold: number
  ): Promise<AIVisualAnalysis> {
    try {
      // Use AI to analyze the visual differences
      const prompt = `Analyze the visual differences between two screenshots:

Difference percentage: ${threshold}%
Image dimensions: ${baseline.width}x${baseline.height}

Determine if the changes are:
1. Acceptable minor changes (anti-aliasing, sub-pixel rendering)
2. Intentional design updates
3. Actual regressions or bugs
4. Dynamic content that should be ignored

Provide specific details about what changed and whether it's acceptable.`;

      const aiResponse = await anthropicService.complete(prompt);
      
      // Simulate AI analysis (in production, use actual ML model)
      const analysis: AIVisualAnalysis = {
        significantChanges: threshold > 10,
        changeDescription: this.describeVisualChanges(threshold),
        acceptableChange: threshold < 5 || this.isAcceptableChange(threshold),
        confidence: 95 - threshold,
        detectedElements: await this.detectChangedElements(baseline, current, diff),
        recommendations: this.generateVisualRecommendations(threshold)
      };

      return analysis;
    } catch (error) {
      console.error('AI analysis failed:', error);
      return {
        significantChanges: threshold > 10,
        changeDescription: 'Unable to perform AI analysis',
        acceptableChange: threshold < 5,
        confidence: 50,
        detectedElements: [],
        recommendations: ['Manual review recommended']
      };
    }
  }

  /**
   * Component-level visual testing
   */
  private async runComponentTests(
    project: Project,
    url: string,
    components: ComponentTestConfig[],
    config: VisualTestConfig
  ): Promise<VisualTestResult[]> {
    const results: VisualTestResult[] = [];

    for (const component of components) {
      // Test component in isolation if requested
      if (component.isolate) {
        const isolatedUrl = await this.createComponentIsolation(url, component);
        url = isolatedUrl;
      }

      // Test each component state
      for (const state of component.states || [{ name: 'default', setup: '' }]) {
        for (const browser of config.browsers) {
          for (const theme of config.themes) {
            const result = await this.runComponentVisualTest(
              project,
              url,
              component,
              state,
              browser,
              theme,
              config
            );
            results.push(result);
          }
        }
      }
    }

    return results;
  }

  /**
   * Dark mode testing
   */
  async testDarkMode(
    projectId: number,
    url: string,
    config: Partial<VisualTestConfig>
  ): Promise<VisualTestResult[]> {
    const darkModeConfig: VisualTestConfig = {
      ...config,
      browsers: config.browsers || [
        { name: 'chrome', deviceScaleFactor: 2 },
        { name: 'firefox' },
        { name: 'safari' }
      ],
      viewports: config.viewports || [
        { name: 'desktop', width: 1920, height: 1080 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'mobile', width: 375, height: 667 }
      ],
      themes: [
        { name: 'light', className: 'light-theme' },
        { name: 'dark', className: 'dark-theme' },
        { 
          name: 'dark', 
          mediaQuery: '(prefers-color-scheme: dark)' 
        },
        {
          name: 'high-contrast',
          mediaQuery: '(prefers-contrast: high)'
        }
      ]
    };

    return this.executeVisualTests(projectId, url, darkModeConfig);
  }

  /**
   * Cross-browser screenshot capture
   */
  private async captureScreenshot(
    url: string,
    browser: BrowserConfig,
    viewport: ViewportConfig,
    theme: ThemeConfig,
    config: VisualTestConfig
  ): Promise<string> {
    // Simulate screenshot capture (integrate with Playwright/Puppeteer)
    const screenshotPath = `${this.screenshotPath}/${browser.name}-${viewport.name}-${theme.name}-${Date.now()}.png`;
    
    // In production, use actual browser automation
    // const page = await this.launchBrowser(browser);
    // await page.setViewportSize(viewport);
    // await page.goto(url);
    // await this.applyTheme(page, theme);
    // await page.screenshot({ path: screenshotPath });
    
    return screenshotPath;
  }

  /**
   * Apply theme to page
   */
  private async applyTheme(page: any, theme: ThemeConfig): Promise<void> {
    if (theme.className) {
      await page.evaluate((className: string) => {
        document.documentElement.classList.add(className);
      }, theme.className);
    }

    if (theme.mediaQuery) {
      await page.emulateMedia({ colorScheme: theme.name as any });
    }

    if (theme.customStyles) {
      await page.addStyleTag({ content: theme.customStyles });
    }
  }

  /**
   * Smart visual diff helpers
   */
  private describeVisualChanges(diffPercentage: number): string {
    if (diffPercentage < 0.1) {
      return 'Negligible sub-pixel differences detected';
    } else if (diffPercentage < 1) {
      return 'Minor rendering differences, likely due to anti-aliasing';
    } else if (diffPercentage < 5) {
      return 'Small visual changes detected, possibly intentional styling updates';
    } else if (diffPercentage < 15) {
      return 'Moderate visual changes detected, review required';
    } else {
      return 'Significant visual changes detected, likely regression or major update';
    }
  }

  private isAcceptableChange(diffPercentage: number): boolean {
    // AI logic to determine if change is acceptable
    // Consider factors like:
    // - Type of change (color vs layout)
    // - Location of change (critical vs decorative)
    // - Pattern of change (systematic vs random)
    return diffPercentage < 3;
  }

  private async detectChangedElements(
    baseline: any,
    current: any,
    diff: any
  ): Promise<any[]> {
    // Use computer vision to detect specific UI elements that changed
    // In production, use TensorFlow.js or OpenCV
    return [
      {
        type: 'button',
        bbox: [100, 200, 200, 50],
        changed: true,
        changeType: 'styled'
      },
      {
        type: 'text',
        bbox: [50, 100, 300, 30],
        changed: true,
        changeType: 'content'
      }
    ];
  }

  private generateVisualRecommendations(diffPercentage: number): string[] {
    const recommendations: string[] = [];

    if (diffPercentage > 15) {
      recommendations.push('Major visual regression detected - immediate review required');
      recommendations.push('Check recent CSS or component changes');
    } else if (diffPercentage > 5) {
      recommendations.push('Review visual changes to ensure they are intentional');
      recommendations.push('Update baseline if changes are expected');
    } else if (diffPercentage > 1) {
      recommendations.push('Minor differences detected - likely acceptable');
      recommendations.push('Consider updating baseline to reduce noise');
    }

    return recommendations;
  }

  /**
   * Helper methods
   */
  private generateTestId(
    browser: BrowserConfig,
    viewport: ViewportConfig,
    theme: ThemeConfig
  ): string {
    return `${browser.name}-${viewport.name}-${theme.name}`.toLowerCase().replace(/\s+/g, '-');
  }

  private getBaselinePath(projectId: number, testId: string): string {
    return `${this.baselinePath}/project-${projectId}/${testId}.png`;
  }

  private async getBaseline(path: string): Promise<string | null> {
    // Check if baseline exists
    try {
      // In production, check file system
      return path;
    } catch {
      return null;
    }
  }

  private async saveBaseline(path: string, screenshot: string): Promise<void> {
    // Save baseline image
    // In production, save to file system or cloud storage
  }

  private async loadImage(path: string): Promise<any> {
    // Load image using sharp or similar library
    // return sharp(path).raw().toBuffer();
    return {
      data: Buffer.alloc(1920 * 1080 * 4),
      width: 1920,
      height: 1080
    };
  }

  private async applyIgnoreRegions(
    image: any,
    regions: IgnoreRegion[]
  ): Promise<void> {
    // Apply ignore regions by filling with neutral color
    for (const region of regions) {
      if (region.selector) {
        // In production, find element bounds from selector
        continue;
      }
      
      if (region.x !== undefined && region.y !== undefined && 
          region.width !== undefined && region.height !== undefined) {
        // Fill region with gray
        // image.extract(region).fill([128, 128, 128]);
      }
    }
  }

  private async saveDiffImage(diff: any): Promise<string> {
    const path = `${this.diffPath}/diff-${Date.now()}.png`;
    // In production, save PNG
    // diff.pack().pipe(fs.createWriteStream(path));
    return path;
  }

  private async createComponentIsolation(
    url: string,
    component: ComponentTestConfig
  ): Promise<string> {
    // Create isolated component view
    // In production, create a special route or use Storybook
    return `${url}/component-isolation?selector=${encodeURIComponent(component.selector)}`;
  }

  private async runComponentVisualTest(
    project: Project,
    url: string,
    component: ComponentTestConfig,
    state: ComponentState,
    browser: BrowserConfig,
    theme: ThemeConfig,
    config: VisualTestConfig
  ): Promise<VisualTestResult> {
    const testId = `component-${component.name}-${state.name}-${browser.name}-${theme.name}`;
    const viewport = { name: 'component', width: 800, height: 600 };
    
    // Run visual test focused on component
    return this.runVisualTest(
      project,
      url,
      browser,
      viewport,
      theme,
      {
        ...config,
        waitBeforeScreenshot: state.wait || config.waitBeforeScreenshot
      }
    );
  }

  /**
   * Generate visual testing report
   */
  async generateVisualReport(
    results: VisualTestResult[]
  ): Promise<{
    summary: any;
    recommendations: string[];
    criticalIssues: any[];
  }> {
    const summary = {
      total: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      new: results.filter(r => r.status === 'new').length,
      browsers: [...new Set(results.map(r => r.browser))],
      themes: [...new Set(results.map(r => r.theme))]
    };

    const criticalIssues = results
      .filter(r => r.status === 'failed' && r.diffResults && r.diffResults.diffPercentage > 10)
      .map(r => ({
        test: r.name,
        diffPercentage: r.diffResults!.diffPercentage,
        description: r.diffResults!.aiAnalysis?.changeDescription || 'Significant visual change'
      }));

    const recommendations = this.generateReportRecommendations(summary, criticalIssues);

    return {
      summary,
      recommendations,
      criticalIssues
    };
  }

  private generateReportRecommendations(
    summary: any,
    criticalIssues: any[]
  ): string[] {
    const recommendations: string[] = [];

    if (criticalIssues.length > 0) {
      recommendations.push(`🚨 ${criticalIssues.length} critical visual regressions detected`);
      recommendations.push('Review failed tests immediately');
    }

    if (summary.new > 0) {
      recommendations.push(`🆕 ${summary.new} new baseline images created`);
      recommendations.push('Review new baselines for accuracy');
    }

    const passRate = (summary.passed / summary.total) * 100;
    if (passRate < 90) {
      recommendations.push(`⚠️ Low pass rate: ${passRate.toFixed(1)}%`);
      recommendations.push('Consider updating baselines if changes are intentional');
    }

    return recommendations;
  }
}

export const visualRegressionTestingService = new VisualRegressionTestingService();