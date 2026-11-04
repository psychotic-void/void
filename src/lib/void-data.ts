import cs2Logo from "@/assets/games/cs2.png";
import dotaLogo from "@/assets/games/dota.png";
import valorantLogo from "@/assets/games/valorant.png";
import apexLogo from "@/assets/games/apex.png";
import rustLogo from "@/assets/games/rust.png";
import minecraftLogo from "@/assets/games/minecraft.png";

export type Player = {
  id: string;
  nick: string;
  game: string;
  rank: string;
  roles: string[];
  bio: string;
  online: boolean;
  vibe: string;
  photos: string[];
};

export type ChatMessage = {
  id: string;
  author: string;
  mine: boolean;
  text: string;
  time: string;
};

export const GAMES = ["Все игры", "CS2", "Dota 2", "Valorant", "Apex", "Rust", "Minecraft"];

export const ROLES = ["Entry", "IGL", "Support", "Sniper", "Lurker", "Farm", "PvP", "Builder"];

export const GAME_LOGOS: Record<string, string> = {
  CS2: cs2Logo,
  "Dota 2": dotaLogo,
  Valorant: valorantLogo,
  Apex: apexLogo,
  Rust: rustLogo,
  Minecraft: minecraftLogo,
};

/* ---------- генеративный арт для фонов анкет ---------- */

const PALETTES: [string, string, string][] = [
  ["#8b5cf6", "#22d3ee", "#0b0910"],
  ["#f43f5e", "#a855f7", "#12060f"],
  ["#22c55e", "#0ea5e9", "#04120e"],
  ["#f59e0b", "#ef4444", "#150b04"],
  ["#a855f7", "#a3e635", "#0d0a14"],
  ["#38bdf8", "#c084fc", "#080b16"],
];

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function makeArt(seed: number): string {
  const r = rng(seed * 7919 + 17);
  const pal = PALETTES[Math.floor(r() * PALETTES.length)];

  const blobs = Array.from({ length: 5 }, (_, i) => {
    const cx = Math.round(r() * 900);
    const cy = Math.round(r() * 1200);
    const rad = Math.round(150 + r() * 330);
    const color = i % 2 === 0 ? pal[0] : pal[1];
    const op = (0.16 + r() * 0.24).toFixed(2);
    return `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${color}" opacity="${op}" />`;
  }).join("");

  const lines: string[] = [];
  for (let x = 60; x < 900; x += 90) lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="1200" />`);
  for (let y = 60; y < 1200; y += 90) lines.push(`<line x1="0" y1="${y}" x2="900" y2="${y}" />`);

  const bars = Array.from({ length: 3 }, () => {
    const y = Math.round(r() * 1100);
    const h = Math.round(8 + r() * 26);
    return `<rect x="0" y="${y}" width="900" height="${h}" fill="${pal[1]}" opacity="0.1" />`;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${pal[2]}"/><stop offset="1" stop-color="#000000"/>
</linearGradient>
<filter id="b"><feGaussianBlur stdDeviation="95"/></filter>
</defs>
<rect width="900" height="1200" fill="url(#g)"/>
<g filter="url(#b)">${blobs}</g>
${bars}
<g stroke="${pal[1]}" stroke-width="1" opacity="0.15">${lines.join("")}</g>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* ---------- демо-анкеты ---------- */

export const PLAYERS: Player[] = [
  {
    id: "p1",
    nick: "voidslut",
    game: "CS2",
    rank: "Faceit 9",
    roles: ["Entry", "PvP"],
    bio: "Играю ночами, ору в микрофон, тащу раунды. Ищу состав для ESEA.",
    online: true,
    vibe: "агрессивно",
    photos: [makeArt(11), makeArt(12)],
  },
  {
    id: "p2",
    nick: "kisel_",
    game: "Dota 2",
    rank: "Divine 3",
    roles: ["Support", "Lurker"],
    bio: "Спокойный саппорт, ставлю варды, не токсичу. Микрофон обязателен.",
    online: true,
    vibe: "спокойно",
    photos: [makeArt(21), makeArt(22), makeArt(23)],
  },
  {
    id: "p3",
    nick: "GRIM//",
    game: "Valorant",
    rank: "Immortal 1",
    roles: ["Sniper", "IGL"],
    bio: "Коллю, дёргаю, читаю игру. Ищу двух человек на вечерние катки.",
    online: false,
    vibe: "холодно",
    photos: [makeArt(31), makeArt(32)],
  },
  {
    id: "p4",
    nick: "sasha_oxi",
    game: "Apex",
    rank: "Diamond II",
    roles: ["Entry", "PvP"],
    bio: "Пушу всё, что двигается. Люблю рвать отряды и портить статистику.",
    online: true,
    vibe: "хаотично",
    photos: [makeArt(41), makeArt(42)],
  },
  {
    id: "p5",
    nick: "m0ld",
    game: "Rust",
    rank: "2k hours",
    roles: ["Farm", "Builder"],
    bio: "Строю базу, фармлю серу, сижу в засаде. Рейд-тим приветствуется.",
    online: false,
    vibe: "упорото",
    photos: [makeArt(51), makeArt(52), makeArt(53)],
  },
  {
    id: "p6",
    nick: "toxic_nun",
    game: "CS2",
    rank: "Premier 18k",
    roles: ["IGL", "Support"],
    bio: "Знаю все смоки, веду раунды спокойным голосом. Без драмы.",
    online: true,
    vibe: "по делу",
    photos: [makeArt(61), makeArt(62)],
  },
  {
    id: "p7",
    nick: "creeper_king",
    game: "Minecraft",
    rank: "3k hours",
    roles: ["Farm", "Builder"],
    bio: "Строю мега-базу в выживании, играю на хардкоре. Ищу народ на сервер.",
    online: true,
    vibe: "медленно",
    photos: [makeArt(71), makeArt(72)],
  },
  {
    id: "p8",
    nick: "bedwars_god",
    game: "Minecraft",
    rank: "Bedwars 340★",
    roles: ["PvP", "IGL"],
    bio: "Бедварс, скайварс, pvp 1.8. Ломаю кровати и нервы. Мик обязателен.",
    online: false,
    vibe: "дерзко",
    photos: [makeArt(81), makeArt(82)],
  },
];

export const GENERAL_SEED: ChatMessage[] = [
  {
    id: "g1",
    author: "toxic_nun",
    mine: false,
    text: "собираем пятое на премьер вечером, 20к+, пишите",
    time: "02:12",
  },
  {
    id: "g2",
    author: "m0ld",
    mine: false,
    text: "кто на расте в вipe? нужен второй фарм",
    time: "02:19",
  },
  {
    id: "g3",
    author: "voidslut",
    mine: false,
    text: "на cs2 ищу ингресса, я авплю. без микрофона не пишите",
    time: "02:31",
  },
];
