import { expect, test } from '@playwright/test';

test('home and review render in WebKit', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: '个人英语口语训练器' })).toBeVisible();

  await page.getByRole('link', { name: '复盘' }).click();

  await expect(page.getByRole('heading', { name: '历史记录' })).toBeVisible();
});

test('practice page exposes recording controls', async ({ page }) => {
  await page.goto('/practice');

  await expect(page.getByRole('heading', { name: '录音练习' })).toBeVisible();
  await expect(page.getByRole('button', { name: '开始录音' })).toBeVisible();
});
