import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sourceType: text("source_type").notNull(), // github, drive, jira
  sourceUrl: text("source_url"),
  repositoryData: jsonb("repository_data"),
  analysisStatus: text("analysis_status").default("pending"), // pending, analyzing, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  type: text("type").notNull(), // initial, architecture, risk, test
  status: text("status").default("pending"), // pending, running, completed, failed
  results: jsonb("results"),
  agentId: text("agent_id"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const testCases = pgTable("test_cases", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  name: text("name").notNull(),
  description: text("description"),
  priority: text("priority").notNull(), // high, medium, low
  type: text("type").notNull(), // unit, integration, e2e
  testScript: text("test_script"),
  generatedBy: text("generated_by"), // agent that generated this test
  status: text("status").default("generated"), // generated, running, passed, failed
  executionTime: integer("execution_time"),
  results: jsonb("results"),
});

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // supervisor, analyzer, risk, test, environment
  status: text("status").default("ready"), // ready, busy, error
  capabilities: jsonb("capabilities"),
  lastActivity: timestamp("last_activity"),
});

export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // security, performance, quality, architecture
  priority: text("priority").notNull(), // immediate, short-term, long-term
  actionable: boolean("actionable").default(true),
  implemented: boolean("implemented").default(false),
});

// Insert schemas
export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  sourceType: true,
  sourceUrl: true,
  repositoryData: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).pick({
  projectId: true,
  type: true,
  agentId: true,
});

export const insertTestCaseSchema = createInsertSchema(testCases).pick({
  projectId: true,
  name: true,
  description: true,
  priority: true,
  type: true,
  testScript: true,
  generatedBy: true,
});

export const insertRecommendationSchema = createInsertSchema(recommendations).pick({
  projectId: true,
  title: true,
  description: true,
  category: true,
  priority: true,
  actionable: true,
});

// Types
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type TestCase = typeof testCases.$inferSelect;
export type InsertTestCase = z.infer<typeof insertTestCaseSchema>;
export type Agent = typeof agents.$inferSelect;
export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
