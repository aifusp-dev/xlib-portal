"use client";

import { Trash2, Plus } from "lucide-react";

/** Espejo de "initial-state:" en el YAML del ítem — cada valor es un entero o un booleano, igual que ItemState en Java. */
export type InitialStateConfig = Record<string, number | boolean>;

interface InitialStateEditorProps {
  state: InitialStateConfig;
  mutate: (fn: (state: InitialStateConfig) => void) => void;
}

const inputCls = "w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-yellow-400/50";

export default function InitialStateEditor({ state, mutate }: InitialStateEditorProps) {
  const entries = Object.entries(state || {});

  const addEntry = () => {
    mutate((s) => {
      let key = "nueva_clave";
      let i = 1;
      while (key in s) key = `nueva_clave_${i++}`;
      s[key] = 0;
    });
  };
  const removeEntry = (key: string) => {
    mutate((s) => { delete s[key]; });
  };
  const renameEntry = (oldKey: string, newKey: string) => {
    if (!newKey || newKey === oldKey) return;
    mutate((s) => {
      const value = s[oldKey];
      delete s[oldKey];
      s[newKey] = value;
    });
  };
  const setValue = (key: string, value: number | boolean) => {
    mutate((s) => { s[key] = value; });
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{entries.length} clave(s)</span>
        <button
          onClick={addEntry}
          className="flex items-center gap-1 text-[10px] font-black uppercase bg-pink-500/10 text-pink-400 px-3 py-1.5 rounded-lg border border-pink-500/20 hover:bg-pink-500/20 transition-colors"
        >
          <Plus className="w-3 h-3" /> Clave
        </button>
      </div>

      <div className="space-y-2">
        {entries.map(([key, value]) => {
          const isBool = typeof value === "boolean";
          return (
            <div key={key} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
              <input
                type="text"
                defaultValue={key}
                onBlur={(e) => renameEntry(key, e.target.value)}
                className={inputCls}
                placeholder="water_level"
              />
              <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                <input type="checkbox" checked={isBool} onChange={(e) => setValue(key, e.target.checked ? false : 0)} />
                <span className="text-[9px] text-gray-500 uppercase font-bold">Bool</span>
              </label>
              {isBool ? (
                <select value={String(value)} onChange={(e) => setValue(key, e.target.value === "true")} className={inputCls}>
                  <option value="true" className="bg-surface-1 text-white">true</option>
                  <option value="false" className="bg-surface-1 text-white">false</option>
                </select>
              ) : (
                <input
                  type="number"
                  value={value as number}
                  onChange={(e) => setValue(key, parseInt(e.target.value) || 0)}
                  className={inputCls}
                />
              )}
              <button onClick={() => removeEntry(key)} className="text-gray-600 hover:text-red-500 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
        {entries.length === 0 && (
          <p className="text-[10px] text-gray-600 italic">
            Sin estado inicial: el ítem nace sin contadores ni interruptores puestos (las acciones que los lean usarán su propio default).
          </p>
        )}
      </div>
    </div>
  );
}
