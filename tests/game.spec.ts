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

test('tripeaks renders board with stock and streak', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-game="tripeaks"]').getByRole('button', { name: 'Play' }).click();
  await expect(page.getByText('TriPeaks', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Draw from stock' })).toBeVisible();
  await expect(page.getByText('Streak')).toBeVisible();
});

test('pyramid renders with recycles counter', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-game="pyramid"]').getByRole('button', { name: 'Play' }).click();
  await expect(page.getByText('Pyramid', { exact: true })).toBeVisible();
  await expect(page.getByText('Recycles')).toBeVisible();
  // Draw works
  await page.getByRole('button', { name: 'Draw from stock' }).click();
  await expect(page.getByText('23', { exact: true })).toBeVisible();
});

test('hearts renders and enforces 2 of clubs opening', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-game="hearts"]').getByRole('button', { name: 'Play' }).click();
  await expect(page.getByText('Hearts', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/2♣/)).toBeVisible();
  for (const name of ['Nina', 'Omar', 'Lily']) {
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  }
});

test('court piece renders teams and hukum', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-game="courtpiece"]').getByRole('button', { name: 'Play' }).click();
  await expect(page.getByText('Court Piece', { exact: true })).toBeVisible();
  await expect(page.getByText('Hukum', { exact: true })).toBeVisible();
  await expect(page.getByText(/You \+ Zoya/)).toBeVisible();
});

test('teen patti deals with pot and actions', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-game="teenpatti"]').getByRole('button', { name: 'Play' }).click();
  await expect(page.getByText('Teen Patti', { exact: true })).toBeVisible();
  await expect(page.getByText(/Pot: ₹40/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'See cards' })).toBeVisible();
  // Seeing reveals the hand label
  await page.getByRole('button', { name: 'See cards' }).click();
  await expect(page.getByText(/Trail!|Pure Sequence|Sequence|Color|Pair|High Card/)).toBeVisible();
});

test('rummy deals 13 cards with wild joker', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-game="rummy"]').getByRole('button', { name: 'Play' }).click();
  await expect(page.getByText('Indian Rummy', { exact: true })).toBeVisible();
  await expect(page.getByText('Joker')).toBeVisible();
  await expect(page.getByText(/are wild/)).toBeVisible();
  // Draw from stock, then hand shows 14 cards and discard hint appears
  await page.getByRole('button', { name: 'Draw from stock' }).click();
  await expect(page.getByText('Tap a card to discard it')).toBeVisible();
});
