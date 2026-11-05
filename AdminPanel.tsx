import { useState, useEffect } from "react";
import { X, ShieldAlert, Ban, VolumeX, Shield } from "lucide-react";
import { supabase } from "./void/src/supabaseClient";

export default function AdminPanel({ player, onClose }: { player: any, onClose: () => void }) {
  const [roles, setRoles] = useState<any[]>([]);
  const [warns, setWarns] = useState(player.warns || 0);
  const [banned, setBanned] = useState(player.banned || false);

  useEffect(() => {
    const fetchRoles = async () => {
      const { data } = await supabase.from('roles').select('*');
      if (data) setRoles(data);
    };
    fetchRoles();
  }, []);

  const giveWarn = async () => {
    const newWarns = warns + 1;
    setWarns(newWarns);
    await supabase.from('players').update({ warns: newWarns }).eq('nick', player.nick);
    if (newWarns >= 3) {
      await supabase.from('players').update({ banned: true }).eq('nick', player.nick);
      setBanned(true);
      alert("Выдан 3-й варн! Пользователь забанен.");
    }
  };

  const toggleBan = async () => {
    const newBanned = !banned;
    setBanned(newBanned);
    await supabase.from('players').update({ banned: newBanned }).eq('nick', player.nick);
  };

  const muteUser = async () => {
    const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Мут на 24 часа
    await supabase.from('players').update({ muted_until: until }).eq('nick', player.nick);
    alert("Пользователь замучен на 24 часа.");
  };

  const setRole = async (roleName: string) => {
    await supabase.from('players').update({ custom_role: roleName }).eq('nick', player.nick);
    alert(`Выдана роль: ${roleName}`);
  };

  return (
    <div className="gs-modal">
      <div className="gs-backdrop" onClick={onClose} />
      <div className="gs-sheet">
        <div className="gs-sheet-head">
          <div><h4>Админ-панель</h4><p>Управление @{player.nick}</p></div>
          <button className="gs-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 flex justify-between items-center">
            <div className="flex items-center gap-2 text-yellow-500"><ShieldAlert size={20} /> <span className="font-bold">Варны: {warns}</span></div>
            <button onClick={giveWarn} className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded text-sm font-bold">Выдать варн</button>
          </div>

          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 flex justify-between items-center">
            <div className="flex items-center gap-2 text-blue-500"><VolumeX size={20} /> <span className="font-bold">Мут (24ч)</span></div>
            <button onClick={muteUser} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold">Замутить</button>
          </div>

          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 flex justify-between items-center">
            <div className="flex items-center gap-2 text-red-500"><Ban size={20} /> <span className="font-bold">{banned ? "Забанен" : "Активен"}</span></div>
            <button onClick={toggleBan} className={`${banned ? "bg-green-600" : "bg-red-600"} hover:opacity-80 text-white px-4 py-2 rounded text-sm font-bold`}>
              {banned ? "Разбанить" : "Забанить"}
            </button>
          </div>

          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-2 text-purple-500 mb-3"><Shield size={20} /> <span className="font-bold">Выдать роль</span></div>
            <div className="flex flex-wrap gap-2">
              {roles.map(role => (
                <button key={role.id} onClick={() => setRole(role.name)} className="px-3 py-1.5 border border-purple-500/50 text-purple-400 hover:bg-purple-500 hover:text-white rounded text-xs font-bold transition-colors">
                  {role.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}