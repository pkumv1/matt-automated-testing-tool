-- Performance optimization indexes for MATT database
-- Run this script to improve project tab loading performance

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_projects_status_created ON projects(analysis_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_source_type_created ON projects(source_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);

-- Indexes for frequently accessed JSONB data patterns
CREATE INDEX IF NOT EXISTS idx_projects_repository_data_gin ON projects USING GIN (repository_data);

-- Partial indexes for active projects
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(created_at DESC) 
WHERE analysis_status != 'failed';

-- Indexes for related tables to improve JOIN performance
CREATE INDEX IF NOT EXISTS idx_analyses_project_status ON analyses(project_id, status);
CREATE INDEX IF NOT EXISTS idx_test_cases_project_status ON test_cases(project_id, status);
CREATE INDEX IF NOT EXISTS idx_recommendations_project_priority ON recommendations(project_id, priority);

-- Update table statistics for better query planning
ANALYZE projects;
ANALYZE analyses;
ANALYZE test_cases;
ANALYZE recommendations;

-- Add comments for documentation
COMMENT ON INDEX idx_projects_status_created IS 'Optimize queries filtering by status and ordering by creation date';
COMMENT ON INDEX idx_projects_source_type_created IS 'Optimize queries filtering by source type and ordering by creation date';
COMMENT ON INDEX idx_projects_repository_data_gin IS 'Enable fast searches within repository JSONB data';
COMMENT ON INDEX idx_projects_active IS 'Partial index for active (non-failed) projects only';