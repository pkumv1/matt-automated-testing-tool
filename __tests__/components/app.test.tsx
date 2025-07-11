// __tests__/components/app.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../../client/src/App';

// Mock components to isolate App testing
jest.mock('../../client/src/pages/modern-dashboard-page', () => ({
  default: () => <div data-testid="modern-dashboard">Modern Dashboard</div>
}));

jest.mock('../../client/src/pages/dashboard', () => ({
  default: () => <div data-testid="legacy-dashboard">Legacy Dashboard</div>
}));

jest.mock('../../client/src/pages/not-found', () => ({
  default: () => <div data-testid="not-found">Not Found</div>
}));

jest.mock('../../client/src/components/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>
}));

jest.mock('../../client/src/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-provider">{children}</div>
}));

describe('App Component', () => {
  it('should render the app with default route', () => {
    render(<App />);
    
    expect(screen.getByTestId('modern-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument();
  });

  it('should render modern dashboard for /modern route', () => {
    window.history.pushState({}, 'Test page', '/modern');
    render(<App />);
    
    expect(screen.getByTestId('modern-dashboard')).toBeInTheDocument();
  });

  it('should render legacy dashboard for /legacy route', () => {
    window.history.pushState({}, 'Test page', '/legacy');
    render(<App />);
    
    expect(screen.getByTestId('legacy-dashboard')).toBeInTheDocument();
  });

  it('should render legacy dashboard for /dashboard route', () => {
    window.history.pushState({}, 'Test page', '/dashboard');
    render(<App />);
    
    expect(screen.getByTestId('legacy-dashboard')).toBeInTheDocument();
  });

  it('should render not found page for unknown routes', () => {
    window.history.pushState({}, 'Test page', '/unknown-route');
    render(<App />);
    
    expect(screen.getByTestId('not-found')).toBeInTheDocument();
  });
});