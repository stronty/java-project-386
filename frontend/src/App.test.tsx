import { describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { renderApp } from './test-utils';

describe('home page', () => {
  it('renders the headline and description of the service', () => {
    renderApp();
    expect(
      screen.getByRole('heading', { name: 'Запишитесь на встречу' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/общий календарь/i)).toBeInTheDocument();
  });

  it('explains the three steps of booking', () => {
    renderApp();
    const steps = screen.getByRole('list');
    expect(within(steps).getByText('Выберите тип встречи')).toBeInTheDocument();
    expect(within(steps).getByText(/свободный слот/i)).toBeInTheDocument();
    expect(
      within(steps).getByText(/получите подтверждение/i),
    ).toBeInTheDocument();
  });

  it('offers a call-to-action button that links to the booking page', () => {
    renderApp();
    expect(
      screen.getByRole('link', { name: /выбрать время/i }),
    ).toHaveAttribute('href', '/book');
  });

  it('navigates to the booking page when the call-to-action is clicked', () => {
    renderApp();
    fireEvent.click(screen.getByRole('link', { name: /выбрать время/i }));
    expect(
      screen.getByRole('heading', { name: 'Страница записи' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Запишитесь на встречу' }),
    ).not.toBeInTheDocument();
  });
});
