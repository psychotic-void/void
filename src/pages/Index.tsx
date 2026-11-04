import { useMemo, useState } from "react";
import {
  Search,
  Users,
  UserRound,
  Flame,
  Zap,
  MessageSquare,
  Newspaper,
  LifeBuoy,
  MessagesSquare,
} from "lucide-react";
import logo from "@/assets/logo.png";
import "@/App.css";
import {
  GAMES,
  GENERAL_SEED,
  PLAYERS,
  type ChatMessage,
  type Player,
} from "@/lib/void-data";
import { GameAvatar, GameChip } from "@/components/GameBits";
import { PlayerCard } from "@/components/PlayerCard";
import { ProfileSheet } from "@/components/ProfileSheet";
import { ChatSheet } from "@/components/ChatSheet";
import { PhotoViewer } from "@/components/PhotoViewer";
import { Sheet } from "@/components/Sheet";

const NEWS_URL = "https://t.me/voidSS_chat";
const SUPPORT_URL = "https://t.me/neyroleptics";

const nowTime = () =>
  new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

const REPLIES = [
  "го, я в сети. дискорд скинь",
  "ща доиграю катку и напишу",
  "микрофон есть? без него не катаю",
  "норм тайминг, погнали через 10",
  "у меня сегодня тренировка, завтра свободен",
];

type ChatState = { kind: "general" } | { kind: "dm"; playerId: string } | null;

