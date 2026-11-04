import { useState } from "react";
import { ImagePlus, Images, MessageSquare } from "lucide-react";
import type { Player } from "@/lib/void-data";
import { GameAvatar } from "@/components/GameBits";

export function PlayerCard({
  player,
  mine,
  onEdit,
  onOpenPhotos,
  onMessage,
}: {
  player: Player;
  mine?: boolean;
  onEdit?: () => void;
  onOpenPhotos: (index: number) => void;
  onMessage?: () => void;
}) {
  const [sent, setSent] = useState(false);
  const p = player;
  const hasPhotos = p.photos.length > 0;

  return (
    <article className="gs-card bg-zinc-900" data-mine={mine ? "true" : "false"}>
      {hasPhotos ? (
        <button
          type="button"
          className="gs-card-media"
          onClick={() => onOpenPhotos(0)}
          aria-label={`Открыть фото ${p.nick}`}
        >
          <img src={p.photos[0]} alt={`${p.nick} — фото`} loading="lazy" />
          <span className="gs-card-media-count">
            <Images size={12} /> {p.photos.length}
          </span>
          <span className="gs-card-media-hint">листать</span>
        </button>
      ) : (
        <button
          type="button"
          className="gs-card-media gs-card-media-empty"
          onClick={onEdit}
          aria-label="Добавить фото"
        >
          <ImagePlus size={20} />
          <span>добавь своё фото</span>
        </button>
      )}

      <div className="gs-card-inner">
        <span className="gs-watermark">{p.game.slice(0, 2).toUpperCase()}</span>

        <div className="gs-card-top">
          <div className="gs-ava">
            <GameAvatar game={p.game} />
            <span className="gs-dot" data-on={p.online ? "true" : "false"} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 className="gs-nick">{p.nick}</h3>
            <p className="gs-meta">
              {p.game} · {p.rank}
            </p>
          </div>
          {mine && <span className="gs-you">вы</span>}
        </div>

        <p className="gs-bio">{p.bio}</p>

        <div className="gs-roles">
          {p.roles.map((r) => (
            <span key={r} className="gs-role">
              {r}
            </span>
          ))}
          <span className="gs-role gs-vibe">{p.vibe}</span>
        </div>

        <div className="gs-card-body-spacer" />

        <div className="gs-card-foot">
          {mine ? (
            <button className="gs-btn gs-btn-primary gs-btn-sm" style={{ flex: 1 }} onClick={onEdit}>
              Редактировать
            </button>
          ) : (
            <>
              <button
                className="gs-btn gs-btn-sm"
                style={{
                  flex: 1,
                  background: sent ? "#2a2237" : "var(--accent)",
                  color: sent ? "var(--lime)" : "#150f1f",
                  boxShadow: sent ? "none" : "0 12px 30px -14px rgba(168,85,247,.9)",
                }}
                onClick={() => setSent(true)}
                disabled={sent}
              >
                {sent ? "Заявка отправлена" : "Позвать в тиму"}
              </button>
              <button className="gs-mini" aria-label="Написать" onClick={onMessage}>
                <MessageSquare size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
