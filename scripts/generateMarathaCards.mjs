/**
 * Bridge generator for the missing Maratha Glory card faces (all diamonds & clubs).
 *
 * The hearts and spades suits shipped with AI-painted anime portraits; until the
 * remaining 26 prompts in IMAGE_PROMPTS_MARATHA.md are rendered by an image model,
 * this script produces ornate procedural art in the same palette so every card in
 * the deck looks intentional: forts & ministers (diamonds, emerald/gold) and
 * weapons & artifacts (clubs, saffron/bronze), each with its character plaque.
 *
 * Usage: node scripts/generateMarathaCards.mjs [--force]
 *   Without --force, existing files are never overwritten — dropping in final
 *   AI art later simply replaces these placeholders.
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'themes', 'maratha-glory', 'cards');
const FORCE = process.argv.includes('--force');

const W = 400, H = 717;

// Mirrors src/maratha.ts (kept inline so the script runs with plain node)
const CHARACTERS = {
  diamonds: {
    A: ['Raigad Fort', 'The Impregnable Capital'],
    K: ['Moropant Trimbak Pingle', 'Peshwa (Prime Minister)'],
    Q: ['Ramchandra Pant Amatya', 'Finance Minister'],
    J: ['Annaji Datto', 'Sachiv (Secretary)'],
    10: ['Pratapgad Fort', 'The Emerald Forest Fort'],
    9: ['Shivneri Fort', 'The Sacred Birthplace'],
    8: ['Rajgad Fort', 'The First Capital'],
    7: ['Sindhudurg Fort', 'The Naval Fortress'],
    6: ['Dattaji Trimbak Waknis', 'Mantri (Interior Minister)'],
    5: ['Niraji Raoji', 'Nyayadhish (Chief Justice)'],
    4: ['Moreshwar Pandurang', 'Panditrao (High Priest)'],
    3: ['Purandar Fort', 'Site of the Great Siege'],
    2: ['Panhala Fort', 'The Legendary Escape Route'],
  },
  clubs: {
    A: ['Bhavani Sword', 'The Divine Blade'],
    K: ['Bhagwa Dhwaj', 'The Saffron Flag'],
    Q: ['Bagh Nakh', 'The Tiger Claws'],
    J: ['Zirjat', 'Traditional Armor'],
    10: ['Firangi', 'The Straight Sword'],
    9: ['Dandpatta', 'The Gauntlet Sword'],
    8: ['Bhimthadi', 'The War Horse'],
    7: ['Mavlas', 'The Fierce Infantry'],
    6: ['Dhal', 'The Intricate Shield'],
    5: ['Tutari', 'The War Trumpet'],
    4: ['Rajmudra', 'The Royal Seal'],
    3: ['Ghorpad', 'The Legendary Lizard'],
    2: ['Nagari', 'The War Drum'],
  },
};

const PALETTES = {
  diamonds: { // ministers & forts — emerald + gold (matches theme suit style)
    bgInner: '#0c5c42', bgOuter: '#03150f',
    accent: '#f5b93c', accentSoft: '#c99532',
    glow: 'rgba(245,185,60,0.35)',
  },
  clubs: { // weapons & artifacts — saffron + bronze
    bgInner: '#8a4210', bgOuter: '#1a0b02',
    accent: '#ffb25e', accentSoft: '#d18334',
    glow: 'rgba(255,158,64,0.35)',
  },
};

// ── Central motifs (simple ornamental SVG, centered in a 200×200 box) ─────────

/** Hill fort silhouette with saffron flag — used for the diamonds suit. */
const fortMotif = (p) => `
  <g stroke="${p.accent}" stroke-width="5" fill="none" stroke-linejoin="round">
    <path d="M20 160 L20 100 L45 100 L45 82 L65 82 L65 100 L85 100 L85 70 L100 55 L115 70 L115 100 L135 100 L135 82 L155 82 L155 100 L180 100 L180 160 Z" fill="rgba(0,0,0,0.35)"/>
    <path d="M55 160 L55 122 L80 122 L80 160" />
    <path d="M120 160 L120 122 L145 122 L145 160" />
    <path d="M100 55 L100 18" stroke-width="4"/>
    <path d="M100 20 L138 30 L100 42 Z" fill="#ff7a1a" stroke="none"/>
  </g>`;

