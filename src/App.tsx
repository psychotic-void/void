import { useMemo, useState, useEffect, useRef } from "react";
import {
  Search, X, Users, UserRound, MessageSquare, Edit, Trash2, ImagePlus, Eye, Plus, ArrowLeft, Link as LinkIcon, Send, ThumbsUp, ThumbsDown, Flag, ShieldAlert, Ban, VolumeX, Shield, LogOut, MoreVertical, CornerDownRight, Bell
} from "lucide-react";
import logo from "./assets/logo.png";
import { saveImage, getImage } from "./db";
import { supabase } from "./supabaseClient";
import "./App.css";

type Player = {
  id: string; nick: string; email: string; game: string; rank: string;
  roles: string[]; bio: string; online: boolean; vibe: string;
  isOwner?: boolean; photos?: string[]; warns?: number; banned?: boolean; banned_until?: string; custom_role?: string; muted_until?: string;
  age?: string; platform?: string; hasMic?: boolean; session_id?: string;
};

type ForumReply = { 
  id: number; thread_id: number; author: string; text: string; date: string; likes: number; dislikes: number; 
  parent_id?: number | null;
};

type ForumThread = { 
  id: number; title: string; author: string; category: string; description: string; 
  replies?: ForumReply[]; views: number; date: string; likes: number; dislikes: number;
  liked_by?: string[]; disliked_by?: string[]; 
};

type Message = { id: number; sender: string; receiver: string; text: string; created_at: string; };

const GAMES = ["Все игры", "CS2", "Dota 2", "Valorant", "Apex", "Rust", "Minecraft"];
const ROLES = ["Entry", "IGL", "Support", "Sniper", "Lurker", "Builder", "Farm", "PvP"];
const VIBES = ["Спокойно", "Агрессивно", "Ситуативно"];
const AGES = ["10-14", "14-16", "16-30", "30-50", "50+"];
const PLATFORMS = ["Faceit", "MM"];
const FORUM_CATEGORIES = ["Все темы", "Важное", "Новости", "CS2", "Dota 2", "Valorant", "Apex", "Rust", "Minecraft", "Ивенты", "Курилка", "Жалобы", "Творчество", "Мануалы", "Вопросы", "Обмены"];
const OWNER_NICK = "psychotic badtrip";

const RESTRICTED_CATEGORIES = ["Важное", "Новости"];

// === ЗВУК ===
let audioCtx: AudioContext | null = null;
const playNotificationSound = () => {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    fetch('/sms.mp3').then(r => r.arrayBuffer()).then(buffer => audioCtx!.decodeAudioData(buffer)).then(decoded => {
      const source = audioCtx!.createBufferSource(); source.buffer = decoded; source.connect(audioCtx!.destination); source.start(0);
    }).catch(e => console.log("Ошибка звука:", e));
  } catch (e) { console.log("Аудио не поддерживается", e); }
};

function CategoryIcon({ category, className = "w-5 h-5" }: { category: string; className?: string }) {
  const iconMap: Record<string, string> = {
    "CS2": "cs2.png", "Dota 2": "dota.png", "Valorant": "valorant.png", "Apex": "apex.png",
    "Rust": "rust.png", "Minecraft": "minecraft.png", "Новости": "news.png", "Ивенты": "ivent.png",
    "Курилка": "smoke.png", "Жалобы": "complaints.png", "Творчество": "creativity.png",
    "Мануалы": "manuals.png", "Вопросы": "complaints.png", "Обмены": "trade.png", "Важное": "news.png"
  };
  const fileName = iconMap[category];
  if (!fileName) return <div className={className} />;
  return <img src={`/src/assets/${fileName}`} alt={category} className={`${className} object-contain opacity-70`} onError={(e) => (e.currentTarget.style.display = 'none')} />;
}

