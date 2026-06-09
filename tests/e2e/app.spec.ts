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
  await expect(page.getByRole('button', { name: /进入情境对话/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /咖啡店点单/ })).toHaveCount(0);

  await page.getByRole('button', { name: /进入情境对话/ }).click();
  await page.getByRole('button', { name: /咖啡店点单/ }).click();

  await expect(page.getByRole('button', { name: '开始录音' })).toBeVisible();
});

test('trend page renders recent metrics area', async ({ page }) => {
  await page.goto('/trends');

  await expect(page.getByRole('heading', { name: '趋势' })).toBeVisible();
  await expect(page.getByText('最近 7 天的本地流利度指标会显示在这里')).toBeVisible();
});
