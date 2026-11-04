import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export function PhotoViewer({
  photos,
  start = 0,
  nick,
  onClose,
}: {
  photos: string[];
  start?: number;
  nick: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(start);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, photos.length]);

  if (photos.length === 0) return null;

  const go = (step: number) => setIndex((i) => (i + step + photos.length) % photos.length);

  return (
    <div className="gs-viewer" role="dialog" aria-label={`Фото ${nick}`}>
      <div className="gs-viewer-backdrop" onClick={onClose} />

      <div className="gs-viewer-head">
        <span className="gs-viewer-title">{nick}</span>
        <span className="gs-viewer-count">
          {index + 1} / {photos.length}
        </span>
        <button className="gs-viewer-close" onClick={onClose} aria-label="Закрыть">
          <X size={18} />
        </button>
      </div>

      <div className="gs-viewer-stage">
        {photos.length > 1 && (
          <button className="gs-viewer-nav" onClick={() => go(-1)} aria-label="Предыдущее фото">
            <ChevronLeft size={22} />
          </button>
        )}
        <img className="gs-viewer-img" src={photos[index]} alt={`${nick} — фото ${index + 1}`} />
        {photos.length > 1 && (
          <button className="gs-viewer-nav" onClick={() => go(1)} aria-label="Следующее фото">
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {photos.length > 1 && (
        <div className="gs-viewer-dots">
          {photos.map((_, i) => (
            <button
              key={i}
              className="gs-viewer-dot"
              data-on={i === index ? "true" : "false"}
              onClick={() => setIndex(i)}
              aria-label={`Фото ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
