"use client";

import { Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizePath } from "@/lib/studio";
import AutocompleteInput from "@/components/AutocompleteInput";

interface MachineIngredient { id?: string; amount?: number; }
interface MachineRecipe {
  inputs?: Record<string, MachineIngredient>;
  output?: { id?: string; amount?: number };
  time?: number;
  'burn-time'?: number;
  'burnt-id'?: string;
  'use-minigame'?: boolean;
  sounds?: { start?: string; finish?: string };
  rpg?: { category?: string; 'required-level'?: number; 'xp-reward'?: number };
}

interface MachineConfig {
  'is-refrigerator'?: boolean;
  recipes?: Record<string, MachineRecipe>;
}

interface MachineRecipesEditorProps {
  config: MachineConfig;
  // Firma idéntica a mutateSelectedConfig del Studio: recibe el config completo de la
  // estación seleccionada y lo muta in-place.
  mutate: (fn: (config: MachineConfig) => void) => void;
  foodOptions: string[];
}

const inputCls = "w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-yellow-400/50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-bold text-gray-600 uppercase block">{label}</label>
      {children}
    </div>
  );
}

export default function MachineRecipesEditor({ config, mutate, foodOptions }: MachineRecipesEditorProps) {
  const isRefrigerator = !!config['is-refrigerator'];

  const toggleRefrigerator = (value: boolean) => {
    mutate((cfg) => { cfg['is-refrigerator'] = value; });
  };

  const addRecipe = () => {
    const raw = prompt("ID de la receta (ej: cocinar_pan):");
    if (!raw) return;
    const id = sanitizePath(raw);
    mutate((cfg) => {
      if (!cfg.recipes) cfg.recipes = {};
      if (cfg.recipes[id]) { alert("Ya existe una receta con ese ID."); return; }
      cfg.recipes[id] = {
        inputs: {},
        output: { id: '', amount: 1 },
        time: 100,
        'burn-time': 0,
        'use-minigame': false,
      };
    });
  };

  const removeRecipe = (id: string) => {
    mutate((cfg) => { delete cfg.recipes?.[id]; });
  };

  const setRecipeField = (id: string, path: string[], value: unknown) => {
    mutate((cfg) => {
      let cur = cfg.recipes![id] as unknown as Record<string, unknown>;
      for (let i = 0; i < path.length - 1; i++) {
        if (cur[path[i]] == null) cur[path[i]] = {};
        cur = cur[path[i]] as Record<string, unknown>;
      }
      cur[path[path.length - 1]] = value;
    });
  };

  const addIngredient = (recipeId: string) => {
    mutate((cfg) => {
      const recipe = cfg.recipes![recipeId];
      if (!recipe.inputs) recipe.inputs = {};
      const n = Object.keys(recipe.inputs).length;
      recipe.inputs[`ing${n}`] = { id: '', amount: 1 };
    });
  };

  const removeIngredient = (recipeId: string, key: string) => {
    mutate((cfg) => { delete cfg.recipes![recipeId].inputs?.[key]; });
  };

  const recipeEntries = Object.entries(config.recipes || {});

  return (
    <div className="space-y-6">
      <label className="flex items-center gap-3 cursor-pointer w-fit">
        <div className="relative">
          <input type="checkbox" checked={isRefrigerator} onChange={(e) => toggleRefrigerator(e.target.checked)} className="sr-only" />
          <div className={cn("w-8 h-4 rounded-full transition-colors", isRefrigerator ? "bg-blue-500" : "bg-gray-700")}></div>
          <div className={cn("absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform", isRefrigerator ? "translate-x-4" : "")}></div>
        </div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Es una nevera (conserva, no procesa recetas)</span>
      </label>

      {isRefrigerator ? (
        <p className="text-[11px] text-gray-500 italic">
          Las neveras no procesan recetas: cualquier comida de xFoods guardada dentro pausa su caducidad hasta que se retire.
        </p>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{recipeEntries.length} receta(s)</span>
            <button onClick={addRecipe} className="flex items-center gap-1 text-[10px] font-black uppercase bg-orange-500/10 text-orange-400 px-3 py-1.5 rounded-lg border border-orange-500/20 hover:bg-orange-500/20 transition-colors">
              <Plus className="w-3 h-3" /> Nueva Receta
            </button>
          </div>

          <div className="space-y-4">
            {recipeEntries.map(([rid, recipe]) => (
              <div key={rid} className="bg-[#0b0f19] rounded-2xl border border-[#374151] overflow-hidden">
                <div className="bg-white/5 px-6 py-3 flex justify-between items-center border-b border-white/5">
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">{rid}</span>
                  <button onClick={() => removeRecipe(rid)} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Ingredientes (cantidad exacta requerida)</span>
                      <button onClick={() => addIngredient(rid)} className="text-[9px] font-black text-blue-400 uppercase hover:text-blue-300 transition-colors">+ Ingrediente</button>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(recipe.inputs || {}).map(([ikey, ing]) => (
                        <div key={ikey} className="flex gap-2 items-center">
                          <AutocompleteInput value={ing.id || ''} onChange={(v) => setRecipeField(rid, ['inputs', ikey, 'id'], v)} options={foodOptions} placeholder="id (ej: xfoods:harina o WHEAT)" className={inputCls} />
                          <input type="number" min={1} value={ing.amount ?? 1} onChange={(e) => setRecipeField(rid, ['inputs', ikey, 'amount'], parseInt(e.target.value))} className="w-20 bg-black/20 border border-white/5 rounded-lg px-2 py-2 text-xs text-white outline-none shrink-0" />
                          <button onClick={() => removeIngredient(rid, ikey)} className="text-gray-600 hover:text-red-500 transition-colors shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                      {Object.keys(recipe.inputs || {}).length === 0 && (
                        <p className="text-[10px] text-gray-600 italic">Sin ingredientes: añade al menos uno para que la receta pueda activarse.</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Resultado (ID)">
                      <AutocompleteInput value={recipe.output?.id || ''} onChange={(v) => setRecipeField(rid, ['output', 'id'], v)} options={foodOptions} className={inputCls} />
                    </Field>
                    <Field label="Cantidad">
                      <input type="number" min={1} value={recipe.output?.amount ?? 1} onChange={(e) => setRecipeField(rid, ['output', 'amount'], parseInt(e.target.value))} className={inputCls} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Tiempo (ticks, 20 = 1s)">
                      <input type="number" min={1} value={recipe.time ?? 100} onChange={(e) => setRecipeField(rid, ['time'], parseInt(e.target.value))} className={inputCls} />
                    </Field>
                    <Field label="Tiempo Quemado (ticks)">
                      <input type="number" min={0} value={recipe['burn-time'] ?? 0} onChange={(e) => setRecipeField(rid, ['burn-time'], parseInt(e.target.value))} className={inputCls} />
                    </Field>
                    <Field label="ID si se Quema">
                      <AutocompleteInput value={recipe['burnt-id'] || ''} onChange={(v) => setRecipeField(rid, ['burnt-id'], v)} options={foodOptions} placeholder="COAL" className={inputCls} />
                    </Field>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <input type="checkbox" checked={!!recipe['use-minigame']} onChange={(e) => setRecipeField(rid, ['use-minigame'], e.target.checked)} className="rounded bg-black border-white/10" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Requiere minijuego (BossBar)</span>
                  </label>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                    <Field label="Sonido al Empezar">
                      <input type="text" value={recipe.sounds?.start || ''} onChange={(e) => setRecipeField(rid, ['sounds', 'start'], e.target.value)} placeholder="BLOCK_GRINDSTONE_USE" className={inputCls} />
                    </Field>
                    <Field label="Sonido al Terminar">
                      <input type="text" value={recipe.sounds?.finish || ''} onChange={(e) => setRecipeField(rid, ['sounds', 'finish'], e.target.value)} placeholder="ENTITY_EXPERIENCE_ORB_PICKUP" className={inputCls} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/5">
                    <Field label="Categoría RPG">
                      <input type="text" value={recipe.rpg?.category || ''} onChange={(e) => setRecipeField(rid, ['rpg', 'category'], e.target.value)} placeholder="opcional" className={inputCls} />
                    </Field>
                    <Field label="Nivel Requerido">
                      <input type="number" min={0} value={recipe.rpg?.['required-level'] ?? 0} onChange={(e) => setRecipeField(rid, ['rpg', 'required-level'], parseInt(e.target.value))} className={inputCls} />
                    </Field>
                    <Field label="XP Otorgada">
                      <input type="number" min={0} value={recipe.rpg?.['xp-reward'] ?? 10} onChange={(e) => setRecipeField(rid, ['rpg', 'xp-reward'], parseInt(e.target.value))} className={inputCls} />
                    </Field>
                  </div>
                </div>
              </div>
            ))}

            {recipeEntries.length === 0 && (
              <p className="text-[10px] text-gray-600 italic">Sin recetas: esta estación no hará nada hasta que añadas al menos una.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
