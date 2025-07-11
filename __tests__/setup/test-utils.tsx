// __tests__/setup/test-utils.tsx
import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';

// Create a custom render function that includes providers
export function render(
  ui: React.ReactElement,
  {
    route = '/',
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
    ...renderOptions
  } = {}
) {
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <Router>
          {children}
        </Router>
      </QueryClientProvider>
    );
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything
export * from '@testing-library/react';
export { render };