export default function Index() {
  const [me, setMe] = useState<Player>({
    id: "me",
    nick: "твой_ник",
    game: "CS2",
    rank: "ваш ранг",
    roles: ["IGL"],
    bio: "Пара строк о себе — стиль игры, время онлайна, чего ищешь.",
    online: true,
    vibe: "резко",
    photos: [],
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
  const [chat, setChat] = useState<ChatState>(null);
  const [generalMsgs, setGeneralMsgs] = useState<ChatMessage[]>(GENERAL_SEED);
  const [threads, setThreads] = useState<Record<string, ChatMessage[]>>({});
  const [viewer, setViewer] = useState<{ photos: string[]; nick: string; index: number } | null>(
    null,
  );

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
    () => PLAYERS.filter((p) => p.game === matchGame).sort((a, b) => Number(b.online) - Number(a.online)),
    [matchGame],
  );

  const openProfile = () => {
    setDraft(me);
    setShowProfile(true);
  };

  const patchDraft = (patch: Partial<Player>) => setDraft((prev) => ({ ...prev, ...patch }));

  const saveProfile = () => {
    setMe({
      ...draft,
      nick: draft.nick.trim() || "твой_ник",
      rank: draft.rank.trim() || "ваш ранг",
    });
    setShowProfile(false);
  };

  const chatPlayer = chat?.kind === "dm" ? PLAYERS.find((p) => p.id === chat.playerId) : undefined;

  const openDm = (player: Player) => {
    setThreads((prev) =>
      prev[player.id]
        ? prev
        : {
            ...prev,
            [player.id]: [
              {
                id: `${player.id}-seed`,
                author: player.nick,
                mine: false,
                text: "йо, видел твою анкету — го катку вечером?",
                time: nowTime(),
              },
            ],
          },
    );
    setChat({ kind: "dm", playerId: player.id });
  };

  const sendGeneral = (text: string) => {
    setGeneralMsgs((prev) => [
      ...prev,
      { id: `g-${Date.now()}`, author: me.nick, mine: true, text, time: nowTime() },
    ]);
  };

  const sendDm = (player: Player, text: string) => {
    const id = player.id;
    setThreads((prev) => ({
      ...prev,
      [id]: [
        ...(prev[id] ?? []),
        { id: `${id}-${Date.now()}`, author: me.nick, mine: true, text, time: nowTime() },
      ],
    }));

    const reply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
    window.setTimeout(() => {
      setThreads((prev) => ({
        ...prev,
        [id]: [
          ...(prev[id] ?? []),
          {
            id: `${id}-r-${Date.now()}`,
            author: player.nick,
            mine: false,
            text: reply,
            time: nowTime(),
          },
        ],
      }));
    }, 1100);
  };

  return (
    <div className="gs bg-black">
      <div className="gs-noise" aria-hidden />
      <div className="gs-glow" aria-hidden>
        <i />
        <i />
      </div>

      <div className="gs-wrap">
        <header className="gs-header">
          <div className="gs-brand">
            <div className="gs-logo">
              <img src={logo} alt="VOID" />
            </div>
            <div>
              <h1 className="gs-display">VOID</h1>
              <small>поиск тиммейтов · 2:47 am</small>
            </div>
          </div>

          <div className="gs-contacts">
            <a className="gs-contact" href={NEWS_URL} target="_blank" rel="noreferrer noopener">
              <Newspaper size={14} />
              новостной
            </a>
            <a
              className="gs-contact gs-contact-alt"
              href={SUPPORT_URL}
              target="_blank"
              rel="noreferrer noopener"
            >
              <LifeBuoy size={14} />
              поддержка <b>@neyroleptics</b>
            </a>
          </div>

          <div className="gs-head-right">
            <span className="gs-online">
              <b /> online 1248
            </span>
            <button
              className="gs-btn gs-btn-sm gs-btn-ghost"
              onClick={() => setChat({ kind: "general" })}
            >
              <MessagesSquare size={15} />
              <span style={{ textTransform: "none", letterSpacing: "0.04em" }}>общий чат</span>
            </button>
            <button
              className="gs-btn gs-btn-sm"
              style={{
                border: "1px solid var(--line-2)",
                background: "#1b1526",
                color: "#cbbfe0",
              }}
              onClick={openProfile}
            >
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
            Найди тиммейта
            <br />
            в любимой игре
            <br />
            <em>и дойди до MAJOR или FPL</em>
          </h2>
          <p>не забудь поспать</p>

          <div className="gs-actions">
            <button className="gs-btn gs-btn-primary border-purple-500" onClick={() => setShowMatch(true)}>
              <Users size={16} /> Найти тиммейта
            </button>
            <button className="gs-btn gs-btn-ghost border-purple-500" onClick={openProfile}>
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
              <GameChip key={g} label={g} active={g === game} onClick={() => setGame(g)} />
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
          <PlayerCard
            player={me}
            mine
            onEdit={openProfile}
            onOpenPhotos={(index) => setViewer({ photos: me.photos, nick: me.nick, index })}
          />
          {visible.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              onOpenPhotos={(index) => setViewer({ photos: p.photos, nick: p.nick, index })}
              onMessage={() => openDm(p)}
            />
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
            vo<b>id</b>
          </span>
          <span>играй громко · спи потом</span>
          <span className="gs-footer-links">
            <a href={NEWS_URL} target="_blank" rel="noreferrer noopener">
              новостной канал
            </a>
            <a href={SUPPORT_URL} target="_blank" rel="noreferrer noopener">
              поддержка @neyroleptics
            </a>
          </span>
        </footer>
      </div>

      {showProfile && (
        <ProfileSheet
          draft={draft}
          setDraft={patchDraft}
          onSave={saveProfile}
          onClose={() => setShowProfile(false)}
          onOpenPhotos={(index) => setViewer({ photos: draft.photos, nick: draft.nick, index })}
        />
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
              <GameAvatar game={u.game} size={40} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p className="n">
                  {u.nick}
                  {u.id === "me" && <b>вы</b>}
                </p>
                <p className="m">
                  {u.game} · {u.rank} · {u.online ? "online" : "offline"}
                </p>
              </div>
              {u.id !== "me" ? (
                <button
                  className="gs-mini"
                  aria-label="Написать"
                  onClick={() => {
                    openDm(u);
                    setShowUser(false);
                  }}
                >
                  <MessageSquare size={16} />
                </button>
              ) : (
                <button
                  className="gs-mini"
                  aria-label="Редактировать"
                  onClick={() => {
                    setShowUser(false);
                    openProfile();
                  }}
                >
                  <UserRound size={16} />
                </button>
              )}
            </div>
          ))}
        </Sheet>
      )}

      {showMatch && (
        <Sheet title="Найти тиммейта" subtitle="быстрый подбор по игре" onClose={() => setShowMatch(false)}>
          <div className="gs-chips">
            {GAMES.slice(1).map((g) => (
              <GameChip key={g} label={g} active={matchGame === g} onClick={() => setMatchGame(g)} />
            ))}
          </div>

          <p className="gs-subhead">подобрано: {matches.length}</p>

          {matches.length === 0 && <p className="gs-hint">по этой игре пока никого — зайди позже</p>}

          {matches.map((m) => (
            <div key={m.id} className="gs-result">
              <GameAvatar game={m.game} size={40} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p className="n">{m.nick}</p>
                <p className="m">
                  {m.rank} · {m.roles.join(" / ")}
                </p>
              </div>
              <button
                className="gs-btn gs-btn-sm"
                style={{ background: "var(--accent)", color: "#150f1f" }}
                onClick={() => {
                  openDm(m);
                  setShowMatch(false);
                }}
              >
                <Zap size={14} /> Позвать
              </button>
            </div>
          ))}
        </Sheet>
      )}

      {chat?.kind === "general" && (
        <ChatSheet
          title="Общий чат"
          subtitle="все, кто тащит ночью"
          messages={generalMsgs}
          onSend={sendGeneral}
          onClose={() => setChat(null)}
        />
      )}

      {chat?.kind === "dm" && chatPlayer && (
        <ChatSheet
          title={chatPlayer.nick}
          subtitle={`${chatPlayer.game} · ${
            chatPlayer.online ? "online" : "offline"
          } · личный диалог`}
          game={chatPlayer.game}
          messages={threads[chatPlayer.id] ?? []}
          onSend={(text) => sendDm(chatPlayer, text)}
          onClose={() => setChat(null)}
          onOpenGeneral={() => setChat({ kind: "general" })}
        />
      )}

      {viewer && (
        <PhotoViewer
          photos={viewer.photos}
          start={viewer.index}
          nick={viewer.nick}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}
