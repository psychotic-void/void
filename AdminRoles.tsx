import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { supabase } from "./void/src/supabaseClient";

export default function AdminRoles({ onClose }: { onClose: () => void }) {
  const [roles, setRoles] = useState<{id: number, name: string, color: string}[]>([]);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    const fetchRoles = async () => {
      const { data } = await supabase.from('roles').select('*').order('id', { ascending: true });
      if (data) setRoles(data);
    };
    fetchRoles();
  }, []);

  const handleCreate = async () => {
    if (!newRole.trim()) return;
    await supabase.from('roles').insert([{ name: newRole.toUpperCase(), color: "purple" }]);
    setNewRole("");
    const { data } = await supabase.from('roles').select('*').order('id', { ascending: true });
    if (data) setRoles(data);
  };

  const handleDelete = async (id: number) => {
    await supabase.from('roles').delete().eq('id', id);
    setRoles(roles.filter(r => r.id !== id));
  };

  return (
    <div className="gs-modal">
      <div className="gs-backdrop" onClick={onClose} />
      <div className="gs-sheet">
        <div className="gs-sheet-head">
          <div><h4>Управление ролями</h4><p>Создавай новые роли для юзеров</p></div>
          <button className="gs-close" onClick={onClose}><X size={16} /></button>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <input 
              className="flex-1 bg-black border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500" 
              placeholder="Название новой роли..." 
              value={newRole} 
              onChange={(e) => setNewRole(e.target.value)} 
            />
            <button className="bg-purple-600 hover:bg-purple-500 text-white px-4 rounded-lg font-bold" onClick={handleCreate}><Plus size={18} /></button>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            {roles.map(role => (
              <div key={role.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                <span className="font-bold text-purple-400">{role.name}</span>
                <button onClick={() => handleDelete(role.id)} className="text-red-500 hover:bg-red-500/10 p-1.5 rounded"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}