function FormatText({ text }: { text: string }) {
  const parts = text.split(/(@[a-zA-Zа-яА-Я0-9_ ]+)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("@")) return <span key={i} className="text-purple-400 font-bold hover:underline cursor-pointer">{part}</span>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function ReplyNode({ reply, allReplies, depth = 0, onReply, canDelete, deleteReply }: { 
  reply: ForumReply, allReplies: ForumReply[], depth?: number, 
  onReply: (id: number, author: string) => void, canDelete: boolean, deleteReply: (id: number) => void
}) {
  const children = allReplies.filter(r => r.parent_id === reply.id);
  const maxDepth = 4;

  return (
    <div className={`flex flex-col relative ${depth > 0 ? "ml-4 md:ml-6 pl-4 border-l-2 border-zinc-700/50 hover:border-purple-500/50 transition-colors" : "mt-4"}`}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 md:p-4 mb-2 group transition-all hover:border-zinc-600">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs md:text-sm text-gray-400">
            {reply.author[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-300 text-xs md:text-sm hover:text-white transition-colors cursor-pointer">@{reply.author}</p>
            <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider">{reply.date}</p>
          </div>
          {canDelete && (
            <button onClick={() => deleteReply(reply.id)} className="ml-auto text-red-500 hover:bg-red-500/10 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 size={14} />
            </button>
          )}
        </div>
        
        <p className="text-xs md:text-sm text-gray-300 whitespace-pre-wrap pl-8 md:pl-10"><FormatText text={reply.text} /></p>
        
        <div className="flex gap-3 md:gap-4 mt-2 pl-8 md:pl-10">
          <button className="flex items-center gap-1 text-gray-500 hover:text-green-500 text-[10px] md:text-xs font-medium transition-all"><ThumbsUp size={12} /> {reply.likes}</button>
          <button className="flex items-center gap-1 text-gray-500 hover:text-red-500 text-[10px] md:text-xs font-medium transition-all"><ThumbsDown size={12} /> {reply.dislikes}</button>
          <button onClick={() => onReply(reply.id, reply.author)} className="flex items-center gap-1 text-gray-500 hover:text-purple-400 text-[10px] md:text-xs font-medium transition-all"><CornerDownRight size={12} /> Ответить</button>
        </div>
      </div>

      {children.length > 0 && depth < maxDepth && (
        <div className="flex flex-col">
          {children.map(child => (
            <ReplyNode key={child.id} reply={child} allReplies={allReplies} depth={depth + 1} onReply={onReply} canDelete={canDelete} deleteReply={deleteReply} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "verify">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authNick, setAuthNick] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [authError, setAuthError] = useState(""); 

  const [me, setMe] = useState<Player>({ id: "guest", nick: "guest", email: "", game: "CS2", rank: "Гость", roles: [], bio: "", online: true, vibe: "", photos: [] });
  const [hasProfile, setHasProfile] = useState(false);
  const [currentView, setCurrentView] = useState<"main" | "profile" | "forum" | "thread">("main");
  const [viewedProfile, setViewedProfile] = useState<Player | null>(null);
  
  const [avatarUrl, setAvatarUrl] = useState<string>(logo);
  const [bannerUrl, setBannerUrl] = useState<string>("https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const playerPhotosInputRef = useRef<HTMLInputElement>(null);
  const draftPhotosInputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<Player>(me);
  const [showProfile, setShowProfile] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(me.bio);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [showAnketaModal, setShowAnketaModal] = useState(false);
  const [anketaTarget, setAnketaTarget] = useState<Player | null>(null);

  const [activeCategory, setActiveCategory] = useState("Все темы");
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadDesc, setNewThreadDesc] = useState("");
  const [newThreadCategory, setNewThreadCategory] = useState("CS2");
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [threads, setThreads] = useState<ForumThread[]>([]);

  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ id: number, author: string, text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const [showInbox, setShowInbox] = useState(false);
  const [inboxMessages, setInboxMessages] = useState<Message[]>([]);
  const [inboxSearchQuery, setInboxSearchQuery] = useState("");
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [dmInput, setDmInput] = useState("");
  const [dmImage, setDmImage] = useState<string | null>(null);
  const dmFileInputRef = useRef<HTMLInputElement>(null);
  
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatNick, setNewChatNick] = useState("");
  const [chatMenuOpen, setChatMenuOpen] = useState(false);

  const [comments, setComments] = useState<Message[]>([]);
  const [commentText, setCommentText] = useState("");

  const [showReport, setShowReport] = useState<{ type: 'thread' | 'reply', id: number } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [adminTarget, setAdminTarget] = useState<Player | null>(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [onlineCount, setOnlineCount] = useState(1);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const [customMuteMinutes, setCustomMuteMinutes] = useState("");
  const [customBanMinutes, setCustomBanMinutes] = useState("");

  useEffect(() => {
    const unlock = () => {
      if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('click', unlock);

    const fetchData = async () => {
      const { data: tData } = await supabase.from('threads').select('*').order('id', { ascending: false });
      const { data: rData } = await supabase.from('replies').select('*').order('id', { ascending: true });
      
      if (tData && rData) {
        const formattedThreads = tData.map(t => ({ ...t, replies: rData.filter(r => r.thread_id === t.id) }));
        setThreads(formattedThreads as ForumThread[]);
      } else if (tData) setThreads(tData as ForumThread[]);

      const { data: cData } = await supabase.from('chat_messages').select('*').order('id', { ascending: true });
      if (cData) setChatMessages(cData);

      const { data: iData } = await supabase.from('messages').select('*').order('id', { ascending: false });
      if (iData) setInboxMessages(iData);
    };
    fetchData();

    const savedUser = localStorage.getItem("void_user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      checkBanStatus(user.nick).then((isBanned) => {
        if (!isBanned) {
          setMe(user); setDraft(user); setIsAuth(true);
          supabase.from('players').select('nick').eq('nick', user.nick).single().then(({data}) => { if (data) setHasProfile(true); });
        }
      });
    }

    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    const updateStatus = () => {
      const key = "void_active_sessions"; const now = Date.now();
      let sessions: number[] = JSON.parse(localStorage.getItem(key) || "[]");
      sessions = sessions.filter(time => now - time < 10000);
      sessions.push(now);
      localStorage.setItem(key, JSON.stringify(sessions));
      setOnlineCount(sessions.length);
    };
    updateStatus(); const onlineInterval = setInterval(updateStatus, 3000);

    if (isAuth && me.nick !== "guest") {
      getImage(`avatar_${me.nick}`).then((s) => { if (s) setAvatarUrl(s); });
      getImage(`banner_${me.nick}`).then((s) => { if (s) setBannerUrl(s); });
      getImage(`photos_${me.nick}`).then((s) => { if (s) { setMe(prev => ({ ...prev, photos: JSON.parse(s) })); } });
    }

    let playerSub: any = null;
    if (isAuth && me.nick !== "guest") {
      playerSub = supabase.channel('player_status')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players', filter: `nick=eq.${me.nick}` }, (payload) => {
          const updatedPlayer = payload.new as Player;
          if (updatedPlayer.banned) { alert("Вы были забанены администратором."); handleLogout(); return; }
          
          if (updatedPlayer.session_id && updatedPlayer.session_id !== localStorage.getItem('void_session')) {
            alert("Вы вышли из аккаунта на другом устройстве.");
            handleLogout();
            return;
          }

          if (updatedPlayer.muted_until !== me.muted_until) setMe(prev => ({ ...prev, muted_until: updatedPlayer.muted_until }));
        }).subscribe();
    }

    const chatSub = supabase.channel('chat_room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        setChatMessages(prev => [...prev, payload.new as any]);
        const myNick = JSON.parse(localStorage.getItem("void_user") || "{}").nick;
        if (payload.new.author !== myNick && payload.new.author !== "guest") {
          setNotification(`Новое сообщение от @${payload.new.author}`);
          playNotificationSound();
          setTimeout(() => setNotification(null), 3000);
        }
      }).subscribe();

    const inboxSub = supabase.channel('inbox_room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setInboxMessages(prev => [payload.new as any, ...prev]);
        if (payload.new.receiver === me.nick) {
          setNotification(payload.new.sender === 'system' ? "Новое системное уведомление!" : "Новое сообщение в личке!");
          playNotificationSound();
          setTimeout(() => setNotification(null), 3000);
        }
      }).subscribe();

    return () => {
      if (playerSub) supabase.removeChannel(playerSub);
      supabase.removeChannel(chatSub);
      supabase.removeChannel(inboxSub);
      clearInterval(timeInterval);
      clearInterval(onlineInterval);
    };
  }, [isAuth, me.nick, me.muted_until]);

  useEffect(() => {
    if (viewedProfile) {
      supabase.from('messages').select('*').eq('receiver', viewedProfile.nick).eq('sender', 'system').order('id', { ascending: false })
        .then(({ data }) => { if (data) setComments(data); });
    }
  }, [viewedProfile]);

  const checkBanStatus = async (nick: string) => {
    if (nick === OWNER_NICK) return false;
    const { data } = await supabase.from('players').select('banned, banned_until').eq('nick', nick).single();
    
    if (data) {
      if (data.banned && !data.banned_until) { setAuthError("Ваш аккаунт заблокирован навсегда."); localStorage.removeItem("void_user"); setIsAuth(false); return true; }
      if (data.banned && data.banned_until) {
        if (new Date(data.banned_until) > new Date()) { setAuthError(`Ваш аккаунт заблокирован до ${new Date(data.banned_until).toLocaleString()}`); localStorage.removeItem("void_user"); setIsAuth(false); return true; }
        else await supabase.from('players').update({ banned: false, banned_until: null }).eq('nick', nick);
      }
    }
    return false;
  };

  const handleLogin = async () => {
    if (!authNick.trim() || !authPass.trim()) return;
    setAuthError("");
    const isBanned = await checkBanStatus(authNick);
    if (isBanned) return;

    const isOwner = authNick === OWNER_NICK;
    const newUser: Player = {
      id: Date.now().toString(), nick: authNick, email: `${authNick}@void.com`,
      game: "CS2", rank: isOwner ? "Owner" : "Новичок", roles: isOwner ? ["IGL"] : [],
      bio: "Ищу тиммейтов", online: true, vibe: "Спокойно", isOwner, photos: []
    };
    
    const newSessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('void_session', newSessionId);

    const { data } = await supabase.from('players').select('*').eq('nick', authNick).single();
    if (data) {
      newUser.custom_role = data.custom_role;
      newUser.rank = data.rank || newUser.rank;
      newUser.muted_until = data.muted_until;
      await supabase.from('players').update({ session_id: newSessionId }).eq('nick', authNick);
      setHasProfile(true);
    } else setHasProfile(false);

    await supabase.from('messages').insert([{ sender: 'system', receiver: authNick, text: `Вы успешно вошли в аккаунт.` }]);

    localStorage.setItem("void_user", JSON.stringify(newUser));
    setMe(newUser); setDraft(newUser); setIsAuth(true);
  };

  const handleRequestCode = async () => {
    if (!authEmail.trim() || !authPass.trim() || !authNick.trim()) return alert("Заполните все поля!");
    
    // Проверка на уникальность никнейма
    const { data } = await supabase.from('players').select('nick').eq('nick', authNick).single();
    if (data) return alert("Этот никнейм уже занят! Выберите другой.");

    // Отправляем запрос в Supabase Auth
    const { error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPass,
      options: {
        data: { nick: authNick }
      }
    });

    if (error) return alert("Ошибка: " + error.message);

    // Переключаем на ввод кода
    setAuthMode("verify"); 
  };

  const handleVerifyCode = async () => {
    if (!verifyCode.trim()) return alert("Введите код из письма!");
    
    const { error } = await supabase.auth.verifyOtp({
      email: authEmail,
      token: verifyCode,
      type: 'signup'
    });

    if (error) return alert("Неверный код или он истек!");

    const isBanned = await checkBanStatus(authNick);
    if (isBanned) return;

    const isOwner = authNick === OWNER_NICK;
    const newUser: Player = {
      id: Date.now().toString(), nick: authNick, email: authEmail,
      game: "CS2", rank: isOwner ? "Owner" : "Новичок", roles: ["IGL"],
      bio: "Ищу тиммейтов", online: true, vibe: "Спокойно", isOwner, photos: []
    };
    
    const newSessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('void_session', newSessionId);
    
    // Создаем запись в БД
    await supabase.from('players').insert([{ 
      nick: authNick, 
      rank: newUser.rank, 
      session_id: newSessionId 
    }]);
    
    await supabase.from('messages').insert([{ sender: 'system', receiver: authNick, text: `Вы успешно вошли в аккаунт.` }]);

    localStorage.setItem("void_user", JSON.stringify(newUser));
    setMe(newUser); setDraft(newUser); setIsAuth(true); setAuthMode("login");
    setHasProfile(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("void_user"); localStorage.removeItem("void_session"); setIsAuth(false); setShowUserMenu(false); setHasProfile(false);
    setMe({ id: "guest", nick: "guest", email: "", game: "CS2", rank: "Гость", roles: [], bio: "", online: true, vibe: "", photos: [] });
    setCurrentView("main");
  };

  const handleLogoutAll = async () => {
    if (!window.confirm("Вы уверены, что хотите выйти на ВСЕХ устройствах?")) return;
    await supabase.from('players').update({ session_id: 'force_logout_' + Date.now() }).eq('nick', me.nick);
    handleLogout();
  };

  const requireAuth = (action: () => void) => {
    if (!isAuth || me.nick === "guest") { alert("Для этого действия нужно войти в аккаунт!"); setIsAuth(false); return; }
    action();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onloadend = async () => { setAvatarUrl(reader.result as string); await saveImage(`avatar_${me.nick}`, reader.result as string); }; reader.readAsDataURL(file);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onloadend = async () => { setBannerUrl(reader.result as string); await saveImage(`banner_${me.nick}`, reader.result as string); }; reader.readAsDataURL(file);
  };

  const handleProfilePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        setMe(prev => { const newPhotos = [...(prev.photos || []), reader.result as string]; saveImage(`photos_${me.nick}`, JSON.stringify(newPhotos)); return {...prev, photos: newPhotos}; });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDraftPhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDraft(prev => ({ ...prev, photos: [...(prev.photos || []), reader.result as string] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteAvatar = async () => { setAvatarUrl(logo); await saveImage(`avatar_${me.nick}`, ""); };
  const handleDeletePhoto = async (index: number) => { 
    const newPhotos = me.photos?.filter((_, i) => i !== index) || []; 
    setMe({ ...me, photos: newPhotos }); 
    await saveImage(`photos_${me.nick}`, JSON.stringify(newPhotos)); 
  };

  const openProfile = () => { setDraft(me); setShowProfile(true); };
  const pickField = (patch: Partial<Player>) => setDraft({ ...draft, ...patch });

  const foundUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return [];
    return [me].filter(p => p.nick.toLowerCase().includes(q) || p.game.toLowerCase().includes(q) || p.rank.toLowerCase().includes(q));
  }, [userQuery, me]);

  const handleCreateThread = async () => {
    if (!newThreadTitle.trim()) return alert("Введите название");
    
    const isAdmin = me.isOwner || me.custom_role === "Модератор" || me.custom_role === "Хелпер";
    if (RESTRICTED_CATEGORIES.includes(newThreadCategory) && !isAdmin) {
      return alert("В этой категории могут создавать темы только администраторы!");
    }

    const { data, error } = await supabase.from('threads').insert([{
      title: newThreadTitle, author: me.nick, category: newThreadCategory, description: newThreadDesc,
      date: new Date().toLocaleDateString("ru-RU"), views: 0, likes: 0, dislikes: 0
    }]).select();

    if (error) return alert("Ошибка БД: " + error.message);
    if (data && data[0]) setThreads(prev => [{ ...data[0], replies: [] } as ForumThread, ...prev]);
    setNewThreadTitle(""); setNewThreadDesc(""); setShowCreateThread(false);
    setNotification("Тема создана!"); setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteThread = async (threadId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Удалить тему?")) return;
    await supabase.from('threads').delete().eq('id', threadId);
    setThreads(threads.filter(t => t.id !== threadId));
  };

  const handleDeleteReply = async (replyId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Удалить комментарий?")) return;
    await supabase.from('replies').delete().eq('id', replyId);
    if (selectedThread) setSelectedThread({ ...selectedThread, replies: selectedThread.replies?.filter(r => r.id !== replyId) });
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThread) return;
    if (me.muted_until && new Date(me.muted_until) > new Date()) return alert("Вы замучены!");
    
    const newReply = { 
      thread_id: selectedThread.id, author: me.nick, text: replyText, date: new Date().toLocaleDateString("ru-RU"), likes: 0, dislikes: 0, parent_id: replyToId 
    };
    const { data, error } = await supabase.from('replies').insert([newReply]).select();
    if (error) return alert("Ошибка: " + error.message);

    if (data && data[0]) setSelectedThread({ ...selectedThread, replies: [...(selectedThread.replies || []), data[0] as ForumReply] });

    if (replyToId) {
      const parentReply = selectedThread.replies?.find(r => r.id === replyToId);
      if (parentReply && parentReply.author !== me.nick) {
        await supabase.from('messages').insert([{ sender: 'system', receiver: parentReply.author, text: `Новый ответ на ваш комментарий в теме "${selectedThread.title}".` }]);
      }
    } else if (selectedThread.author !== me.nick) {
      await supabase.from('messages').insert([{ sender: 'system', receiver: selectedThread.author, text: `Новый ответ в вашей теме "${selectedThread.title}".` }]);
    }

    const { data: allPlayers } = await supabase.from('players').select('nick');
    if (allPlayers) {
      for (const p of allPlayers) {
        if (replyText.includes(`@${p.nick}`) && p.nick !== me.nick) {
          const isParentAuthor = replyToId && selectedThread.replies?.find(r => r.id === replyToId)?.author === p.nick;
          const isThreadAuthor = selectedThread.author === p.nick;
          
          if (!isParentAuthor && !isThreadAuthor) {
            await supabase.from('messages').insert([{ sender: 'system', receiver: p.nick, text: `Вас упомянули в теме "${selectedThread.title}".` }]);
          }
        }
      }
    }

    setReplyText(""); setReplyToId(null);
  };

  const handleLike = async (threadId: number, isLike: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (me.nick === "guest") return alert("Войдите, чтобы ставить лайки!");
    
    let currentThread = threads.find(t => t.id === threadId);
    if (!currentThread && selectedThread && selectedThread.id === threadId) currentThread = selectedThread;
    if (!currentThread) return;
    
    const hasLiked = currentThread.liked_by?.includes(me.nick);
    const hasDisliked = currentThread.disliked_by?.includes(me.nick);
    let newLikes = currentThread.likes || 0;
    let newDislikes = currentThread.dislikes || 0;
    let newLikedBy = currentThread.liked_by ? [...currentThread.liked_by] : [];
    let newDislikedBy = currentThread.disliked_by ? [...currentThread.disliked_by] : [];

    if (isLike) {
      if (hasLiked) { newLikes -= 1; newLikedBy = newLikedBy.filter(n => n !== me.nick); }
      else { newLikes += 1; newLikedBy.push(me.nick); if (hasDisliked) { newDislikes -= 1; newDislikedBy = newDislikedBy.filter(n => n !== me.nick); } }
    } else {
      if (hasDisliked) { newDislikes -= 1; newDislikedBy = newDislikedBy.filter(n => n !== me.nick); }
      else { newDislikes += 1; newDislikedBy.push(me.nick); if (hasLiked) { newLikes -= 1; newLikedBy = newLikedBy.filter(n => n !== me.nick); } }
    }

    await supabase.from('threads').update({ likes: newLikes, dislikes: newDislikes, liked_by: newLikedBy, disliked_by: newDislikedBy }).eq('id', threadId);
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, likes: newLikes, dislikes: newDislikes, liked_by: newLikedBy, disliked_by: newDislikedBy } : t));
    
    if (selectedThread && selectedThread.id === threadId) {
      setSelectedThread(prev => prev ? { ...prev, likes: newLikes, dislikes: newDislikes, liked_by: newLikedBy, disliked_by: newDislikedBy } : null);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    if (me.muted_until && new Date(me.muted_until) > new Date()) return alert("Вы замучены!");
    await supabase.from('chat_messages').insert([{ author: me.nick, text: chatInput }]);
    setChatInput("");
  };

  const handleClearChat = async () => {
    if (!window.confirm("Очистить весь чат?")) return;
    await supabase.from('chat_messages').delete().neq('id', 0);
    setChatMessages([]);
  };

  const handleStartNewChat = (nick: string) => {
    if (!nick.trim()) return;
    if (nick === me.nick) return alert("Нельзя написать самому себе!");
    setActiveDialog(nick); setShowNewChat(false); setNewChatNick("");
  };

  const handleSendDM = async (receiver: string) => {
    if (!dmInput.trim() && !dmImage) return;
    if (me.muted_until && new Date(me.muted_until) > new Date()) return alert("Вы замучены!");

    if (dmImage) await supabase.from('messages').insert([{ sender: me.nick, receiver: receiver, text: `[ФОТО] ${dmImage}` }]);
    else await supabase.from('messages').insert([{ sender: me.nick, receiver: receiver, text: dmInput }]);

    setDmInput(""); setDmImage(null);
  };

  const handleDeleteDM = async (msgId: number) => {
    await supabase.from('messages').delete().eq('id', msgId);
    setInboxMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const handleDeleteChatHistory = async (userNick: string) => {
    if (!window.confirm(`Удалить историю с ${userNick}?`)) return;
    await supabase.from('messages').delete().or(`and(sender.eq.${me.nick},receiver.eq.${userNick}),and(sender.eq.${userNick},receiver.eq.${me.nick})`);
    setInboxMessages(prev => prev.filter(m => !(m.sender === me.nick && m.receiver === userNick) && !(m.sender === userNick && m.receiver === me.nick)));
    setChatMenuOpen(false);
  };

  const handleSendComment = async (targetNick: string) => {
    if (!commentText.trim()) return;
    if (me.muted_until && new Date(me.muted_until) > new Date()) return alert("Вы замучены!");
    const newComment = { sender: 'system', receiver: targetNick, text: `[КОММЕНТАРИЙ ОТ @${me.nick}] ${commentText}` };
    const { data } = await supabase.from('messages').insert([newComment]).select();
    if (data && data[0]) setComments(prev => [data[0], ...prev]);
    setCommentText("");
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm("Удалить комментарий?")) return;
    await supabase.from('messages').delete().eq('id', commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleDeleteProfile = async (targetNick: string) => {
    if (!window.confirm("Вы уверены, что хотите УДАЛИТЬ анкету? Это действие необратимо.")) return;
    await supabase.from('players').delete().eq('nick', targetNick);
    
    if (targetNick === me.nick) {
      setHasProfile(false);
      setMe(prev => ({ ...prev, bio: "", photos: [], age: undefined, platform: undefined, hasMic: undefined }));
      setDraft(prev => ({ ...prev, bio: "", photos: [], age: undefined, platform: undefined, hasMic: undefined }));
      await saveImage(`photos_${me.nick}`, JSON.stringify([]));
      setCurrentView("main");
    } else { setAdminTarget(null); setCurrentView("main"); }
  };

  const handleCreateProfile = async () => {
    if (!hasProfile && me.nick !== "guest") {
      const { error } = await supabase.from('players').insert([{ nick: me.nick, rank: me.rank, custom_role: null }]);
      if (!error) { setHasProfile(true); setCurrentView("profile"); setViewedProfile(me); } 
      else alert("Ошибка при создании: " + error.message);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim() || !showReport) return;
    const { error } = await supabase.from('messages').insert([{ sender: me.nick, receiver: OWNER_NICK, text: `[ЖАЛОБА] Тип: ${showReport.type}, ID: ${showReport.id}. Причина: ${reportReason}` }]);
    if (error) alert("Ошибка: " + error.message);
    else { setShowReport(null); setReportReason(""); alert("Жалоба отправлена!"); }
  };

  const handleAdminUpdate = (patch: Partial<Player>) => {
    setAdminTarget(prev => prev ? { ...prev, ...patch } : null);
    if (patch.banned && adminTarget?.nick === me.nick) handleLogout();
  };

  const renderAdminPanel = () => {
    if (!adminTarget) return null;
    const handleUpdateDB = async (patch: any) => { await supabase.from('players').update(patch).eq('nick', adminTarget.nick); handleAdminUpdate(patch); };
    const giveWarn = async () => {
      const newWarns = (adminTarget.warns || 0) + 1;
      await handleUpdateDB({ warns: newWarns });
      if (newWarns >= 3) { await handleUpdateDB({ banned: true }); alert("3 варна! Пользователь забанен."); }
    };
    const muteUserCustom = async () => {
      const minutes = parseFloat(customMuteMinutes);
      if (isNaN(minutes) || minutes <= 0) return alert("Введите корректное число минут");
      const until = new Date(Date.now() + minutes * 60000).toISOString();
      await handleUpdateDB({ muted_until: until });
      await supabase.from('messages').insert([{ sender: 'system', receiver: adminTarget.nick, text: `Вам выдан мут на ${minutes} минут.` }]);
      setCustomMuteMinutes(""); alert(`Замучен на ${minutes} мин.`);
    };
    const banUserCustom = async () => {
      const minutes = parseFloat(customBanMinutes);
      if (isNaN(minutes) || minutes <= 0) return alert("Введите корректное число минут");
      const until = new Date(Date.now() + minutes * 60000).toISOString();
      await handleUpdateDB({ banned: true, banned_until: until });
      await supabase.from('messages').insert([{ sender: 'system', receiver: adminTarget.nick, text: `Вы были забанены на ${minutes} минут.` }]);
      setCustomBanMinutes(""); alert(`Забанен на ${minutes} мин.`);
    };
    const banPerm = async () => {
      await handleUpdateDB({ banned: true, banned_until: null });
      await supabase.from('messages').insert([{ sender: 'system', receiver: adminTarget.nick, text: `Вы были забанены навсегда.` }]);
      alert("Забанен навсегда");
    };
    const unmuteUser = async () => { await handleUpdateDB({ muted_until: null }); alert("Мут снят."); };
    const unbanUser = async () => { await handleUpdateDB({ banned: false, banned_until: null }); alert("Бан снят."); };

    return (
      <div className="gs-modal">
        <div className="gs-backdrop" onClick={() => setAdminTarget(null)} />
        <div className="gs-sheet" style={{ maxWidth: "500px" }}>
          <div className="gs-sheet-head">
            <div><h4>Админ-панель</h4><p className="text-xs text-gray-400">@{adminTarget.nick}</p></div>
            <button className="gs-close" onClick={() => setAdminTarget(null)}><X size={16} /></button>
          </div>
          <div className="flex flex-col gap-3 mt-2">
            <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-2 text-yellow-500"><ShieldAlert size={20} /><span className="font-bold">Варны: {adminTarget.warns || 0}</span></div>
              <button onClick={giveWarn} className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded text-sm font-bold transition-all">Выдать варн</button>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-blue-500 mb-1">
                <div className="flex items-center gap-2"><VolumeX size={20} /><span className="font-bold">Мут</span></div>
                {adminTarget.muted_until && new Date(adminTarget.muted_until) > new Date() && <span className="text-xs text-red-400">До {new Date(adminTarget.muted_until).toLocaleString()}</span>}
              </div>
              <div className="flex gap-2">
                <input type="number" placeholder="Мин. (напр. 30)" value={customMuteMinutes} onChange={(e) => setCustomMuteMinutes(e.target.value)} className="flex-1 bg-black border border-zinc-700 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-all" />
                <button onClick={muteUserCustom} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold transition-all">Замутить</button>
              </div>
              <button onClick={unmuteUser} className="w-full bg-green-600/20 hover:bg-green-600/40 text-green-400 py-2 rounded text-xs font-bold transition-all mt-1">Снять мут</button>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-red-500 mb-1">
                <div className="flex items-center gap-2"><Ban size={20} /><span className="font-bold">{adminTarget.banned ? "Забанен" : "Активен"}</span></div>
                {adminTarget.banned && adminTarget.banned_until && <span className="text-xs text-gray-400">До {new Date(adminTarget.banned_until).toLocaleString()}</span>}
              </div>
              <div className="flex gap-2">
                <input type="number" placeholder="Мин. (напр. 60)" value={customBanMinutes} onChange={(e) => setCustomBanMinutes(e.target.value)} className="flex-1 bg-black border border-zinc-700 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-red-500 transition-all" />
                <button onClick={banUserCustom} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm font-bold transition-all">Забанить</button>
              </div>
              <div className="flex gap-2 mt-1">
                <button onClick={banPerm} className="flex-1 bg-red-900/40 hover:bg-red-900/60 text-red-400 py-2 rounded text-xs font-bold transition-all">Навсегда</button>
                <button onClick={unbanUser} className="flex-1 bg-green-900/40 hover:bg-green-900/60 text-green-400 py-2 rounded text-xs font-bold transition-all">Разбанить</button>
              </div>
            </div>
            <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
              <div className="flex items-center gap-2 text-purple-500 mb-3"><Shield size={20} /><span className="font-bold">Кастомная роль</span></div>
              <div className="flex flex-wrap gap-2 mb-2">
                {["VIP", "Модератор", "Хелпер"].map(role => (
                  <button key={role} onClick={() => handleUpdateDB({ custom_role: role })} className={`px-3 py-1.5 border rounded text-xs font-bold transition-all ${adminTarget.custom_role === role ? "bg-purple-600 text-white border-purple-500" : "border-purple-500/50 text-purple-400 hover:bg-purple-500 hover:text-white"}`}>{role}</button>
                ))}
              </div>
              <input className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-white text-sm mt-2 transition-all focus:border-purple-500" placeholder="Своя роль..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleUpdateDB({ custom_role: (e.target as HTMLInputElement).value }); (e.target as HTMLInputElement).value = ""; } }} />
            </div>
            <button onClick={() => handleDeleteProfile(adminTarget.nick)} className="w-full bg-red-900/40 hover:bg-red-900/60 text-red-400 font-bold py-3 rounded-lg mt-2 transition-all">Удалить анкету</button>
          </div>
        </div>
      </div>
    );
  };

  const formattedTime = currentTime.toLocaleTimeString("ru-RU");

  // ================== АВТОРИЗАЦИЯ ==================
  if (!isAuth) {
    return (
      <div className="gs bg-black min-h-screen flex items-center justify-center text-white font-sans">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl w-full max-w-md relative transition-all duration-300 hover:border-purple-500/50">
          <button onClick={() => { setIsAuth(true); setMe({ id: "guest", nick: "guest", email: "", game: "CS2", rank: "Гость", roles: [], bio: "", online: true, vibe: "", photos: [] }); setCurrentView("main"); }} className="absolute top-4 right-4 text-xs text-gray-500 hover:text-white border border-zinc-700 hover:border-purple-500 px-3 py-1.5 rounded-lg transition-all">Продолжить как гость →</button>
          <h2 className="text-3xl font-black text-center mb-6 gs-logo-rainbow">VOID</h2>
          {authError && <div className="bg-red-500/10 border border-red-500 text-red-500 text-sm p-3 rounded-lg mb-4 text-center">{authError}</div>}
          {authMode !== "verify" ? (
            <>
              <div className="flex gap-4 mb-6 border-b border-zinc-800 pb-2">
                <button onClick={() => setAuthMode("login")} className={`flex-1 font-bold pb-2 transition-all ${authMode === "login" ? "text-purple-500 border-b-2 border-purple-500" : "text-gray-500"}`}>Вход</button>
                <button onClick={() => setAuthMode("register")} className={`flex-1 font-bold pb-2 transition-all ${authMode === "register" ? "text-purple-500 border-b-2 border-purple-500" : "text-gray-500"}`}>Регистрация</button>
              </div>
              <div className="flex flex-col gap-4">
                <div><label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Никнейм</label><input className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-all" value={authNick} onChange={(e) => setAuthNick(e.target.value)} /></div>
                {authMode === "register" && (<div><label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Email</label><input type="email" className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-all" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} /></div>)}
                <div><label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Пароль</label><input type="password" className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-all" value={authPass} onChange={(e) => setAuthPass(e.target.value)} /></div>
                <button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg mt-2 transition-all hover:scale-[1.02]" onClick={authMode === "login" ? handleLogin : handleRequestCode}>{authMode === "login" ? "Войти" : "Получить код"}</button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-400 text-center mb-2">Код отправлен на почту <b>{authEmail}</b></p>
              <p className="text-xs text-gray-500 text-center mb-2">Проверь папку Спам, если письма нет в течение минуты.</p>

              <input className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-center text-2xl tracking-[0.5em] text-white focus:outline-none focus:border-purple-500 transition-all" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} placeholder="000000" maxLength={6} />
              <button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg mt-2 transition-all hover:scale-[1.02]" onClick={handleVerifyCode}>Подтвердить</button>
              <button className="text-sm text-gray-500 hover:text-white mt-2" onClick={() => setAuthMode("register")}>Назад</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ================== ГЛАВНАЯ ==================
  if (currentView === "main") {
    return (
      <div className="gs bg-black text-white font-sans min-h-screen">
        {notification && <div className="fixed top-4 right-4 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg z-[100] animate-bounce">{notification}</div>}
        <div className="gs-noise" aria-hidden />
        <div className="gs-glow" aria-hidden><i /><i /></div>
        
        <div className="gs-wrap">
          <header className="gs-header relative z-50">
            <div className="gs-brand cursor-pointer" onClick={() => window.location.reload()}>
              <div className="gs-logo"><img src={logo} alt="VOID" /></div>
              <div><h1 className="gs-display gs-logo-rainbow">VOID</h1><small style={{ fontVariantNumeric: "tabular-nums" }}>{formattedTime}</small></div>
            </div>
            <div className="gs-head-right">
              <span className="gs-online"><b /> online {onlineCount}</span>
              <div className="flex gap-2 mr-4">
                <button className="gs-btn gs-btn-ghost" title="Общий чат" onClick={() => requireAuth(() => setShowChat(true))}><MessageSquare size={16} /></button>
                <button className="gs-btn gs-btn-ghost" title="Личные сообщения" onClick={() => requireAuth(() => setShowInbox(true))}>📱</button>
                <button className="gs-btn gs-btn-ghost" title="Форум" onClick={() => setCurrentView("forum")}><Users size={16} /></button>
                <a href="https://tapurl.ru/voidlink" target="_blank" rel="noopener noreferrer" className="gs-btn gs-btn-ghost flex items-center justify-center"><LinkIcon size={16} /></a>
              </div>
              <div className="relative">
                <button className="gs-btn gs-btn-sm" style={{ border: "1px solid var(--line-2)", background: "#1b1526", color: "#cbbfe0" }} onClick={() => setShowUserMenu(!showUserMenu)}>
                  <UserRound size={16} /> <span style={{ textTransform: "none" }}>{me.nick}</span>{me.isOwner && <span className="gs-owner-badge text-[9px] ml-2">OWNER</span>}
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50">
                    {me.nick !== "guest" ? (
                      <>
                        <button className="w-full text-left px-4 py-3 text-sm hover:bg-zinc-800 border-b border-zinc-800 transition-colors" onClick={() => { setCurrentView("profile"); setViewedProfile(me); setShowUserMenu(false); }}>Профиль</button>
                        {me.isOwner && <button className="w-full text-left px-4 py-3 text-sm text-purple-400 hover:bg-purple-500/10 border-b border-zinc-800 transition-colors" onClick={() => { setAdminTarget(me); setShowUserMenu(false); }}>Админ-панель</button>}
                        <button className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors" onClick={handleLogout}>Выйти</button>
                        <button className="w-full text-left px-4 py-3 text-sm text-orange-400 hover:bg-orange-500/10 border-t border-zinc-800 transition-colors" onClick={handleLogoutAll}>Выйти на всех устройствах</button>
                      </>
                    ) : (
                      <button className="w-full text-left px-4 py-3 text-sm text-purple-400 hover:bg-purple-500/10 transition-colors" onClick={() => setIsAuth(false)}>Войти в аккаунт</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>

          <section className="gs-hero">
            <h2>Найди тиммейта<br /><em>и дойди до MAJOR/FPL</em> или INTORNATIONAL</h2>
            <p>не забудь поспать</p>
            <div className="gs-actions">
              {hasProfile ? (
                <button className="gs-btn gs-btn-primary border-purple-500 transition-all hover:scale-105" onClick={() => requireAuth(() => { setCurrentView("profile"); setViewedProfile(me); })}><UserRound size={16} /> Моя анкета</button>
              ) : (
                <button className="gs-btn gs-btn-primary border-purple-500 animate-pulse" onClick={() => requireAuth(() => handleCreateProfile())}><Plus size={16} /> Создать анкету</button>
              )}
              <button className="gs-btn gs-btn-ghost border-purple-500 transition-all hover:scale-105" onClick={() => { setUserQuery(""); setShowUserSearch(true); }}><Search size={16} /> Найти пользователя</button>
            </div>
          </section>

          <div className="gs-sec flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h3>Доска анкет</h3>
              <span className="gs-rule" />
              <button onClick={() => requireAuth(() => handleCreateProfile())} className="bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/50 p-1.5 rounded-full transition-all hover:scale-110 flex items-center justify-center" title="Создать новую анкету"><Plus size={16} /></button>
            </div>
            <span className="gs-count">1 из 1</span>
          </div>
          
          {me.nick !== "guest" && hasProfile ? (
            <div className="gs-grid">
              <article className="gs-card bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-purple-500 transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-lg hover:shadow-purple-500/20" onClick={() => { setAnketaTarget(me); setShowAnketaModal(true); }}>
                <div className="p-4">
                  <div className="gs-card-top flex gap-4 items-center">
                    <div className="gs-ava relative" style={{ width: "64px", height: "64px", flexShrink: 0, borderRadius: "12px", overflow: "hidden" }}>
                      <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      <span className="gs-dot" data-on={me.online ? "true" : "false"} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="flex items-center gap-2"><h3 className="text-lg font-bold text-gray-100">{me.nick}</h3>{me.isOwner && <span className="gs-owner-badge text-[10px]">OWNER</span>}</div>
                      <p className="text-xs text-gray-400 mt-1">{me.game} · {me.rank}</p>
                    </div>
                  </div>
                  {me.bio && <p className="text-sm text-gray-400 mt-3 line-clamp-2">{me.bio}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {me.roles.map((r) => <span key={r} className="text-[10px] font-bold px-2 py-0.5 bg-zinc-800 text-gray-300 rounded border border-zinc-700 uppercase">{r}</span>)}
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-900/40 text-purple-300 rounded border border-purple-500/30 uppercase">{me.vibe}</span>
                  </div>
                </div>
                <div className="p-4 border-t border-zinc-800/50 flex gap-2 bg-transparent">
                  <button className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg text-sm transition-all" onClick={(e) => { e.stopPropagation(); openProfile(); }}>Редактировать</button>
                  {me.isOwner && (<button className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-500 font-bold py-2 px-3 rounded-lg text-sm transition-all" onClick={(e) => { e.stopPropagation(); setAdminTarget(me); }}>Админ</button>)}
                </div>
              </article>
            </div>
          ) : (
             <div className="text-center p-10 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30 transition-all hover:bg-zinc-900/50">
               <p className="text-gray-400 mb-4">{me.nick === "guest" ? "Вы зашли как гость. Войдите, чтобы создать анкету." : "У вас пока нет анкеты."}</p>
               {me.nick === "guest" ? (<button className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded-lg transition-all hover:scale-105" onClick={() => setIsAuth(false)}>Войти</button>) : (<button className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded-lg transition-all hover:scale-105" onClick={handleCreateProfile}>Создать анкету</button>)}
             </div>
          )}
          <footer className="gs-footer mt-12"><span className="brand">vo<b>id</b></span><span> VOID · забудь о рандомах</span></footer>
        </div>

        {me.nick !== "guest" && (
          <button onClick={() => { setActiveDialog(OWNER_NICK); setShowInbox(true); }} className="fixed bottom-6 right-6 w-16 h-16 bg-[#1a1a1a] border-2 border-[#fbbf24] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:scale-105 hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] transition-all z-50 group"><MessageSquare size={28} className="text-[#fbbf24] group-hover:text-[#fcd34d] transition-colors" /></button>
        )}

        {/* МОДАЛКА ПРОСМОТРА АНКЕТЫ */}
        {showAnketaModal && anketaTarget && (
          <div className="gs-modal" style={{ zIndex: 90 }}>
            <div className="gs-backdrop" onClick={() => setShowAnketaModal(false)} />
            <div className="gs-sheet" style={{ maxWidth: "600px" }}>
              <div className="gs-sheet-head"><div><h4>Анкета</h4></div><button className="gs-close" onClick={() => setShowAnketaModal(false)}><X size={16} /></button></div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0 flex flex-col gap-2">
                    <div className="w-full md:w-48 h-64 bg-black border border-zinc-800 rounded-xl overflow-hidden relative group">
                      {anketaTarget.photos && anketaTarget.photos.length > 0 ? (
                        <>
                          <img src={anketaTarget.photos[currentPhotoIndex] || anketaTarget.photos[0]} alt="Фото" className="w-full h-full object-cover transition-opacity duration-300" />
                          {anketaTarget.photos.length > 1 && (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(prev => prev === 0 ? anketaTarget.photos!.length - 1 : prev - 1); }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 p-1.5 rounded-full text-white hover:bg-purple-600 transition-colors opacity-0 group-hover:opacity-100"><ArrowLeft size={16} /></button>
                              <button onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(prev => prev === anketaTarget.photos!.length - 1 ? 0 : prev + 1); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 p-1.5 rounded-full text-white hover:bg-purple-600 transition-colors opacity-0 group-hover:opacity-100"><ArrowLeft size={16} className="rotate-180" /></button>
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 bg-black/60 px-2 py-1 rounded-full">{anketaTarget.photos.map((_, i) => (<div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentPhotoIndex ? "bg-purple-500 scale-125" : "bg-gray-500"}`} />))}</div>
                            </>
                          )}
                        </>
                      ) : (<div className="w-full h-full flex flex-col items-center justify-center text-gray-600"><ImagePlus size={32} className="mb-2 opacity-50" /><span className="text-xs">Нет фото</span></div>)}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="flex items-center gap-2"><h3 className="text-xl font-bold text-white">{anketaTarget.nick}</h3>{anketaTarget.isOwner && <span className="gs-owner-badge text-[10px]">OWNER</span>}</div>
                    <p className="text-sm text-gray-400">{anketaTarget.game} · {anketaTarget.rank}</p>
                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 flex flex-col gap-2 text-sm">
                      <div><span className="text-xs text-gray-500 uppercase font-bold block mb-1">О себе</span><p className="text-sm text-gray-300">{anketaTarget.bio || "Пусто"}</p></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-xs text-gray-500 uppercase font-bold block mb-1">Возраст</span><p className="text-gray-300">{anketaTarget.age || "Не указан"}</p></div>
                        <div><span className="text-xs text-gray-500 uppercase font-bold block mb-1">Платформа</span><p className="text-gray-300">{anketaTarget.platform || "Не указана"}</p></div>
                        <div><span className="text-xs text-gray-500 uppercase font-bold block mb-1">Микрофон</span><p className="text-gray-300">{anketaTarget.hasMic ? "Да" : "Нет"}</p></div>
                        <div><span className="text-xs text-gray-500 uppercase font-bold block mb-1">Стиль</span><p className="text-gray-300">{anketaTarget.vibe || "Не указан"}</p></div>
                      </div>
                      <div><span className="text-xs text-gray-500 uppercase font-bold block mb-1">Роли</span><div className="flex flex-wrap gap-1">{anketaTarget.roles.map(r => <span key={r} className="text-[10px] font-bold px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-gray-300 rounded uppercase">{r}</span>)}</div></div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  {me.nick !== anketaTarget.nick ? (
                    <>
                      <button onClick={() => { setActiveDialog(anketaTarget.nick); setShowInbox(true); setShowAnketaModal(false); }} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"><MessageSquare size={18} /> Написать в личку</button>
                      <button onClick={() => { setViewedProfile(anketaTarget); setCurrentView("profile"); setShowAnketaModal(false); }} className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white font-bold px-6 rounded-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"><UserRound size={18} /> Профиль</button>
                    </>
                  ) : (<button onClick={() => { openProfile(); setShowAnketaModal(false); }} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-all hover:scale-[1.02]">Редактировать анкету</button>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* МОДАЛКИ */}
        {showChat && (
          <div className="gs-modal">
            <div className="gs-backdrop" onClick={() => setShowChat(false)} />
            <div className="gs-sheet">
              <div className="gs-sheet-head">
                <div className="flex items-center gap-4">
                  <h4>Общий чат</h4>
                  {me.isOwner && <button onClick={handleClearChat} className="text-xs text-red-500 hover:text-red-400 font-bold border border-red-500/30 px-2 py-1 rounded bg-red-500/10 transition-colors">Очистить</button>}
                  <button onClick={() => playNotificationSound()} className="text-xs text-purple-400 hover:text-white border border-purple-500/50 px-2 py-1 rounded bg-purple-500/10 transition-colors">🎵 Тест звука</button>
                </div>
                <button className="gs-close" onClick={() => setShowChat(false)}><X size={16} /></button>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex-1 bg-zinc-900 rounded-lg p-4 h-[400px] overflow-y-auto flex flex-col gap-2">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`p-2 rounded-lg max-w-[80%] text-sm ${msg.author === me.nick ? "bg-purple-600 text-white self-end" : "bg-zinc-800 text-gray-200 self-start"}`}>
                      <p className="text-xs opacity-50 mb-1">@{msg.author}</p>
                      <FormatText text={msg.text} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <textarea className="flex-1 bg-black border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 resize-none transition-all" rows={1} placeholder="Написать..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }} />
                  <button className="bg-purple-600 hover:bg-purple-500 text-white px-6 rounded-lg font-bold transition-all hover:scale-[1.02]" onClick={handleSendChat}><Send size={18} /></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showInbox && (
          <div className="gs-modal" style={{ zIndex: 100 }}>
            <div className="gs-backdrop" onClick={() => setShowInbox(false)} />
            <div className="gs-sheet" style={{ maxWidth: "1100px", width: "95%", height: "85vh", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden", borderRadius: "16px" }}>
              <div className="gs-sheet-head" style={{ padding: "16px 24px", margin: 0, borderBottom: "1px solid #27272a", background: "#18181b" }}>
                <div className="flex-1 flex justify-center"><h4 className="gs-logo-rainbow text-2xl font-black uppercase tracking-widest animate-pulse" style={{ margin: 0 }}>VOID</h4></div>
                <button className="gs-close absolute right-4" onClick={() => setShowInbox(false)}><X size={20} /></button>
              </div>
              <div className="flex flex-1 overflow-hidden">
                <div className="w-1/3 min-w-[280px] max-w-[350px] border-r border-zinc-800 bg-[#09090b] flex flex-col">
                  <div className="p-4 border-b border-zinc-800 flex gap-2 items-center">
                    <div className="gs-search flex-1 bg-zinc-900"><Search size={16} /><input placeholder="Поиск..." value={inboxSearchQuery} onChange={(e) => setInboxSearchQuery(e.target.value)} /></div>
                    <button onClick={() => setShowNewChat(true)} className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-lg text-sm flex items-center gap-1 transition-all hover:scale-[1.05] flex-shrink-0" title="Новый чат"><Plus size={16} /> Написать</button>
                  </div>
                  <div className="flex-1 overflow-y-auto flex flex-col">
                    <div onClick={() => { setActiveDialog('system'); setChatMenuOpen(false); }} className={`p-4 border-b border-zinc-800/50 cursor-pointer flex items-center gap-3 transition-colors ${activeDialog === 'system' ? "bg-purple-600/10 border-l-4 border-l-purple-500" : "hover:bg-zinc-900"}`}>
                      <div className="w-10 h-10 rounded-full bg-purple-900 flex items-center justify-center font-bold text-purple-300 flex-shrink-0"><Shield size={20} /></div>
                      <div className="flex-1 overflow-hidden"><p className="font-bold text-sm text-purple-400 truncate">Система</p><p className="text-xs text-gray-500 truncate">Уведомления...</p></div>
                    </div>
                    
                    {Array.from(new Set(inboxMessages.filter(m => m.sender === me.nick || m.receiver === me.nick).map(m => m.sender === me.nick ? m.receiver : m.sender)))
                      .filter(u => u !== 'system')
                      .filter(u => u.toLowerCase().includes(inboxSearchQuery.toLowerCase()))
                      .map(user => (
                      <div key={user} onClick={() => { setActiveDialog(user); setChatMenuOpen(false); }} className={`p-4 border-b border-zinc-800/50 cursor-pointer flex items-center gap-3 transition-colors ${activeDialog === user ? "bg-purple-600/10 border-l-4 border-l-purple-500" : "hover:bg-zinc-900"}`}>
                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-gray-300 flex-shrink-0">{user[0]?.toUpperCase()}</div>
                        <div className="flex-1 overflow-hidden"><p className="font-bold text-sm text-gray-200 truncate">{user}</p><p className="text-xs text-gray-500 truncate">Нажмите, чтобы открыть...</p></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 flex flex-col bg-[#0c0c0e] relative">
                  {activeDialog ? (
                    <>
                      <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-900/40 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${activeDialog === 'system' ? 'bg-purple-900 text-purple-300' : 'bg-purple-600'}`}>{activeDialog === 'system' ? <Shield size={16} /> : activeDialog[0].toUpperCase()}</div>
                        <h5 className="font-bold text-white flex-1">{activeDialog === 'system' ? 'Системные уведомления' : activeDialog}</h5>
                        
                        <div className="relative">
                          <button onClick={() => setChatMenuOpen(!chatMenuOpen)} className="p-2 hover:bg-zinc-700 rounded-lg text-gray-400 hover:text-white transition-colors"><MoreVertical size={20} /></button>
                          {chatMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
                              <button onClick={() => handleDeleteChatHistory(activeDialog)} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors">Удалить историю</button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
                        {inboxMessages.filter(m => (m.sender === me.nick && m.receiver === activeDialog) || (m.sender === activeDialog && m.receiver === me.nick)).reverse().map(msg => {
                            const isMe = msg.sender === me.nick;
                            const isImage = msg.text.startsWith("[ФОТО] ");
                            const textContent = isImage ? "" : msg.text;
                            const imgContent = isImage ? msg.text.replace("[ФОТО] ", "") : null;
                            return (
                              <div key={msg.id} className={`group relative max-w-[75%] p-3 rounded-xl text-sm shadow-sm ${isMe ? "bg-zinc-800 text-gray-200 self-start rounded-tl-sm" : activeDialog === 'system' ? "bg-purple-900/40 border border-purple-500/30 text-gray-300 self-start rounded-tl-sm w-full max-w-full" : "bg-purple-600 text-white self-end rounded-tr-sm"}`}>
                                {imgContent ? <img src={imgContent} alt="фото" className="max-w-[250px] rounded-lg" /> : <FormatText text={textContent} />}
                                {isMe && activeDialog !== 'system' && <button onClick={() => handleDeleteDM(msg.id)} className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity"><Trash2 size={16} /></button>}
                              </div>
                            );
                        })}
                      </div>
                      {activeDialog !== 'system' && (
                        <div className="p-4 bg-[#18181b] border-t border-zinc-800 flex flex-col gap-2">
                          {dmImage && (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-700 mb-1">
                              <img src={dmImage} alt="preview" className="w-full h-full object-cover" />
                              <button onClick={() => setDmImage(null)} className="absolute top-0 right-0 bg-black/70 p-1 text-red-500 hover:text-white transition-colors"><X size={12}/></button>
                            </div>
                          )}
                          <div className="flex gap-2 items-center">
                            <button onClick={() => dmFileInputRef.current?.click()} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-gray-400 hover:text-purple-400 transition-colors"><ImagePlus size={20} /></button>
                            <input type="file" accept="image/*" ref={dmFileInputRef} style={{ display: "none" }} onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setDmImage(reader.result as string); reader.readAsDataURL(file); } }} />
                            <input className="flex-1 bg-black border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 text-sm transition-all" placeholder="Написать сообщение..." value={dmInput} onChange={(e) => setDmInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSendDM(activeDialog); }} />
                            <button className="bg-purple-600 hover:bg-purple-500 text-white p-3 rounded-lg transition-all flex items-center justify-center hover:scale-[1.05]" onClick={() => handleSendDM(activeDialog)}><Send size={18} /></button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 text-sm"><MessageSquare size={48} className="mb-4 opacity-20" /> Выберите, кому хотели бы написать</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showNewChat && (
          <div className="gs-modal" style={{ zIndex: 110 }}>
            <div className="gs-backdrop" onClick={() => setShowNewChat(false)} />
            <div className="gs-sheet" style={{ maxWidth: "400px" }}>
              <div className="gs-sheet-head"><div><h4>Новый чат</h4></div><button className="gs-close" onClick={() => setShowNewChat(false)}><X size={16} /></button></div>
              <div className="flex flex-col gap-4">
                <div><label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Никнейм пользователя</label><input className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-all" value={newChatNick} onChange={(e) => setNewChatNick(e.target.value)} placeholder="Введите ник..." /></div>
                <button className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-all hover:scale-[1.02]" onClick={() => handleStartNewChat(newChatNick)}>Создать чат</button>
              </div>
            </div>
          </div>
        )}

        {showReport && (
          <div className="gs-modal">
            <div className="gs-backdrop" onClick={() => setShowReport(null)} />
            <div className="gs-sheet">
              <div className="gs-sheet-head"><div><h4>Жалоба</h4></div><button className="gs-close" onClick={() => setShowReport(null)}><X size={16} /></button></div>
              <textarea className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white resize-none transition-all" rows={4} placeholder="Причина" value={reportReason} onChange={(e) => setReportReason(e.target.value)} />
              <button className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg mt-4 transition-all hover:scale-[1.02]" onClick={handleReport}>Отправить</button>
            </div>
          </div>
        )}

        {renderAdminPanel()}

        {showProfile && (
          <div className="gs-modal">
            <div className="gs-backdrop" onClick={() => setShowProfile(false)} />
            <div className="gs-sheet" style={{ maxWidth: "900px", width: "95%" }}>
              <div className="gs-sheet-head"><div><h4>Анкета</h4></div><button className="gs-close" onClick={() => setShowProfile(false)}><X size={16} /></button></div>
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-xs text-gray-500 uppercase font-bold mb-1 block">ник (нельзя изменить)</label><input disabled className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-gray-500 cursor-not-allowed" value={draft.nick} /></div>
                  <div><label className="text-xs text-gray-500 uppercase font-bold mb-1 block">ранг</label><input className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-all" value={draft.rank} onChange={(e) => pickField({ rank: e.target.value })} /></div>
                </div>
                <div><label className="text-xs text-gray-500 uppercase font-bold mb-2 block">игра</label><div className="flex flex-wrap gap-2">{GAMES.slice(1).map((g) => (<button key={g} className={`px-4 py-2 text-xs font-bold uppercase rounded border transition-all hover:scale-[1.05] ${draft.game === g ? "bg-purple-600 text-white border-purple-400" : "bg-zinc-900 text-gray-400 border-zinc-700 hover:border-purple-500"}`} onClick={() => pickField({ game: g })}>{g}</button>))}</div></div>
                <div><label className="text-xs text-gray-500 uppercase font-bold mb-2 block">роли</label><div className="flex flex-wrap gap-2">{ROLES.map((r) => (<button key={r} className={`px-4 py-2 text-xs font-bold uppercase rounded border transition-all hover:scale-[1.05] ${draft.roles.includes(r) ? "bg-purple-600 text-white border-purple-400" : "bg-zinc-900 text-gray-400 border-zinc-700 hover:border-purple-500"}`} onClick={() => pickField({ roles: draft.roles.includes(r) ? draft.roles.filter((x) => x !== r) : [...draft.roles, r] })}>{r}</button>))}</div></div>
                <div><label className="text-xs text-gray-500 uppercase font-bold mb-2 block">стиль игры</label><div className="flex flex-wrap gap-2">{VIBES.map((v) => (<button key={v} className={`px-4 py-2 text-xs font-bold uppercase rounded border transition-all hover:scale-[1.05] ${draft.vibe === v ? "bg-purple-600 text-white border-purple-400" : "bg-zinc-900 text-gray-400 border-zinc-700 hover:border-purple-500"}`} onClick={() => pickField({ vibe: v })}>{v}</button>))}</div></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Возраст</label><div className="flex flex-wrap gap-2">{AGES.map((a) => (<button key={a} className={`px-4 py-2 text-xs font-bold uppercase rounded border transition-all hover:scale-[1.05] ${draft.age === a ? "bg-purple-600 text-white border-purple-400" : "bg-zinc-900 text-gray-400 border-zinc-700 hover:border-purple-500"}`} onClick={() => pickField({ age: a })}>{a}</button>))}</div></div>
                  <div><label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Платформа</label><div className="flex flex-wrap gap-2">{PLATFORMS.map((p) => (<button key={p} className={`px-4 py-2 text-xs font-bold uppercase rounded border transition-all hover:scale-[1.05] ${draft.platform === p ? "bg-purple-600 text-white border-purple-400" : "bg-zinc-900 text-gray-400 border-zinc-700 hover:border-purple-500"}`} onClick={() => pickField({ platform: p })}>{p}</button>))}</div></div>
                  <div><label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Микрофон</label><div className="flex flex-wrap gap-2"><button className={`px-4 py-2 text-xs font-bold uppercase rounded border transition-all hover:scale-[1.05] ${draft.hasMic === true ? "bg-purple-600 text-white border-purple-400" : "bg-zinc-900 text-gray-400 border-zinc-700 hover:border-purple-500"}`} onClick={() => pickField({ hasMic: true })}>Да</button><button className={`px-4 py-2 text-xs font-bold uppercase rounded border transition-all hover:scale-[1.05] ${draft.hasMic === false ? "bg-purple-600 text-white border-purple-400" : "bg-zinc-900 text-gray-400 border-zinc-700 hover:border-purple-500"}`} onClick={() => pickField({ hasMic: false })}>Нет</button></div></div>
                </div>
                <div><label className="text-xs text-gray-500 uppercase font-bold mb-1 block">о себе</label><textarea className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white resize-none focus:outline-none focus:border-purple-500 transition-all" rows={3} value={draft.bio} onChange={(e) => pickField({ bio: e.target.value })} /></div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Фотографии</label>
                  <div className="flex flex-wrap gap-3">
                    {draft.photos?.map((photo, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-700 group transition-all hover:border-purple-500">
                        <img src={photo} alt={`Фото ${i}`} className="w-full h-full object-cover" />
                        <button onClick={() => setDraft({ ...draft, photos: draft.photos?.filter((_, index) => index !== i) })} className="absolute top-1 right-1 bg-black/70 rounded text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                      </div>
                    ))}
                    
                    <button onClick={() => draftPhotosInputRef.current?.click()} className="w-20 h-20 rounded-lg border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center text-gray-500 hover:text-purple-500 hover:border-purple-500 transition-all bg-zinc-900/50 hover:bg-zinc-900"><ImagePlus size={20} /><span className="text-[9px] font-bold mt-1 uppercase text-center leading-tight">Добавить<br/>фото</span></button>
                    <input type="file" multiple accept="image/*" ref={draftPhotosInputRef} style={{ display: "none" }} onChange={handleDraftPhotosChange} />
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-all hover:scale-[1.02]" onClick={() => { setMe(draft); setHasProfile(true); saveImage(`photos_${me.nick}`, JSON.stringify(draft.photos || [])); setShowProfile(false); }}>Сохранить</button>
                  <button className="px-6 border border-zinc-700 text-gray-400 rounded-lg transition-all hover:bg-zinc-800" onClick={() => setShowProfile(false)}>Отмена</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showUserSearch && (
          <div className="gs-modal">
            <div className="gs-backdrop" onClick={() => setShowUserSearch(false)} />
            <div className="gs-sheet">
              <div className="gs-sheet-head"><div><h4>Поиск</h4></div><button className="gs-close" onClick={() => setShowUserSearch(false)}><X size={16} /></button></div>
              <div className="gs-search w-full"><Search size={16} /><input autoFocus value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="введи ник…" /></div>
              <div className="flex flex-col gap-2 mt-4">
                {foundUsers.map((u) => (
                  <div key={u.id} className="gs-result cursor-pointer hover:bg-zinc-800 transition-colors" onClick={() => { setShowUserSearch(false); setViewedProfile(me); setCurrentView("profile"); }}>
                    <div className="gs-ava w-10 h-10 rounded-lg overflow-hidden"><img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /></div>
                    <div className="flex-1"><p className="n font-bold text-white">{u.nick}</p><p className="m text-xs text-gray-400">{u.game} · {u.rank}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================== ПРОФИЛЬ ==================
  if (currentView === "profile") {
    const isMyProfile = !viewedProfile || viewedProfile.nick === me.nick;
    const displayMe = viewedProfile || me;

    return (
      <div className="gs bg-black min-h-screen text-white font-sans">
        {notification && <div className="fixed top-4 right-4 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg z-[100] animate-bounce">{notification}</div>}
        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleAvatarChange} />
        <input type="file" accept="image/*" ref={bannerInputRef} style={{ display: "none" }} onChange={handleBannerChange} />
        <input type="file" multiple accept="image/*" ref={playerPhotosInputRef} style={{ display: "none" }} onChange={handleProfilePhotosChange} />
        <header className="flex justify-between items-center p-4 md:p-6 border-b border-gray-800">
          <div className="text-2xl font-black tracking-widest uppercase cursor-pointer" onClick={() => setCurrentView("main")}>VOID</div>
          <div className="flex gap-6 text-sm text-gray-400">
            <span className="hover:text-white cursor-pointer transition-colors" onClick={() => setCurrentView("main")}>Главная</span>
            <span className="hover:text-white cursor-pointer transition-colors" onClick={() => setCurrentView("forum")}>Форум</span>
            <span className="hover:text-white cursor-pointer text-red-400 transition-colors" onClick={handleLogout}>Выйти</span>
          </div>
          <div className="flex items-center gap-4"><div className="text-sm border border-gray-600 rounded-full px-3 py-1">0,00 P</div><div className="w-8 h-8 bg-gray-700 rounded-full"></div></div>
        </header>
        <main className="max-w-6xl mx-auto mt-4 px-4">
          <div className="relative mb-20">
            <div className="w-full h-48 md:h-80 bg-black border border-gray-800 rounded-lg overflow-hidden relative group">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bannerUrl})` }}></div>
              {isMyProfile && <button onClick={() => bannerInputRef.current?.click()} className="absolute top-4 right-4 p-2 bg-black/60 border border-gray-700 rounded hover:border-purple-500 text-gray-300 opacity-0 group-hover:opacity-100 transition-all z-10"><Edit size={16} /></button>}
            </div>
            <div className="absolute -bottom-16 left-4 md:left-8 flex items-end gap-6">
              <div className="relative"><div className="w-24 h-24 md:w-32 md:h-32 bg-black border-4 border-gray-700 rounded-xl overflow-hidden shadow-2xl transform rotate-3 flex items-center justify-center bg-gray-800"><img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /></div><div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div></div>
              <div className="mb-2 flex gap-2">{isMyProfile && me.isOwner && <button onClick={handleDeleteAvatar} className="p-2 bg-gray-900 border border-gray-700 rounded hover:border-red-500 text-red-500 transition-colors"><Trash2 size={16} /></button>}{isMyProfile && <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-gray-900 border border-gray-700 rounded hover:border-purple-500 text-gray-300 transition-colors"><Edit size={16} /></button>}</div>
            </div>
          </div>
          <div className="pl-4 md:pl-8 flex flex-col gap-3">
            <div className="flex items-center gap-4 flex-wrap"><h1 className="text-2xl md:text-3xl font-black text-purple-500 tracking-wider">@{displayMe.nick}</h1>{displayMe.isOwner && <span className="gs-owner-badge">OWNER</span>}{displayMe.custom_role && <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded ml-2">{displayMe.custom_role}</span>}</div>
            <div className="flex gap-2 items-center mt-2 flex-wrap">
              <span className="gs-role text-xs px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-gray-300">{displayMe.game}</span>
              <span className="gs-role text-xs px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-gray-300">{displayMe.rank}</span>
              <span className="gs-role text-xs px-2 py-1 bg-purple-900/50 border border-purple-500/50 rounded text-purple-300">{displayMe.vibe}</span>
              {displayMe.age && <span className="gs-role text-xs px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-gray-300">{displayMe.age} лет</span>}
              {displayMe.platform && <span className="gs-role text-xs px-2 py-1 bg-blue-900/50 border border-blue-500/50 rounded text-blue-300">{displayMe.platform}</span>}
              {displayMe.hasMic !== undefined && (<span className={`gs-role text-xs px-2 py-1 border rounded ${displayMe.hasMic ? "bg-green-900/50 border-green-500/50 text-green-300" : "bg-red-900/50 border-red-500/50 text-red-300"}`}>{displayMe.hasMic ? "Микрофон: Да" : "Микрофон: Нет"}</span>)}
            </div>
            {isMyProfile && isEditingBio ? (
              <div className="flex flex-col gap-2 max-w-md mt-2"><textarea className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500 resize-none transition-all" rows={3} value={bioInput} onChange={(e) => setBioInput(e.target.value)} /><div className="flex gap-2"><button className="bg-white text-black font-semibold px-4 py-1.5 rounded-lg text-sm hover:bg-gray-200 transition-colors" onClick={() => { setMe({ ...me, bio: bioInput }); setIsEditingBio(false); }}>Сохранить</button><button className="border border-zinc-700 text-gray-300 px-4 py-1.5 rounded-lg text-sm hover:bg-zinc-800 transition-colors" onClick={() => { setBioInput(me.bio); setIsEditingBio(false); }}>Отмена</button></div></div>
            ) : (
              <div className={`flex items-center gap-2 mt-1 ${isMyProfile ? "cursor-pointer group" : ""}`} onClick={() => isMyProfile && (setBioInput(me.bio), setIsEditingBio(true))}><p className={`text-sm ${isMyProfile ? "text-gray-500 group-hover:text-gray-300 transition-colors" : "text-gray-300"}`}>{displayMe.bio || "Описание профиля"}</p>{isMyProfile && <Edit size={12} className="text-gray-500 group-hover:text-white transition-colors" />}</div>
            )}
            {!isMyProfile && (
              <div className="mt-4 flex gap-2">
                <button onClick={() => { setActiveDialog(displayMe.nick); setShowInbox(true); }} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded-lg transition-all flex items-center gap-2 hover:scale-[1.05]"><MessageSquare size={16} /> Написать в личку</button>
                {me.isOwner && (<button onClick={(e) => { e.stopPropagation(); setAdminTarget(displayMe); }} className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-500 font-bold py-2 px-6 rounded-lg transition-all flex items-center gap-2 hover:scale-[1.05]"><Shield size={16} /> Админ</button>)}
              </div>
            )}
          </div>
          <div className="mt-12">
            <div className="flex justify-between items-center mb-4"><h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm">Фотографии</h3>{isMyProfile && (<button onClick={() => playerPhotosInputRef.current?.click()} className="text-xs text-purple-400 hover:text-white flex items-center gap-1 border border-purple-500/30 px-3 py-1.5 rounded-lg bg-purple-500/10 transition-all hover:scale-[1.05]"><ImagePlus size={14} /> Добавить фото</button>)}</div>
            {displayMe.photos && displayMe.photos.length > 0 ? (
              <div className="relative group rounded-xl overflow-hidden border border-zinc-800 bg-black">
                <img src={displayMe.photos[currentPhotoIndex] || displayMe.photos[0]} alt="Фото" className="w-full max-h-[500px] object-contain transition-opacity duration-300" />
                {isMyProfile && (<button onClick={(e) => { e.stopPropagation(); handleDeletePhoto(currentPhotoIndex); setCurrentPhotoIndex(0); }} className="absolute top-4 right-4 bg-black/60 p-2 rounded-lg hover:bg-red-500 text-white transition-colors"><X size={20} /></button>)}
                {displayMe.photos.length > 1 && (<><button onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(prev => prev === 0 ? displayMe.photos!.length - 1 : prev - 1); }} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 p-2 rounded-full text-white hover:bg-purple-600 transition-all opacity-0 group-hover:opacity-100"><ArrowLeft size={24} /></button><button onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(prev => prev === displayMe.photos!.length - 1 ? 0 : prev + 1); }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 p-2 rounded-full text-white hover:bg-purple-600 transition-all opacity-0 group-hover:opacity-100"><ArrowLeft size={24} className="rotate-180" /></button></>)}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/60 px-3 py-1.5 rounded-full">{displayMe.photos.map((_, i) => (<div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentPhotoIndex ? "bg-purple-500 scale-125" : "bg-gray-500"}`} />))}</div>
              </div>
            ) : (<div className="w-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/50 transition-all hover:bg-zinc-900"><ImagePlus size={32} className="text-gray-600 mb-2" /><p className="text-gray-500 text-sm">Нет добавленных фотографий</p></div>)}
          </div>
          <div className="mt-12 mb-20">
            <h3 className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-4">Комментарии</h3>
            <div className="flex gap-2 mb-6"><textarea className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-purple-500 resize-none transition-all" rows={2} placeholder="Оставить комментарий..." value={commentText} onChange={(e) => setCommentText(e.target.value)} /><button className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 rounded-lg transition-all flex items-center justify-center hover:scale-[1.05]" onClick={() => handleSendComment(displayMe.nick)}><Send size={18} /></button></div>
            <div className="flex flex-col gap-3">
              {comments.length === 0 && <p className="text-gray-500 text-sm text-center">Пока нет комментариев. Будь первым!</p>}
              {comments.map((c) => {
                const match = c.text.match(/^\[КОММЕНТАРИЙ ОТ @(.*?)\] (.*)$/);
                const author = match ? match[1] : "Неизвестный";
                const content = match ? match[2] : c.text;
                return (
                  <div key={c.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex gap-3 group transition-all hover:border-zinc-700">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-gray-400 flex-shrink-0">{author[0].toUpperCase()}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-sm text-gray-200">@{author}</p>
                        {(me.isOwner || me.nick === displayMe.nick) && (<button onClick={() => handleDeleteComment(c.id)} className="text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>)}
                      </div>
                      <p className="text-sm text-gray-400 mt-1"><FormatText text={content} /></p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {isMyProfile && (<div className="mb-12 flex justify-center"><button onClick={() => handleDeleteProfile(me.nick)} className="flex items-center gap-2 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 text-red-500 font-bold py-2 px-6 rounded-lg transition-all hover:scale-[1.05]"><Trash2 size={16} /> Удалить мою анкету</button></div>)}
        </main>
      </div>
    );
  }

  // ================== ФОРУМ ==================
  if (currentView === "forum") {
    const filteredThreads = activeCategory === "Все темы" ? threads : threads.filter(t => t.category === activeCategory);
    
    const isAdmin = me.isOwner || me.custom_role === "Модератор" || me.custom_role === "Хелпер";
    const canCreateHere = !RESTRICTED_CATEGORIES.includes(activeCategory) || isAdmin;

    return (
      <div className="gs bg-black min-h-screen text-white font-sans">
        {notification && <div className="fixed top-4 right-4 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg z-[100] animate-bounce">{notification}</div>}
        <header className="flex justify-between items-center p-4 md:p-6 border-b border-gray-800 bg-zinc-950 sticky top-0 z-40">
          <div className="flex items-center gap-4"><button onClick={() => setCurrentView("main")} className="p-2 border border-gray-700 rounded hover:border-purple-500 transition-colors"><ArrowLeft size={20} /></button><div className="text-2xl font-black tracking-widest uppercase gs-logo-rainbow cursor-pointer" onClick={() => window.location.reload()}>VOID FORUM</div></div>
          
          <button 
            onClick={() => {
              requireAuth(() => {
                if (!canCreateHere) return alert("В этой категории могут создавать темы только администраторы!");
                if (activeCategory !== "Все темы") setNewThreadCategory(activeCategory);
                setShowCreateThread(true);
              });
            }} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all hover:scale-[1.02] ${canCreateHere ? "bg-purple-600 hover:bg-purple-500" : "bg-zinc-800 text-gray-500 cursor-not-allowed"}`}
          >
            <Plus size={16} /> Создать
          </button>
        </header>
        <main className="max-w-7xl mx-auto mt-6 px-4 flex gap-6">
          <aside className="w-64 flex-shrink-0 hidden md:flex flex-col gap-1 sticky top-24 self-start">{FORUM_CATEGORIES.map(cat => (<button key={cat} onClick={() => setActiveCategory(cat)} className={`flex items-center gap-3 text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeCategory === cat ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50" : "text-gray-400 hover:bg-zinc-900 hover:text-white"}`}><CategoryIcon category={cat} className="w-5 h-5" /> {cat}</button>))}</aside>
          <div className="flex-1 flex flex-col gap-3">
            {filteredThreads.length === 0 && (<div className="text-center text-gray-500 mt-20 text-lg">В этой категории пока нет тем. Создай первую!</div>)}
            {filteredThreads.map((t) => (
              <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col hover:border-zinc-600 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg" onClick={() => { setSelectedThread(t); setCurrentView("thread"); }}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2"><span className={`flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded border ${t.category === 'Важное' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-purple-400 bg-purple-500/10 border-purple-500/20'}`}><CategoryIcon category={t.category} className="w-3 h-3" /> {t.category}</span><span className="text-xs text-gray-500">Автор: <span className="text-gray-300">@{t.author}</span> · {t.date}</span></div>
                    <h3 className="text-xl font-bold text-gray-100 hover:text-purple-400 transition-colors">{t.title}</h3>
                    {t.description && <p className="text-sm text-gray-400 mt-2 line-clamp-2">{t.description}</p>}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400 ml-4"><div className="flex items-center gap-1"><Eye size={16} /> {t.views || 0}</div>{(me.isOwner || me.nick === t.author) && (<button className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors" onClick={(e) => handleDeleteThread(t.id, e)}><Trash2 size={18} /></button>)}</div>
                </div>
                <div className="flex gap-4 mt-4 pt-4 border-t border-zinc-800/80">
                  <button onClick={(e) => handleLike(t.id, true, e)} className={`flex items-center gap-1.5 text-sm font-medium transition-all hover:scale-110 ${t.liked_by?.includes(me.nick) ? "text-green-500" : "text-gray-400 hover:text-green-500"}`}><ThumbsUp size={16} /> {t.likes || 0}</button>
                  <button onClick={(e) => handleLike(t.id, false, e)} className={`flex items-center gap-1.5 text-sm font-medium transition-all hover:scale-110 ${t.disliked_by?.includes(me.nick) ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}><ThumbsDown size={16} /> {t.dislikes || 0}</button>
                  <button onClick={(e) => { e.stopPropagation(); requireAuth(() => setShowReport({ type: 'thread', id: t.id })); }} className="flex items-center gap-1.5 text-gray-500 hover:text-orange-500 text-sm font-medium ml-auto transition-all hover:scale-110"><Flag size={16} /> Жалоба</button>
                </div>
              </div>
            ))}
          </div>
        </main>
        {showCreateThread && (<div className="gs-modal"><div className="gs-backdrop" onClick={() => setShowCreateThread(false)} /><div className="gs-sheet"><div className="gs-sheet-head"><div><h4>Создать тему</h4></div><button className="gs-close" onClick={() => setShowCreateThread(false)}><X size={16} /></button></div><div className="flex flex-col gap-4"><div><label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Название</label><input className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-all" value={newThreadTitle} onChange={(e) => setNewThreadTitle(e.target.value)} /></div><div><label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Текст</label><textarea className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white resize-none focus:outline-none focus:border-purple-500 transition-all" rows={4} value={newThreadDesc} onChange={(e) => setNewThreadDesc(e.target.value)} /></div><div><label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Категория</label><select className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-all" value={newThreadCategory} onChange={(e) => setNewThreadCategory(e.target.value)}>{FORUM_CATEGORIES.filter(c => c !== "Все темы").map(c => <option key={c} value={c}>{c}</option>)}</select></div><button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg mt-2 transition-all hover:scale-[1.02]" onClick={handleCreateThread}>Опубликовать</button></div></div></div>)}
      </div>
    );
  }

  // ================== ТРЕД ==================
  if (currentView === "thread" && selectedThread) {
    const canDeleteThread = me.nick === selectedThread.author || me.isOwner;
    const canDeleteReplies = me.isOwner || me.nick === selectedThread.author;
    const rootReplies = selectedThread.replies?.filter(r => !r.parent_id) || [];

    return (
      <div className="gs bg-black min-h-screen text-white font-sans">
        {notification && <div className="fixed top-4 right-4 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg z-[100] animate-bounce">{notification}</div>}
        <header className="flex justify-between items-center p-4 md:p-6 border-b border-gray-800"><div className="flex items-center gap-4"><button onClick={() => setCurrentView("forum")} className="p-2 border border-gray-700 rounded hover:border-purple-500 transition-colors"><ArrowLeft size={20} /></button><div className="text-xl font-bold">{selectedThread.title}</div></div>{canDeleteThread && (<button onClick={(e) => handleDeleteThread(selectedThread.id, e)} className="flex items-center gap-2 text-red-500 font-bold text-sm hover:scale-105 transition-all"><Trash2 size={16} /> Удалить тему</button>)}</header>
        <main className="max-w-4xl mx-auto mt-8 px-4 flex flex-col gap-6 pb-20">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-md">
            <div className="flex items-center gap-4 mb-4"><div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold">{selectedThread.author[0].toUpperCase()}</div><div><p className="font-bold text-purple-400">@{selectedThread.author}</p><p className="text-xs text-gray-500">{selectedThread.date}</p></div></div>
            <p className="text-gray-200 whitespace-pre-wrap"><FormatText text={selectedThread.description} /></p>
            <div className="flex gap-4 mt-4"><button onClick={(e) => handleLike(selectedThread.id, true, e)} className={`flex items-center gap-1 text-sm font-medium transition-all hover:scale-110 ${selectedThread.liked_by?.includes(me.nick) ? "text-green-500" : "text-gray-400 hover:text-green-500"}`}><ThumbsUp size={16} /> {selectedThread.likes || 0}</button><button onClick={(e) => handleLike(selectedThread.id, false, e)} className={`flex items-center gap-1 text-sm font-medium transition-all hover:scale-110 ${selectedThread.disliked_by?.includes(me.nick) ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}><ThumbsDown size={16} /> {selectedThread.dislikes || 0}</button><button onClick={() => requireAuth(() => setShowReport({ type: 'thread', id: selectedThread.id }))} className="flex items-center gap-1 text-gray-400 hover:text-orange-500 ml-auto transition-all hover:scale-110"><Flag size={16} /> Жалоба</button></div>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <h4 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Комментарии ({selectedThread.replies?.length || 0})</h4>
            {rootReplies.map(reply => (<ReplyNode key={reply.id} reply={reply} allReplies={selectedThread.replies || []} onReply={(id, author) => { setReplyToId(id); setReplyText(`@${author} `); document.getElementById("reply-input")?.focus(); }} canDelete={canDeleteReplies} deleteReply={(id) => handleDeleteReply(id, { stopPropagation: () => {} } as any)} />))}
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-2 transition-all focus-within:border-purple-500 mt-4 sticky bottom-4">
            {replyToId && (<div className="text-xs text-purple-400 flex justify-between items-center bg-purple-900/20 p-2 rounded"><span>Ответ на сообщение...</span><button onClick={() => setReplyToId(null)} className="hover:text-white"><X size={12} /></button></div>)}
            <div className="flex gap-2"><input id="reply-input" className="flex-1 bg-black border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-all" placeholder="Написать ответ..." value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && requireAuth(handleSendReply)} /><button className="bg-purple-600 hover:bg-purple-500 text-white px-6 rounded-lg font-bold transition-all hover:scale-[1.05]" onClick={() => requireAuth(handleSendReply)}><Send size={18} /></button></div>
          </div>
        </main>
        {showReport && (<div className="gs-modal"><div className="gs-backdrop" onClick={() => setShowReport(null)} /><div className="gs-sheet"><div className="gs-sheet-head"><div><h4>Жалоба</h4></div><button className="gs-close" onClick={() => setShowReport(null)}><X size={16} /></button></div><textarea className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white resize-none" rows={4} placeholder="Причина" value={reportReason} onChange={(e) => setReportReason(e.target.value)} /><button className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg mt-4 transition-all" onClick={handleReport}>Отправить</button></div></div>)}
      </div>
    );
  }

  return null;
}