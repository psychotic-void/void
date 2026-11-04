import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Sheet({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="gs-modal">
      <div className="gs-backdrop" onClick={onClose} />
      <div className="gs-sheet">
        <div className="gs-sheet-head">
          <div>
            <h4>{title}</h4>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="gs-close" onClick={onClose} aria-label="Закрыть">
            <X size={16} />
          </button>
        </div>
        {children}
        {footer}
      </div>
    </div>
  );
}
