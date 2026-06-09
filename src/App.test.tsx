import { existsSync, readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';
import faviconSource from '../public/favicon.svg?raw';
import viteConfigSource from '../vite.config.ts?raw';

function renderApp() {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

describe('App routes', () => {
  it('renders the home page heading and practice link', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: '个人英语口语训练器' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '开始练习' })).toHaveAttribute('href', '/practice');
  });

  it('navigates to the review page from the top nav', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('link', { name: '复盘' }));

    expect(screen.getByRole('heading', { name: '历史记录' })).toBeInTheDocument();
  });

  it('exposes the trend page from the top nav', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('link', { name: '趋势' }));

    expect(screen.getByRole('heading', { name: '趋势' })).toBeInTheDocument();
  });
});

describe('Task 1 shell assets and responsive styles', () => {
  it('stacks mobile navigation links to avoid horizontal overflow', () => {
    const styles = readFileSync('src/styles.css', 'utf8');

    expect(styles).toMatch(/@media \(max-width: 720px\)[\s\S]*\.main-nav\s*{[\s\S]*flex-direction:\s*column;/);
  });

  it('uses existing favicon and PWA PNG icon assets', () => {
    expect(viteConfigSource).toContain('/pwa-192x192.png');
    expect(viteConfigSource).toContain('/pwa-512x512.png');
    expect(viteConfigSource).toContain('favicon.svg');
    expect(faviconSource).toContain('<svg');
    expect(existsSync('public/favicon.svg')).toBe(true);
    expect(existsSync('public/pwa-192x192.png')).toBe(true);
    expect(existsSync('public/pwa-512x512.png')).toBe(true);
  });
});
