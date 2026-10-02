import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import App from './App';

describe('frontend smoke test', () => {
  it('renders the app heading', () => {
    render(
      <MantineProvider>
        <App />
      </MantineProvider>,
    );
    expect(
      screen.getByRole('heading', { name: /booking app/i }),
    ).toBeInTheDocument();
  });
});
