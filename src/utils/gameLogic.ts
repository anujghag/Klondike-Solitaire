import { Card } from '../types';

export function canMoveToFoundation(card: Card, foundation: Card[]): boolean {
  if (foundation.length === 0) {
    return card.value === 1; // Ace
  }
  const topCard = foundation[foundation.length - 1];
  return card.suit === topCard.suit && card.value === topCard.value + 1;
}

export function canMoveToTableau(card: Card, tableau: Card[]): boolean {
  if (tableau.length === 0) {
    return card.value === 13; // King
  }
  const topCard = tableau[tableau.length - 1];
  return topCard.isFaceUp && card.color !== topCard.color && card.value === topCard.value - 1;
}

export function checkWin(foundations: Card[][]): boolean {
  return foundations.every(f => f.length === 13);
}

export function getHint(stock: Card[], waste: Card[], foundations: Card[][], tableaus: Card[][]) {
  // Check waste to foundation
  if (waste.length > 0) {
    const topWaste = waste[waste.length - 1];
    for (let i = 0; i < 4; i++) {
      if (canMoveToFoundation(topWaste, foundations[i])) {
        return { from: 'waste', to: `foundation-${i}`, card: topWaste };
      }
    }
  }

  // Check tableau to foundation
  for (let i = 0; i < 7; i++) {
    const tableau = tableaus[i];
    if (tableau.length > 0) {
      const topTableau = tableau[tableau.length - 1];
      for (let j = 0; j < 4; j++) {
        if (canMoveToFoundation(topTableau, foundations[j])) {
          return { from: `tableau-${i}`, to: `foundation-${j}`, card: topTableau };
        }
      }
    }
  }

  // Check waste to tableau
  if (waste.length > 0) {
    const topWaste = waste[waste.length - 1];
    for (let i = 0; i < 7; i++) {
      if (canMoveToTableau(topWaste, tableaus[i])) {
        return { from: 'waste', to: `tableau-${i}`, card: topWaste };
      }
    }
  }

  // Check tableau to tableau
  for (let i = 0; i < 7; i++) {
    const tableau = tableaus[i];
    for (let k = 0; k < tableau.length; k++) {
      const card = tableau[k];
      if (card.isFaceUp) {
        for (let j = 0; j < 7; j++) {
          if (i !== j && canMoveToTableau(card, tableaus[j])) {
            // Only suggest if it reveals a card or moves a king to an empty space
            if ((k > 0 && !tableau[k-1].isFaceUp) || (k === 0 && card.value === 13 && tableaus[j].length > 0)) {
               return { from: `tableau-${i}`, to: `tableau-${j}`, card };
            }
          }
        }
      }
    }
  }

  // Draw from stock
  if (stock.length > 0 || waste.length > 0) {
    return { from: 'stock', to: 'waste' };
  }

  return null;
}
