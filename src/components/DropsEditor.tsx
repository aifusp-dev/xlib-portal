"use client";

import { Trash2, Plus, Skull, Pickaxe } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropsConfig } from "@/lib/studio";
import AutocompleteInput from "@/components/AutocompleteInput";
import { MATERIALS, ENTITY_TYPES } from "@/lib/minecraft";

interface DropsEditorProps {
  drops: DropsConfig;
  mutate: (fn: (drops: DropsConfig) => void) => void;
  /** Materiales vanilla + ids xfoods/xfoodscrops ya en formato de ref completo, para el picker de ítem. */
  refOptions: string[];
}

const inputCls = "w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-yellow-400/50";

function Toggle({ checked, onChange, label, color = "bg-green-500" }: { checked: boolean; onChange: (v: boolean) => void; label: string; color?: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer w-fit">
      <div className="relative">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
        <div className={cn("w-8 h-4 rounded-full transition-colors", checked ? color : "bg-gray-700")}></div>
        <div className={cn("absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform", checked ? "translate-x-4" : "")}></div>
      </div>
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
    </label>
  );
}

export default function DropsEditor({ drops, mutate, refOptions }: DropsEditorProps) {
  // --- Mob drops ---

  const addEntity = () => {
    const raw = prompt("Tipo de entidad (ej: PIG, ZOMBIE):");
    if (!raw) return;
    const entity = raw.trim().toUpperCase();
    mutate((d) => {
      d.present = true;
      if (d.mobDrops.replacements[entity]) { alert("Ya hay reglas para esa entidad."); return; }
      d.mobDrops.replacements[entity] = {};
    });
  };

  const removeEntity = (entity: string) => {
    mutate((d) => { delete d.mobDrops.replacements[entity]; });
  };

  const addReplacement = (entity: string) => {
    mutate((d) => {
      d.present = true;
      d.mobDrops.replacements[entity] = { ...d.mobDrops.replacements[entity], "": "" };
    });
  };

  const setReplacementMaterial = (entity: string, oldMaterial: string, newMaterial: string) => {
    mutate((d) => {
      const rules = d.mobDrops.replacements[entity];
      const value = rules[oldMaterial];
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(rules)) next[k === oldMaterial ? newMaterial : k] = v;
      if (!(newMaterial in next)) next[newMaterial] = value;
      d.mobDrops.replacements[entity] = next;
    });
  };

  const setReplacementRef = (entity: string, material: string, ref: string) => {
    mutate((d) => { d.mobDrops.replacements[entity][material] = ref; });
  };

  const removeReplacement = (entity: string, material: string) => {
    mutate((d) => { delete d.mobDrops.replacements[entity][material]; });
  };

  // --- Block drops ---

  const addBlock = () => {
    const raw = prompt("Material del bloque a romper (ej: SHORT_GRASS):");
    if (!raw) return;
    const material = raw.trim().toUpperCase();
    mutate((d) => {
      d.present = true;
      if (d.blockDrops.drops[material]) { alert("Ya hay reglas para ese bloque."); return; }
      d.blockDrops.drops[material] = [{ item: "", chance: 0.1, amount: 1 }];
    });
  };

  const removeBlock = (material: string) => {
    mutate((d) => { delete d.blockDrops.drops[material]; });
  };

  const addBlockEntry = (material: string) => {
    mutate((d) => {
      d.present = true;
      d.blockDrops.drops[material] = [...d.blockDrops.drops[material], { item: "", chance: 0.1, amount: 1 }];
    });
  };

  const setBlockEntry = (material: string, index: number, patch: Partial<{ item: string; chance: number; amount: number }>) => {
    mutate((d) => {
      const list = [...d.blockDrops.drops[material]];
      list[index] = { ...list[index], ...patch };
      d.blockDrops.drops[material] = list;
    });
  };

  const removeBlockEntry = (material: string, index: number) => {
    mutate((d) => {
      d.blockDrops.drops[material] = d.blockDrops.drops[material].filter((_, i) => i !== index);
    });
  };

  const mobEntries = Object.entries(drops.mobDrops.replacements);
  const blockEntries = Object.entries(drops.blockDrops.drops);

  return (
    <div className="grid grid-cols-2 gap-6 h-full overflow-y-auto p-1">
      {/* --- MOB DROPS --- */}
      <div className="bg-[#0b0f19] rounded-2xl border border-[#374151] overflow-hidden h-fit">
        <div className="bg-white/5 px-6 py-4 flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-2 text-red-400">
            <Skull className="w-4 h-4" />
            <h4 className="text-[11px] font-black uppercase tracking-widest">Mobs</h4>
          </div>
          <Toggle checked={drops.mobDrops.enabled} onChange={(v) => mutate((d) => { d.present = true; d.mobDrops.enabled = v; })} label="Activado" color="bg-red-500" />
        </div>
        <div className="p-6 space-y-4">
          <p className="text-[10px] text-gray-500 italic">
            Sustituye un drop de vanilla de un mob concreto por un ítem custom (ej. un cerdo suelta &quot;raw_pork&quot; en vez de PORKCHOP).
          </p>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{mobEntries.length} entidad(es)</span>
            <button onClick={addEntity} className="flex items-center gap-1 text-[10px] font-black uppercase bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-colors">
              <Plus className="w-3 h-3" /> Entidad
            </button>
          </div>

          <div className="space-y-3">
            {mobEntries.map(([entity, rules]) => (
              <div key={entity} className="bg-black/20 rounded-xl border border-white/5 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <AutocompleteInput value={entity} onChange={(v) => { /* renombrar entidad completa: eliminar y recrear con el nuevo id */
                    mutate((d) => {
                      const value = d.mobDrops.replacements[entity];
                      delete d.mobDrops.replacements[entity];
                      d.mobDrops.replacements[v.toUpperCase()] = value;
                    });
                  }} options={ENTITY_TYPES} className={cn(inputCls, "font-bold text-red-300 max-w-[10rem]")} />
                  <button onClick={() => removeEntity(entity)} className="text-gray-600 hover:text-red-500 transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>

                <div className="space-y-2">
                  {Object.entries(rules).map(([material, ref]) => (
                    <div key={material} className="flex gap-2 items-center">
                      <AutocompleteInput value={material} onChange={(v) => setReplacementMaterial(entity, material, v.toUpperCase())} options={MATERIALS} strict placeholder="PORKCHOP" className={cn(inputCls, "max-w-[8rem]")} />
                      <span className="text-gray-600 text-xs">→</span>
                      <AutocompleteInput value={ref} onChange={(v) => setReplacementRef(entity, material, v)} options={refOptions} placeholder="raw_pork" className={inputCls} />
                      <button onClick={() => removeReplacement(entity, material)} className="text-gray-600 hover:text-red-500 transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                  <button onClick={() => addReplacement(entity)} className="text-[9px] font-black text-blue-400 uppercase hover:text-blue-300 transition-colors">+ Material</button>
                </div>
              </div>
            ))}
            {mobEntries.length === 0 && <p className="text-[10px] text-gray-600 italic">Sin entidades configuradas.</p>}
          </div>
        </div>
      </div>

      {/* --- BLOCK DROPS --- */}
      <div className="bg-[#0b0f19] rounded-2xl border border-[#374151] overflow-hidden h-fit">
        <div className="bg-white/5 px-6 py-4 flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-2 text-lime-400">
            <Pickaxe className="w-4 h-4" />
            <h4 className="text-[11px] font-black uppercase tracking-widest">Bloques</h4>
          </div>
          <Toggle checked={drops.blockDrops.enabled} onChange={(v) => mutate((d) => { d.present = true; d.blockDrops.enabled = v; })} label="Activado" color="bg-lime-500" />
        </div>
        <div className="p-6 space-y-4">
          <p className="text-[10px] text-gray-500 italic">
            Probabilidad de soltar un ítem extra (típicamente una semilla) al romper un bloque. No sustituye el drop normal del bloque, se suma.
          </p>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{blockEntries.length} bloque(s)</span>
            <button onClick={addBlock} className="flex items-center gap-1 text-[10px] font-black uppercase bg-lime-500/10 text-lime-400 px-3 py-1.5 rounded-lg border border-lime-500/20 hover:bg-lime-500/20 transition-colors">
              <Plus className="w-3 h-3" /> Bloque
            </button>
          </div>

          <div className="space-y-3">
            {blockEntries.map(([material, entries]) => (
              <div key={material} className="bg-black/20 rounded-xl border border-white/5 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <AutocompleteInput value={material} onChange={(v) => {
                    mutate((d) => {
                      const value = d.blockDrops.drops[material];
                      delete d.blockDrops.drops[material];
                      d.blockDrops.drops[v.toUpperCase()] = value;
                    });
                  }} options={MATERIALS} strict className={cn(inputCls, "font-bold text-lime-300 max-w-[10rem]")} />
                  <button onClick={() => removeBlock(material)} className="text-gray-600 hover:text-red-500 transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>

                <div className="space-y-2">
                  {entries.map((entry, i) => (
                    <div key={i} className="grid grid-cols-[1fr_5rem_4rem_auto] gap-2 items-center">
                      <AutocompleteInput value={entry.item} onChange={(v) => setBlockEntry(material, i, { item: v })} options={refOptions} placeholder="xfoodscrops:seed:lettuce" className={inputCls} />
                      <input type="number" min={0} max={1} step={0.01} value={entry.chance} onChange={(e) => setBlockEntry(material, i, { chance: parseFloat(e.target.value) })} title="Probabilidad (0-1)" className={inputCls} />
                      <input type="number" min={1} value={entry.amount ?? 1} onChange={(e) => setBlockEntry(material, i, { amount: parseInt(e.target.value) })} title="Cantidad" className={inputCls} />
                      <button onClick={() => removeBlockEntry(material, i)} className="text-gray-600 hover:text-red-500 transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                  <button onClick={() => addBlockEntry(material)} className="text-[9px] font-black text-blue-400 uppercase hover:text-blue-300 transition-colors">+ Drop</button>
                </div>
              </div>
            ))}
            {blockEntries.length === 0 && <p className="text-[10px] text-gray-600 italic">Sin bloques configurados.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
