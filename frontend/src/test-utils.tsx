import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import App from './App';

export function renderApp() {
  return render(
    <MantineProvider>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </MantineProvider>,
  );
}
