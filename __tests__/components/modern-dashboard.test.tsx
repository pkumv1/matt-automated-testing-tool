// __tests__/components/modern-dashboard.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ModernDashboard from '../../client/src/components/modern-dashboard';
import type { Project } from '../../shared/schema';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('ModernDashboard', () => {
  const mockOnProjectSelect = jest.fn();
  const mockOnNewProject = jest.fn();
  const mockOnStartAnalysis = jest.fn();

  const mockAgents = [
    { id: 1, name: 'Test Agent', status: 'ready' }
  ];

  const mockTestCases = [
    { id: 1, name: 'Test Case 1', status: 'passed' }
  ];

  const mockProjects: Project[] = [
    {
      id: 1,
      name: 'Test Project 1',
      description: 'Test Description',
      sourceType: 'github',
      sourceUrl: 'https://github.com/test/repo1',
      analysisStatus: 'completed',
      repositoryData: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      name: 'Test Project 2',
      description: 'Another Test',
      sourceType: 'drive',
      sourceUrl: null,
      analysisStatus: 'analyzing',
      repositoryData: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dashboard with welcome section', () => {
    render(
      <ModernDashboard 
        activeProject={null}
        projects={[]} 
        agents={mockAgents}
        testCases={mockTestCases}
        onProjectSelect={mockOnProjectSelect}
        onNewProject={mockOnNewProject}
        onStartAnalysis={mockOnStartAnalysis}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('MATT Platform')).toBeInTheDocument();
    expect(screen.getByText('Mars Automated Testing Tool')).toBeInTheDocument();
    expect(screen.getByText('Start New Analysis')).toBeInTheDocument();
  });

  it('should display metrics cards', () => {
    render(
      <ModernDashboard 
        activeProject={null}
        projects={mockProjects} 
        agents={mockAgents}
        testCases={mockTestCases}
        onProjectSelect={mockOnProjectSelect}
        onNewProject={mockOnNewProject}
        onStartAnalysis={mockOnStartAnalysis}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Total Projects')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Total projects count
    expect(screen.getByText('Tests Generated')).toBeInTheDocument();
    expect(screen.getByText('Security Issues Found')).toBeInTheDocument();
    expect(screen.getByText('23')).toBeInTheDocument();
    expect(screen.getByText('Performance Score')).toBeInTheDocument();
    expect(screen.getByText('94%')).toBeInTheDocument();
  });

  it('should show empty state when no projects', () => {
    render(
      <ModernDashboard 
        activeProject={null}
        projects={[]} 
        agents={mockAgents}
        testCases={mockTestCases}
        onProjectSelect={mockOnProjectSelect}
        onNewProject={mockOnNewProject}
        onStartAnalysis={mockOnStartAnalysis}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('No Projects Yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first project to start automated code analysis with MATT')).toBeInTheDocument();
  });

  it('should display recent projects', () => {
    render(
      <ModernDashboard 
        activeProject={null}
        projects={mockProjects} 
        agents={mockAgents}
        testCases={mockTestCases}
        onProjectSelect={mockOnProjectSelect}
        onNewProject={mockOnNewProject}
        onStartAnalysis={mockOnStartAnalysis}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
    expect(screen.getByText('github')).toBeInTheDocument();
    expect(screen.getByText('drive')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('analyzing')).toBeInTheDocument();
  });

  it('should call onProjectSelect when clicking on a project', () => {
    render(
      <ModernDashboard 
        activeProject={null}
        projects={mockProjects} 
        agents={mockAgents}
        testCases={mockTestCases}
        onProjectSelect={mockOnProjectSelect}
        onNewProject={mockOnNewProject}
        onStartAnalysis={mockOnStartAnalysis}
      />,
      { wrapper: createWrapper() }
    );

    const projectCard = screen.getByText('Test Project 1').closest('div.cursor-pointer');
    fireEvent.click(projectCard!);

    expect(mockOnProjectSelect).toHaveBeenCalledWith(mockProjects[0]);
  });

  it('should call onNewProject when clicking start new analysis', () => {
    render(
      <ModernDashboard 
        activeProject={null}
        projects={mockProjects} 
        agents={mockAgents}
        testCases={mockTestCases}
        onProjectSelect={mockOnProjectSelect}
        onNewProject={mockOnNewProject}
        onStartAnalysis={mockOnStartAnalysis}
      />,
      { wrapper: createWrapper() }
    );

    const startButton = screen.getByText('Start New Analysis');
    fireEvent.click(startButton);

    expect(mockOnNewProject).toHaveBeenCalled();
  });

  it('should display project statistics when projects exist', () => {
    render(
      <ModernDashboard 
        activeProject={null}
        projects={mockProjects} 
        agents={mockAgents}
        testCases={mockTestCases}
        onProjectSelect={mockOnProjectSelect}
        onNewProject={mockOnNewProject}
        onStartAnalysis={mockOnStartAnalysis}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Project Analysis Overview')).toBeInTheDocument();
    // Check for progress indicators
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});