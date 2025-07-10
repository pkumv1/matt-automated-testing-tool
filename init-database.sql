-- MATT Database Initialization Script
-- This script creates the basic database schema for MATT
-- Run this if you're setting up a fresh PostgreSQL database

-- Create database (run as postgres user)
-- CREATE DATABASE matt_database;
-- \c matt_database;

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL,
  source_url TEXT,
  repository_data JSONB,
  analysis_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  results JSONB,
  agent_id TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Test cases table
CREATE TABLE IF NOT EXISTS test_cases (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  name TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL,
  type TEXT NOT NULL,
  test_script TEXT,
  generated_by TEXT,
  status TEXT DEFAULT 'generated',
  execution_time INTEGER,
  results JSONB
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'ready',
  capabilities JSONB,
  last_activity TIMESTAMP
);

-- Recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  actionable BOOLEAN DEFAULT true,
  implemented BOOLEAN DEFAULT false
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_analyses_project_id ON analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_project_id ON test_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type);
CREATE INDEX IF NOT EXISTS idx_recommendations_project_id ON recommendations(project_id);

-- Insert default agents
INSERT INTO agents (name, type, capabilities) VALUES 
  ('Supervisor Agent', 'supervisor', '{"workflow_management": true, "task_coordination": true}'),
  ('Code Analyzer', 'analyzer', '{"code_analysis": true, "language_detection": true, "framework_identification": true}'),
  ('Risk Assessor', 'risk', '{"security_analysis": true, "performance_analysis": true, "quality_analysis": true}'),
  ('Test Generator', 'test', '{"test_generation": true, "multi_platform_support": true}'),
  ('Environment Setup', 'environment', '{"environment_configuration": true, "deployment_assessment": true}')
ON CONFLICT DO NOTHING;

-- Grant permissions (adjust user as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO matt_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO matt_user;