/** Crossed talwar swords over a shield — used for the clubs suit. */
const weaponMotif = (p) => `
  <g stroke="${p.accent}" stroke-width="5" fill="none" stroke-linecap="round">
    <circle cx="100" cy="105" r="46" fill="rgba(0,0,0,0.35)"/>
    <circle cx="100" cy="105" r="34" stroke-width="2.5" stroke-dasharray="4 6"/>
    <circle cx="100" cy="105" r="7" fill="${p.accent}" stroke="none"/>
    <path d="M38 40 Q60 78 92 96" />
    <path d="M162 40 Q140 78 108 96" />
    <path d="M30 32 L48 34 L46 50 Z" fill="${p.accent}" stroke="none"/>
    <path d="M170 32 L152 34 L154 50 Z" fill="${p.accent}" stroke="none"/>
    <path d="M74 148 L100 170 L126 148" stroke-width="4"/>
  </g>`;

const SUIT_GLYPH = { diamonds: '♦', clubs: '♣' };

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function cardSvg(suit, rank, name, title) {
  const p = PALETTES[suit];
  const motif = suit === 'diamonds' ? fortMotif(p) : weaponMotif(p);
  const isFace = ['A', 'K', 'Q', 'J'].includes(rank);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="75%">
      <stop offset="0%" stop-color="${p.bgInner}"/>
      <stop offset="100%" stop-color="${p.bgOuter}"/>
    </radialGradient>
    <radialGradient id="halo" cx="50%" cy="40%" r="40%">
      <stop offset="0%" stop-color="${p.glow}"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
    <pattern id="motifbg" width="36" height="36" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="36" height="36" fill="none"/>
      <rect x="15" y="15" width="6" height="6" fill="${p.accentSoft}" opacity="0.12"/>
    </pattern>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#motifbg)"/>
  <rect width="${W}" height="${H}" fill="url(#halo)"/>

  <!-- double ornamental border -->
  <rect x="12" y="12" width="${W - 24}" height="${H - 24}" rx="18" fill="none" stroke="${p.accent}" stroke-width="4"/>
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="12" fill="none" stroke="${p.accentSoft}" stroke-width="1.5" stroke-dasharray="1 5" opacity="0.9"/>

  <!-- corner flourishes -->
  ${[[36, 36, 1, 1], [W - 36, 36, -1, 1], [36, H - 36, 1, -1], [W - 36, H - 36, -1, -1]].map(([x, y, sx, sy]) =>
    `<g transform="translate(${x} ${y}) scale(${sx} ${sy})" stroke="${p.accent}" stroke-width="2.5" fill="none">
       <path d="M0 26 Q0 0 26 0 M0 14 Q0 0 14 0"/>
     </g>`).join('')}

  <!-- big rank + suit glyph, top-centre band -->
  <text x="${W / 2}" y="150" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="96" font-weight="bold" fill="${p.accent}" stroke="rgba(0,0,0,0.55)" stroke-width="2">${rank}</text>
  <text x="${W / 2}" y="215" text-anchor="middle" font-family="Georgia, serif" font-size="52" fill="${p.accentSoft}">${SUIT_GLYPH[suit]}</text>

  <!-- central motif medallion -->
  <g transform="translate(${W / 2 - 100} 250)">
    <circle cx="100" cy="105" r="98" fill="rgba(0,0,0,0.25)" stroke="${p.accentSoft}" stroke-width="2"/>
    ${motif}
  </g>

  ${isFace ? `<text x="${W / 2}" y="500" text-anchor="middle" font-family="Georgia, serif" font-size="20" letter-spacing="6" fill="${p.accentSoft}">⚜ ⚜ ⚜</text>` : ''}

  <!-- name plaque -->
  <g>
    <rect x="34" y="560" width="${W - 68}" height="108" rx="12" fill="rgba(0,0,0,0.55)" stroke="${p.accentSoft}" stroke-width="1.5"/>
    <text x="${W / 2}" y="605" text-anchor="middle" font-family="Georgia, serif" font-size="${name.length > 22 ? 20 : 24}" font-weight="bold" fill="#f6e7c8">${escapeXml(name)}</text>
    <text x="${W / 2}" y="642" text-anchor="middle" font-family="Georgia, serif" font-size="17" font-style="italic" fill="${p.accent}">${escapeXml(title)}</text>
  </g>
</svg>`;
}

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
let made = 0, skipped = 0;

for (const suit of ['diamonds', 'clubs']) {
  for (const rank of RANKS) {
    const file = path.join(OUT_DIR, `${suit}-${rank}.webp`);
    if (fs.existsSync(file) && !FORCE) { skipped++; continue; }
    const [name, title] = CHARACTERS[suit][rank];
    const svg = Buffer.from(cardSvg(suit, rank, name, title));
    await sharp(svg).webp({ quality: 82 }).toFile(file);
    made++;
  }
}
console.log(`Maratha bridge art: ${made} cards generated, ${skipped} already present (use --force to regenerate).`);
