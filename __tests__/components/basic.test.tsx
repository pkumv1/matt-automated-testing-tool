// __tests__/components/basic.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';

describe('Basic Test', () => {
  it('should pass a simple test', () => {
    render(<div>Hello World</div>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should do basic math', () => {
    expect(1 + 1).toBe(2);
  });
});
