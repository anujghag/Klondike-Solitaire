import { test, expect } from '@playwright/test';

test('hub renders all six games', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('The Card Pavilion')).toBeVisible();
  for (const name of ['Klondike', 'Spider', 'FreeCell', 'Bluff', 'Mendikot', 'Satte pe Satta']) {
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  }
  // Desi section header
  await expect(page.getByText('Desi Classics')).toBeVisible();
});

test('klondike solitaire game logic via hub', async ({ page }) => {
  await page.goto('/');

  // Hub → classic Klondike menu
  await page.getByRole('button', { name: 'Open' }).click();
  await expect(page.getByText('Klondike Solitaire')).toBeVisible();

  // Start an easy game
  await page.getByText('easy').click();
  await expect(page.getByText('Score')).toBeVisible();

  // Draw a card → moves increment
  const stockPile = page.locator('.cursor-pointer').first();
  await stockPile.click();
  await expect(page.getByText('1').first()).toBeVisible();

  // Hint + undo
  await page.getByRole('button', { name: 'Hint' }).click();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByText('0').nth(1)).toBeVisible();

  // Back to the Klondike menu
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByText('Klondike Solitaire')).toBeVisible();

  // Back to the hub
  await page.getByRole('button', { name: 'All Games' }).click();
  await expect(page.getByText('The Card Pavilion')).toBeVisible();
});

test('spider deals, moves counter and undo work', async ({ page }) => {
  await page.goto('/');
  // Second "Play" button belongs to the Spider tile (Klondike shows "Open")
  await page.locator('[data-game="spider"]').getByRole('button', { name: 'Play' }).click();

  await expect(page.getByText('Spider', { exact: true })).toBeVisible();
  await expect(page.getByText('0/8')).toBeVisible();

  // Deal a row from the stock (legal at game start: all columns filled)
  await page.getByRole('button', { name: 'Deal from stock' }).click();
  await expect(page.getByText('5 left')).toBeHidden(); // 5 deals initially → after one deal shows 4

  // Undo restores the stock
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByText(/Deal \(5 left\)/)).toBeVisible();

  await page.getByRole('button', { name: 'Back to games' }).click();
  await expect(page.getByText('The Card Pavilion')).toBeVisible();
});

test('freecell renders board and auto-collect button', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-game="freecell"]').getByRole('button', { name: 'Play' }).click();

  await expect(page.getByText('FreeCell', { exact: true })).toBeVisible();
  await expect(page.getByText('0/52')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Collect' })).toBeVisible();
});

test('satte pe satta opens with the seven of hearts', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-game="sevens"]').getByRole('button', { name: 'Play' }).click();

  await expect(page.getByText('Satte pe Satta', { exact: true })).toBeVisible();
  await expect(page.getByText(/opened with the 7♥/)).toBeVisible();
  // Opponents seated
  for (const name of ['Meera', 'Arjun', 'Dadi']) {
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  }
});

test('bluff table renders with players and log', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-game="bluff"]').getByRole('button', { name: 'Play' }).click();

  await expect(page.getByText('Bluff · Challenge')).toBeVisible();
  await expect(page.getByText(/you start/i)).toBeVisible();
  for (const name of ['Vikram', 'Priya', 'Kabir']) {
    await expect(page.getByText(name)).toBeVisible();
  }
});

test('mendikot table renders teams and trump', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-game="mendikot"]').getByRole('button', { name: 'Play' }).click();

  await expect(page.getByText('Mendikot', { exact: true })).toBeVisible();
  await expect(page.getByText(/You \+ Asha/)).toBeVisible();
  await expect(page.getByText(/Ravi \+ Suresh/)).toBeVisible();
  await expect(page.getByText('Trump', { exact: true })).toBeVisible();
});
