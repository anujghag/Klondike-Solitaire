// Themes that ship painted per-card artwork under public/assets/themes/<id>/cards/.
// Every other theme renders procedural CSS card faces, so returning an empty
// string skips the doomed <img> request (and the 404 flash) entirely.
const THEMES_WITH_CARD_ART = new Set(['mystic-void', 'maratha-glory']);

export const getCardImageUrl = (themeId: string, suit: string, rank: string): string => {
  if (!THEMES_WITH_CARD_ART.has(themeId)) return '';
  return `/assets/themes/${themeId}/cards/${suit}-${rank}.webp`;
};
