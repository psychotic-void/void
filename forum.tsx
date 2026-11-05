import { ArrowLeft, MessageSquare, Eye, Plus } from "lucide-react";

export default function Forum({ onBack }: { onBack: () => void }) {
  return (
    <div className="gs bg-black min-h-screen text-white font-sans">
      <header className="flex justify-between items-center p-4 md:p-6 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 border border-gray-700 rounded hover:border-purple-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="text-2xl font-black tracking-widest uppercase">VOID FORUM</div>
        </div>
        <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg font-bold text-sm transition-colors">
          <Plus size={16} /> Создать тему
        </button>
      </header>

      <main className="max-w-6xl mx-auto mt-8 px-4">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {["Все", "Важное", "CS2", "Dota 2", "Valorant", "Общение"].map(cat => (
            <button key={cat} className="px-4 py-1.5 bg-zinc-900 border border-zinc-700 rounded-full text-sm whitespace-nowrap hover:border-purple-500 transition-colors">
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-600 transition-colors cursor-pointer">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">Важное</span>
              </div>
              <h3 className="text-lg font-bold text-gray-100">Правила платформы VOID (обязательно к прочтению)</h3>
              <p className="text-sm text-gray-500 mt-1">Автор: <span className="text-gray-300">@psychotic badtrip</span> · Вчера</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-1"><MessageSquare size={16} /> 0</div>
              <div className="flex items-center gap-1"><Eye size={16} /> 1240</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}