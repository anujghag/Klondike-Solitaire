export const getCardImageUrl = (themeId: string, suit: string, rank: string): string => {
  return `/assets/themes/${themeId}/cards/${suit}-${rank}.webp`;
};
