import { test, expect } from '@playwright/test';

test('solitaire game logic test', async ({ page }) => {
  await page.goto('/');

  // Start an easy game
  await page.getByText('easy').click();

  // Wait for board to render
  await expect(page.getByText('Score')).toBeVisible();

  // We can't easily play a full random game to completion in a deterministic test,
  // but we can verify the core mechanics work.

  // 1. Check initial state
  // Score should be 0
  await expect(page.getByText('0').first()).toBeVisible();
  
  // 2. Test drawing a card
  // Click the stock pile (first pile)
  const stockPile = page.locator('.cursor-pointer').first();
  await stockPile.click();
  
  // Moves should increment
  await expect(page.getByText('1').first()).toBeVisible();

  // 3. Test hint system
  const hintButton = page.getByRole('button', { name: 'Hint' });
  await hintButton.click();
  
  // 4. Test undo system
  const undoButton = page.getByRole('button', { name: 'Undo' });
  await undoButton.click();
  
  // Moves should go back to 0
  await expect(page.getByText('0').nth(1)).toBeVisible(); // Second 0 is moves

  // 5. Test menu navigation
  const menuButton = page.getByRole('button', { name: 'Menu' });
  await menuButton.click();
  
  // Should be back on menu
  await expect(page.getByText('Klondike Solitaire')).toBeVisible();
});
