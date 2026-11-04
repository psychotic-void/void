import { Check, Gamepad2, Swords, Flame, Zap, Hammer, Crosshair } from "lucide-react";
import { GAME_LOGOS } from "@/lib/void-data";

const GAME_ICONS: Record<string, typeof Swords> = {
  CS2: Swords,
  "Dota 2": Flame,
  Valorant: Crosshair,
  Apex: Zap,
  Rust: Hammer,
};

export function GameLogo({ game, size = 18 }: { game: string; size?: number }) {
  const src = GAME_LOGOS[game];
  if (!src) return <Gamepad2 size={size} strokeWidth={1.6} />;
  return (
    <img
      src={src}
      alt={game}
      className="gs-game-logo"
      style={{ width: size, height: size }}
      loading="lazy"
    />
  );
}

export function GameChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="gs-chip-btn gs-chip-game"
      data-active={active ? "true" : "false"}
      onClick={onClick}
    >
      <GameLogo game={label} size={18} />
      {label}
    </button>
  );
}

/**
 * Роль — как тег в игре: чип всегда остаётся в списке,
 * активное состояние лишь подсвечивается.
 */
export function RoleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="gs-chip-btn gs-chip-role"
      data-active={active ? "true" : "false"}
      onClick={onClick}
    >
      <span className="gs-chip-mark">{active ? <Check size={12} /> : null}</span>
      {label}
    </button>
  );
}

export function GameAvatar({ game, size = 56 }: { game: string; size?: number }) {
  const Icon = GAME_ICONS[game] ?? Gamepad2;
  const src = GAME_LOGOS[game];
  return (
    <span
      className="gs-ava-ph"
      style={{ width: size, height: size, borderRadius: size / 4 }}
      aria-hidden
    >
      {src ? (
        <img
          src={src}
          alt=""
          style={{ width: size * 0.6, height: size * 0.6, objectFit: "contain" }}
        />
      ) : (
        <Icon size={size * 0.42} strokeWidth={1.6} />
      )}
    </span>
  );
}
