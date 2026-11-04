import { useMemo, useState } from "react";
import {
  Search,
  X,
  Users,
  UserRound,
  Swords,
  MessageSquare,
  Flame,
  Check,
  Zap,
} from "lucide-react";
import "./App.css";

type Player = {
  id: string;
  nick: string;
  game: string;
  rank: string;
  roles: string[];
  bio: string;
  online: boolean;
  avatar: string;
  vibe: string;
};

const GAMES = ["Все игры", "CS2", "Dota 2", "Valorant", "Apex", "Rust"];
const ROLES = ["Entry", "IGL", "Support", "Sniper", "Roamer"];

const PLAYERS: Player[] = [
  {
    id: "p1",
    nick: "voidslut",
    game: "CS2",
    rank: "Faceit 9",
    roles: ["Entry", "AWP"],
    bio: "Играю ночами, ору в микрофон, тащу раунды. Ищу состав для ESEA.",
    online: true,
    avatar: "https://picsum.photos/seed/voidslut/200/200",
    vibe: "агрессивно",
  },
  {
    id: "p2",
    nick: "kisel_",
    game: "Dota 2",
    rank: "Divine 3",
    roles: ["Support", "Roamer"],
    bio: "Спокойный саппорт, ставлю варды, не токсичу. Микрофон обязателен.",
    online: true,
    avatar: "https://picsum.photos/seed/kisel/200/200",
    vibe: "спокойно",
  },
  {
    id: "p3",
    nick: "GRIM//",
    game: "Valorant",
    rank: "Immortal 1",
    roles: ["Sniper", "IGL"],
    bio: "Коллю, дёргаю, читаю игру. Ищу двух человек на вечерние катки.",
    online: false,
    avatar: "https://picsum.photos/seed/grimmm/200/200",
    vibe: "холодно",
  },
  {
    id: "p4",
    nick: "sasha_oxi",
    game: "Apex",
    rank: "Diamond II",
    roles: ["Fragger", "Scout"],
    bio: "Пушу всё, что двигается. Люблю рвать отряды и портить статистику.",
    online: true,
    avatar: "https://picsum.photos/seed/sashaoxi/200/200",
    vibe: "хаотично",
  },
  {
    id: "p5",
    nick: "m0ld",
    game: "Rust",
    rank: "2k hours",
    roles: ["Builder", "Farmer"],
    bio: "Строю базу, фармлю серу, сижу в засаде. Рейд-тим приветствуется.",
    online: false,
    avatar: "https://picsum.photos/seed/m0ld/200/200",
    vibe: "упорото",
  },
  {
    id: "p6",
    nick: "toxic_nun",
    game: "CS2",
    rank: "Premier 18k",
    roles: ["IGL", "Support"],
    bio: "Знаю все смоки, веду раунды спокойным голосом. Без драмы.",
    online: true,
    avatar: "https://picsum.photos/seed/toxicnun/200/200",
    vibe: "по делу",
  },
];

function Sheet(props: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="gs-modal">
      <div className="gs-backdrop" onClick={props.onClose} />
      <div className="gs-sheet">
        <div className="gs-sheet-head">
          <div>
            <h4>{props.title}</h4>
            {props.subtitle && <p>{props.subtitle}</p>}
          </div>
          <button className="gs-close" onClick={props.onClose} aria-label="Закрыть">
            <X size={16} />
          </button>
        </div>
        {props.children}
      </div>
    </div>
  );
}

