"use client";

import { Trash2 } from "lucide-react";
import { parseCommandAction, buildCommandAction, CommandAction, CommandExecutor, CommandActionKind } from "@/lib/commandActions";

interface CommandActionRowProps {
  value: string;
  onChange: (raw: string) => void;
  onRemove: () => void;
}

const selectCls = "bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-[10px] font-bold text-white uppercase outline-none focus:border-yellow-400/50";

export default function CommandActionRow({ value, onChange, onRemove }: CommandActionRowProps) {
  const action = parseCommandAction(value);

  const update = (patch: Partial<CommandAction>) => {
    onChange(buildCommandAction({ ...action, ...patch }));
  };

  return (
    <div className="bg-black/20 border border-white/5 rounded-xl p-3 space-y-2">
      <div className="flex gap-2 items-center flex-wrap">
        <select
          value={action.executor}
          onChange={(e) => update({ executor: e.target.value as CommandExecutor })}
          className={selectCls}
        >
          <option value="console">Como Consola</option>
          <option value="player">Como el Jugador</option>
        </select>

        <select
          value={action.action}
          onChange={(e) => update({ action: e.target.value as CommandActionKind, message: '' })}
          className={selectCls}
        >
          <option value="say">Decir un Mensaje</option>
          <option value="custom">Comando Personalizado</option>
        </select>

        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-gray-500 uppercase font-bold">Retraso</span>
          <input
            type="number"
            min={0}
            value={action.delay}
            onChange={(e) => update({ delay: parseInt(e.target.value) || 0 })}
            className="w-16 bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-xs text-white outline-none focus:border-yellow-400/50"
          />
          <span className="text-[9px] text-gray-500">seg</span>
        </div>

        <button onClick={onRemove} className="ml-auto text-gray-600 hover:text-red-500 transition-colors shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <input
        type="text"
        value={action.message}
        onChange={(e) => update({ message: e.target.value })}
        placeholder={action.action === 'say' ? '%player% siente algo raro...' : 'give %player% diamond 1'}
        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-yellow-400/50"
      />
      {action.action === 'custom' && (
        <p className="text-[9px] text-gray-600 italic">
          Comando completo tal y como se escribiría en la consola (sin la barra inicial). Usa %player% para el nombre del jugador.
        </p>
      )}
    </div>
  );
}
