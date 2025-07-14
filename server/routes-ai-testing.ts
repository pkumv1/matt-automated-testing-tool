import { Router } from "express";
import { enhancedAICodeReviewService } from "./services/ai-code-review-enhanced";
import { visualRegressionTestingService } from "./services/visual-regression-testing";
import { storage } from "./storage";
import { z } from "zod";
import type { Request, Response } from "express";

const router = Router();

// AI Code Review Routes

/**
 * Real-time code analysis and test suggestions
 */
router.post("/api/ai/code-review/analyze", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      projectId: z.number(),
      fileContent: z.string(),
      filePath: z.string(),
      context: z.object({
        cursor: z.object({
          line: z.number(),
          column: z.number()
        }),
        currentLine: z.string(),
        previousLines: z.array(z.string()),
        nextLines: z.array(z.string()),
        fileType: z.string()
      }).optional()
    });

    const { projectId, fileContent, filePath, context } = schema.parse(req.body);

    const suggestions = await enhancedAICodeReviewService.analyzeCodeForTestSuggestions(
      projectId,
      fileContent,
      filePath,
      context
    );

    res.json({ suggestions });
  } catch (error) {
    console.error("Code analysis error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Detect coverage gaps with AI analysis
 */
router.post("/api/ai/code-review/coverage-gaps", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      projectId: z.number(),
      coverageData: z.any().optional(),
      sourceCode: z.record(z.string()).optional()
    });

    const { projectId, coverageData, sourceCode } = schema.parse(req.body);

    const gaps = await enhancedAICodeReviewService.detectCoverageGaps(
      projectId,
      coverageData,
      sourceCode ? new Map(Object.entries(sourceCode)) : undefined
    );

    res.json({ gaps });
  } catch (error) {
    console.error("Coverage gap detection error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Detect testing anti-patterns
 */
router.post("/api/ai/code-review/anti-patterns", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      projectId: z.number(),
      testFiles: z.record(z.string()).optional()
    });

    const { projectId, testFiles } = schema.parse(req.body);

    const antiPatterns = await enhancedAICodeReviewService.detectAntiPatterns(
      projectId,
      testFiles ? new Map(Object.entries(testFiles)) : undefined
    );

    res.json({ antiPatterns });
  } catch (error) {
    console.error("Anti-pattern detection error:", error);
    res.status(400).json({ error: error.message });
  }
});

// Visual Regression Testing Routes

/**
 * Execute visual regression tests
 */
router.post("/api/visual-testing/execute", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      projectId: z.number(),
      url: z.string().url(),
      config: z.object({
        browsers: z.array(z.object({
          name: z.enum(['chrome', 'firefox', 'safari', 'edge']),
          version: z.string().optional(),
          deviceScaleFactor: z.number().optional(),
          isMobile: z.boolean().optional(),
          hasTouch: z.boolean().optional()
        })),
        viewports: z.array(z.object({
          width: z.number(),
          height: z.number(),
          name: z.string(),
          deviceScaleFactor: z.number().optional()
        })),
        themes: z.array(z.object({
          name: z.enum(['light', 'dark', 'high-contrast', 'custom']),
          className: z.string().optional(),
          mediaQuery: z.string().optional(),
          customStyles: z.string().optional()
        })),
        components: z.array(z.object({
          selector: z.string(),
          name: z.string(),
          states: z.array(z.object({
            name: z.string(),
            setup: z.string(),
            wait: z.number().optional()
          })).optional(),
          isolate: z.boolean().optional(),
          padding: z.number().optional()
        })).optional(),
        aiDiffThreshold: z.number().optional(),
        ignoreRegions: z.array(z.object({
          selector: z.string().optional(),
          x: z.number().optional(),
          y: z.number().optional(),
          width: z.number().optional(),
          height: z.number().optional(),
          type: z.enum(['dynamic', 'text', 'animation', 'date'])
        })).optional(),
        waitBeforeScreenshot: z.number().optional(),
        animations: z.enum(['disabled', 'allowed', 'finished']).optional()
      })
    });

    const { projectId, url, config } = schema.parse(req.body);

    const results = await visualRegressionTestingService.executeVisualTests(
      projectId,
      url,
      config
    );

    res.json({ results });
  } catch (error) {
    console.error("Visual testing error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Test dark mode specifically
 */
router.post("/api/visual-testing/dark-mode", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      projectId: z.number(),
      url: z.string().url(),
      config: z.object({
        browsers: z.array(z.object({
          name: z.enum(['chrome', 'firefox', 'safari', 'edge']),
          version: z.string().optional()
        })).optional(),
        viewports: z.array(z.object({
          width: z.number(),
          height: z.number(),
          name: z.string()
        })).optional()
      }).optional()
    });

    const { projectId, url, config } = schema.parse(req.body);

    const results = await visualRegressionTestingService.testDarkMode(
      projectId,
      url,
      config || {}
    );

    res.json({ results });
  } catch (error) {
    console.error("Dark mode testing error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Generate visual testing report
 */
router.post("/api/visual-testing/report", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      results: z.array(z.any())
    });

    const { results } = schema.parse(req.body);

    const report = await visualRegressionTestingService.generateVisualReport(results);

    res.json({ report });
  } catch (error) {
    console.error("Report generation error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * WebSocket endpoint for real-time code suggestions
 */
router.ws("/api/ai/code-review/realtime", (ws, req) => {
  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      const { projectId, fileContent, filePath, context } = data;

      // Analyze code in real-time
      const suggestions = await enhancedAICodeReviewService.analyzeCodeForTestSuggestions(
        projectId,
        fileContent,
        filePath,
        context
      );

      // Send real-time suggestions
      ws.send(JSON.stringify({
        type: 'suggestions',
        data: suggestions.filter(s => s.realtime)
      }));
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });
});

export default router;