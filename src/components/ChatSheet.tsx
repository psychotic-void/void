import { useEffect, useRef, useState } from "react";
import { Send, Users } from "lucide-react";
import type { ChatMessage } from "@/lib/void-data";
import { GameAvatar } from "@/components/GameBits";
import { Sheet } from "@/components/Sheet";

export function ChatSheet({
  title,
  subtitle,
  game,
  messages,
  onSend,
  onClose,
  onOpenGeneral,
}: {
  title: string;
  subtitle: string;
  game?: string;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onClose: () => void;
  onOpenGeneral?: () => void;
}) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText("");
  };

  return (
    <Sheet title={title} subtitle={subtitle} onClose={onClose}>
      <div className="gs-chat-bar">
        {game ? <GameAvatar game={game} size={38} /> : <span className="gs-chat-ava"><Users size={17} /></span>}
        <div className="gs-chat-bar-text">
          <p className="n">{title}</p>
          <p className="m">{subtitle}</p>
        </div>
        {onOpenGeneral && (
          <button className="gs-mini" onClick={onOpenGeneral} aria-label="Общий чат">
            <Users size={15} />
          </button>
        )}
      </div>

      <div className="gs-chat-log">
        {messages.map((m) => (
          <div key={m.id} className="gs-msg" data-mine={m.mine ? "true" : "false"}>
            {!m.mine && <span className="gs-msg-author">{m.author}</span>}
            <div className="gs-bubble">
              <p>{m.text}</p>
              <span className="gs-bubble-time">{m.time}</span>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="gs-hint">пока тихо — напиши первым, тут все свои</p>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="gs-chat-input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="написать сообщение…"
        />
        <button className="gs-btn gs-btn-primary gs-btn-sm" onClick={submit}>
          <Send size={14} />
        </button>
      </div>
    </Sheet>
  );
}
