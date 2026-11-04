import { useRef } from "react";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { GAMES, ROLES, type Player } from "@/lib/void-data";
import { GameChip, RoleChip } from "@/components/GameBits";
import { Sheet } from "@/components/Sheet";

const MAX_PHOTOS = 6;

export function ProfileSheet({
  draft,
  setDraft,
  onSave,
  onClose,
  onOpenPhotos,
}: {
  draft: Player;
  setDraft: (patch: Partial<Player>) => void;
  onSave: () => void;
  onClose: () => void;
  onOpenPhotos: (index: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleRole = (role: string) => {
    const on = draft.roles.includes(role);
    setDraft({
      roles: on ? draft.roles.filter((r) => r !== role) : [...draft.roles, role],
    });
  };

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = Math.max(0, MAX_PHOTOS - draft.photos.length);
    Array.from(files)
      .slice(0, room)
      .forEach((file) => {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = () => {
          const url = String(reader.result ?? "");
          if (!url) return;
          setDraft({ photos: [...draft.photos, url].slice(0, MAX_PHOTOS) });
        };
        reader.readAsDataURL(file);
      });
  };

  const removePhoto = (index: number) => {
    setDraft({ photos: draft.photos.filter((_, i) => i !== index) });
  };

  return (
    <Sheet title="Моя анкета" subtitle="то, что увидят другие" onClose={onClose}>
      <div className="gs-two">
        <label className="gs-field">
          <span>ник</span>
          <input
            className="gs-input"
            value={draft.nick}
            onChange={(e) => setDraft({ nick: e.target.value })}
          />
        </label>
        <label className="gs-field">
          <span>ранг</span>
          <input
            className="gs-input"
            value={draft.rank}
            onChange={(e) => setDraft({ rank: e.target.value })}
          />
        </label>
      </div>

      <div className="gs-field">
        <span>игра</span>
        <div className="gs-chips">
          {GAMES.slice(1).map((g) => (
            <GameChip
              key={g}
              label={g}
              active={draft.game === g}
              onClick={() => setDraft({ game: g })}
            />
          ))}
        </div>
      </div>

      <div className="gs-field">
        <span>роли · можно несколько, теги остаются на месте</span>
        <div className="gs-chips">
          {ROLES.map((r) => (
            <RoleChip
              key={r}
              label={r}
              active={draft.roles.includes(r)}
              onClick={() => toggleRole(r)}
            />
          ))}
        </div>
        <p className="gs-field-hint">
          выбрано: {draft.roles.length > 0 ? draft.roles.join(" / ") : "ничего"}
        </p>
      </div>

      <div className="gs-field">
        <span>фото · до {MAX_PHOTOS} штук на фоне анкеты</span>
        <div className="gs-photo-grid">
          {draft.photos.map((src, i) => (
            <div key={`${i}-${src.slice(-16)}`} className="gs-photo-tile">
              <img src={src} alt={`Фото ${i + 1}`} />
              <div className="gs-photo-tile-actions">
                <button type="button" onClick={() => onOpenPhotos(i)} aria-label="Открыть фото">
                  <ImagePlus size={13} />
                </button>
                <button
                  type="button"
                  className="gs-photo-del"
                  onClick={() => removePhoto(i)}
                  aria-label="Удалить фото"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          {draft.photos.length < MAX_PHOTOS && (
            <button type="button" className="gs-photo-add" onClick={() => fileRef.current?.click()}>
              <Plus size={18} />
              <span>загрузить</span>
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <label className="gs-field">
        <span>о себе</span>
        <textarea
          className="gs-textarea"
          rows={3}
          value={draft.bio}
          onChange={(e) => setDraft({ bio: e.target.value })}
        />
      </label>

      <div className="gs-stat-row">
        <span>статус в сети</span>
        <button
          type="button"
          className="gs-stat-btn"
          data-on={draft.online ? "true" : "false"}
          onClick={() => setDraft({ online: !draft.online })}
        >
          {draft.online ? "online" : "offline"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="gs-btn gs-btn-primary" style={{ flex: 1 }} onClick={onSave}>
          Сохранить
        </button>
        <button className="gs-btn gs-btn-ghost" onClick={onClose}>
          Отмена
        </button>
      </div>
    </Sheet>
  );
}