function Card({ player, mine, onEdit }: { player: Player; mine?: boolean; onEdit?: () => void }) {
  const [sent, setSent] = useState(false);
  const p = player;

  return (
    <article className="gs-card" data-mine={mine ? "true" : "false"}>
      <span className="gs-watermark">{p.game.slice(0, 2).toUpperCase()}</span>

      <div className="gs-card-top">
        <div className="gs-ava">
          <img src={p.avatar} alt={p.nick} />
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
            <button className="gs-mini" aria-label="Написать">
              <MessageSquare size={16} />
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export default function App() {
  const [me, setMe] = useState<Player>({
    id: "me",
    nick: "твой_ник",
    game: "CS2",
    rank: "ваш ранг",
    roles: ["IGL"],
    bio: "Пара строк о себе — стиль игры, время онлайна, чего ищешь.",
    online: true,
    avatar: "https://picsum.photos/seed/mygrungyface/200/200",
    vibe: "резко",
  });
  const [draft, setDraft] = useState<Player>(me);
  const [game, setGame] = useState(GAMES[0]);
  const [query, setQuery] = useState("");
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [matchGame, setMatchGame] = useState("CS2");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PLAYERS.filter((p) => {
      const okGame = game === GAMES[0] || p.game === game;
      const okQuery =
        !q ||
        p.nick.toLowerCase().includes(q) ||
        p.game.toLowerCase().includes(q) ||
        p.roles.join(" ").toLowerCase().includes(q);
      return okGame && okQuery && (!onlyOnline || p.online);
    });
  }, [game, query, onlyOnline]);

  const foundUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return [];
    return [me, ...PLAYERS].filter(
      (p) =>
        p.nick.toLowerCase().includes(q) ||
        p.game.toLowerCase().includes(q) ||
        p.rank.toLowerCase().includes(q),
    );
  }, [userQuery, me]);

  const matches = useMemo(
    () =>
      PLAYERS.filter((p) => p.game === matchGame).sort(
        (a, b) => Number(b.online) - Number(a.online),
      ),
    [matchGame],
  );

  const openProfile = () => {
    setDraft(me);
    setShowProfile(true);
  };

  const pickField = (patch: Partial<Player>) => setDraft({ ...draft, ...patch });

  return (
    <div className="gs">
      <div className="gs-noise" aria-hidden />
      <div className="gs-glow" aria-hidden>
        <i />
        <i />
      </div>

      <div className="gs-wrap">
        <header className="gs-header">
          <div className="gs-brand">
            <div className="gs-logo">
              <Swords size={20} />
            </div>
            <div>
              <h1 className="gs-display">
                GRUNGE<span>SQUAD</span>
              </h1>
              <small>поиск тиммейтов · 2:47 am</small>
            </div>
          </div>
          <div className="gs-head-right">
            <span className="gs-online">
              <b /> online 1248
            </span>
            <button className="gs-btn gs-btn-sm" style={{ border: "1px solid var(--line-2)", background: "#1b1526", color: "#cbbfe0" }} onClick={openProfile}>
              <UserRound size={16} />
              <span style={{ textTransform: "none", letterSpacing: "0.04em" }}>{me.nick}</span>
            </button>
          </div>
        </header>

        <section className="gs-hero">
          <div className="gs-tag">
            <Flame size={12} /> сезон 7 · набор открыт
          </div>
          <h2>
            Найди своих.
            <br />
            <em>Или проиграй</em> в одиночку.
          </h2>
          <p>
            Тёмная доска объявлений для тех, кто тащит ночью. Без вежливости и
            розовых поней — только ранг, роли и голос.
          </p>

          <div className="gs-actions">
            <button className="gs-btn gs-btn-primary" onClick={() => setShowMatch(true)}>
              <Users size={16} /> Найти тиммейта
            </button>
            <button className="gs-btn gs-btn-ghost" onClick={openProfile}>
              <UserRound size={16} /> Моя анкета
            </button>
            <button
              className="gs-btn gs-btn-dash"
              onClick={() => {
                setUserQuery("");
                setShowUser(true);
              }}
            >
              <Search size={16} /> Найти пользователя
            </button>
          </div>
        </section>

        <div className="gs-toolbar">
          <div className="gs-chips">
            {GAMES.map((g) => (
              <button
                key={g}
                className="gs-chip-btn"
                data-active={g === game ? "true" : "false"}
                onClick={() => setGame(g)}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="gs-search-row">
            <div className="gs-search">
              <Search size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ник или роль…"
              />
            </div>
            <button
              className="gs-online-toggle"
              data-on={onlyOnline ? "true" : "false"}
              onClick={() => setOnlyOnline((v) => !v)}
            >
              online
            </button>
          </div>
        </div>

        <div className="gs-sec">
          <h3>Доска анкет</h3>
          <span className="gs-rule" />
          <span className="gs-count">
            {visible.length} из {PLAYERS.length}
          </span>
        </div>

        <div className="gs-grid">
          <Card player={me} mine onEdit={openProfile} />
          {visible.map((p) => (
            <Card key={p.id} player={p} />
          ))}
          {visible.length === 0 && (
            <div className="gs-empty">
              <p className="t">Пусто</p>
              <p className="s">смени фильтр или сбрось поиск</p>
              <button
                className="gs-btn gs-btn-primary gs-btn-sm"
                style={{ marginTop: 16 }}
                onClick={() => {
                  setQuery("");
                  setGame(GAMES[0]);
                  setOnlyOnline(false);
                }}
              >
                Сбросить
              </button>
            </div>
          )}
        </div>

        <footer className="gs-footer">
          <span className="brand">
            grunge<b>squad</b>
          </span>
          <span>играй громко · спи потом</span>
        </footer>
      </div>

      {showProfile && (
        <Sheet title="Моя анкета" subtitle="то, что увидят другие" onClose={() => setShowProfile(false)}>
          <div className="gs-two">
            <label className="gs-field">
              <span>ник</span>
              <input className="gs-input" value={draft.nick} onChange={(e) => pickField({ nick: e.target.value })} />
            </label>
            <label className="gs-field">
              <span>ранг</span>
              <input className="gs-input" value={draft.rank} onChange={(e) => pickField({ rank: e.target.value })} />
            </label>
          </div>

          <div className="gs-field">
            <span>игра</span>
            <div className="gs-chips">
              {GAMES.slice(1).map((g) => (
                <button
                  key={g}
                  className="gs-chip-btn"
                  data-active={draft.game === g ? "true" : "false"}
                  onClick={() => pickField({ game: g })}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="gs-field">
            <span>роли</span>
            <div className="gs-chips">
              {ROLES.map((r) => {
                const on = draft.roles.includes(r);
                return (
                  <button
                    key={r}
                    className="gs-chip-btn"
                    data-active={on ? "true" : "false"}
                    onClick={() =>
                      pickField({ roles: on ? draft.roles.filter((x) => x !== r) : [...draft.roles, r] })
                    }
                    style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    {on && <Check size={12} />}
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="gs-field">
            <span>о себе</span>
            <textarea
              className="gs-textarea"
              rows={3}
              value={draft.bio}
              onChange={(e) => pickField({ bio: e.target.value })}
            />
          </label>

          <div className="gs-stat-row">
            <span>статус в сети</span>
            <button
              className="gs-stat-btn"
              data-on={draft.online ? "true" : "false"}
              onClick={() => pickField({ online: !draft.online })}
            >
              {draft.online ? "online" : "offline"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="gs-btn gs-btn-primary"
              style={{ flex: 1 }}
              onClick={() => {
                setMe(draft);
                setShowProfile(false);
              }}
            >
              Сохранить
            </button>
            <button className="gs-btn gs-btn-ghost" onClick={() => setShowProfile(false)}>
              Отмена
            </button>
          </div>
        </Sheet>
      )}

      {showUser && (
        <Sheet title="Найти пользователя" subtitle="ник, игра или ранг" onClose={() => setShowUser(false)}>
          <div className="gs-search" style={{ width: "100%", marginBottom: 16 }}>
            <Search size={16} />
            <input
              autoFocus
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="введи ник…"
              style={{ textTransform: "none", letterSpacing: "0.02em" }}
            />
          </div>

          {!userQuery.trim() && <p className="gs-hint">начни печатать — результаты появятся тут</p>}
          {userQuery.trim() !== "" && foundUsers.length === 0 && (
            <p className="gs-hint">никто не найден</p>
          )}

          {foundUsers.map((u) => (
            <div key={u.id} className="gs-result">
              <img src={u.avatar} alt={u.nick} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p className="n">
                  {u.nick}
                  {u.id === "me" && <b>вы</b>}
                </p>
                <p className="m">
                  {u.game} · {u.rank} · {u.online ? "online" : "offline"}
                </p>
              </div>
              <button className="gs-mini" aria-label="Написать">
                <MessageSquare size={16} />
              </button>
            </div>
          ))}
        </Sheet>
      )}

      {showMatch && (
        <Sheet title="Найти тиммейта" subtitle="быстрый подбор по игре" onClose={() => setShowMatch(false)}>
          <div className="gs-chips">
            {GAMES.slice(1).map((g) => (
              <button
                key={g}
                className="gs-chip-btn"
                data-active={matchGame === g ? "true" : "false"}
                onClick={() => setMatchGame(g)}
              >
                {g}
              </button>
            ))}
          </div>

          <p
            style={{
              margin: "20px 0 10px",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            подобрано: {matches.length}
          </p>

          {matches.length === 0 && <p className="gs-hint">по этой игре пока никого — зайди позже</p>}

          {matches.map((m) => (
            <div key={m.id} className="gs-result">
              <img src={m.avatar} alt={m.nick} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p className="n">{m.nick}</p>
                <p className="m">
                  {m.rank} · {m.roles.join(" / ")}
                </p>
              </div>
              <button
                className="gs-btn gs-btn-sm"
                style={{ background: "var(--accent)", color: "#150f1f" }}
                onClick={() => setShowMatch(false)}
              >
                <Zap size={14} /> Позвать
              </button>
            </div>
          ))}
        </Sheet>
      )}
    </div>
  );
}
