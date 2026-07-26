"use client";

import { Trash2 } from "lucide-react";
import Field from "@/components/Field";

// Lista de PotionEffectType habituales en Paper/Spigot 1.21. No es exhaustiva,
// pero cubre los casos reales que usan las comidas de xFoods (incluidas las drogas).
const POTION_EFFECT_TYPES = [
  "SPEED", "SLOWNESS", "HASTE", "MINING_FATIGUE", "STRENGTH", "INSTANT_HEALTH", "INSTANT_DAMAGE",
  "JUMP_BOOST", "NAUSEA", "REGENERATION", "RESISTANCE", "FIRE_RESISTANCE", "WATER_BREATHING",
  "INVISIBILITY", "BLINDNESS", "NIGHT_VISION", "HUNGER", "WEAKNESS", "POISON", "WITHER",
  "HEALTH_BOOST", "ABSORPTION", "SATURATION", "GLOWING", "LEVITATION", "LUCK", "UNLUCK",
  "SLOW_FALLING", "CONDUIT_POWER", "DOLPHINS_GRACE", "BAD_OMEN", "HERO_OF_THE_VILLAGE", "DARKNESS",
];

export interface PotionEffectEntry {
  type?: string;
  amplifier?: number;
  duration?: number; // segundos
}

export interface PotionConfig {
  'high-duration'?: number; // segundos, 0 = sin bajón
  'on-eat'?: PotionEffectEntry[];
  'on-crash'?: PotionEffectEntry[];
}

interface PotionEffectsEditorProps {
  potion: PotionConfig;
  mutate: (fn: (potion: PotionConfig) => void) => void;
}

const inputCls = "w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-yellow-400/50";

function EffectList({ title, hint, entries, onAdd, onRemove, onSetField, accent }: {
  title: string;
  hint?: string;
  entries: PotionEffectEntry[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onSetField: (idx: number, field: keyof PotionEffectEntry, value: unknown) => void;
  accent: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className={`text-[10px] font-black uppercase tracking-widest ${accent}`}>{title}</span>
        <button onClick={onAdd} className="text-[9px] font-black text-blue-400 uppercase hover:text-blue-300 transition-colors">+ Efecto</button>
      </div>
      {hint && <p className="text-[10px] text-gray-600 italic">{hint}</p>}
      <div className="space-y-2">
        {entries.map((effect, idx) => (
          <div key={idx} className="flex gap-2 items-end bg-black/20 border border-white/5 rounded-xl p-3">
            <div className="flex-1"><Field label="Efecto">
              <select value={effect.type || 'SPEED'} onChange={(e) => onSetField(idx, 'type', e.target.value)} className={inputCls}>
                {POTION_EFFECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field></div>
            <div className="w-24"><Field label="Amplificador">
              <input type="number" min={0} value={effect.amplifier ?? 0} onChange={(e) => onSetField(idx, 'amplifier', parseInt(e.target.value) || 0)} className={inputCls} />
            </Field></div>
            <div className="w-28"><Field label="Duración (seg)">
              <input type="number" min={1} value={effect.duration ?? 30} onChange={(e) => onSetField(idx, 'duration', parseInt(e.target.value) || 1)} className={inputCls} />
            </Field></div>
            <button onClick={() => onRemove(idx)} className="text-gray-600 hover:text-red-500 transition-colors shrink-0 pb-2.5"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-[10px] text-gray-600 italic">Sin efectos configurados.</p>
        )}
      </div>
    </div>
  );
}

export default function PotionEffectsEditor({ potion, mutate }: PotionEffectsEditorProps) {
  const highDuration = potion['high-duration'] ?? 0;
  const onEat = potion['on-eat'] || [];
  const onCrash = potion['on-crash'] || [];

  const addEffect = (list: 'on-eat' | 'on-crash') => {
    mutate((p) => {
      if (!p[list]) p[list] = [];
      p[list]!.push({ type: 'SPEED', amplifier: 0, duration: 30 });
    });
  };

  const removeEffect = (list: 'on-eat' | 'on-crash', idx: number) => {
    mutate((p) => { p[list]?.splice(idx, 1); });
  };

  const setEffectField = (list: 'on-eat' | 'on-crash', idx: number, field: keyof PotionEffectEntry, value: unknown) => {
    mutate((p) => {
      const entry = p[list]?.[idx] as Record<string, unknown> | undefined;
      if (entry) entry[field] = value;
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-[11px] text-gray-500 leading-relaxed">
        Configura aquí si esta comida da un &quot;subidón&quot; de efectos al comerla y, opcionalmente, un &quot;bajón&quot; después.
        No hace falta escribir ningún comando: esto ya usa la API de Bukkit directamente.
      </p>

      <div className="max-w-xs">
        <Field label="Duración del subidón antes del bajón (segundos, 0 = sin bajón)">
          <input
            type="number"
            min={0}
            value={highDuration}
            onChange={(e) => mutate((p) => { p['high-duration'] = parseInt(e.target.value) || 0; })}
            className={inputCls}
          />
        </Field>
      </div>

      <EffectList
        title="Subidón (al comer)"
        entries={onEat}
        accent="text-green-400"
        onAdd={() => addEffect('on-eat')}
        onRemove={(idx) => removeEffect('on-eat', idx)}
        onSetField={(idx, field, value) => setEffectField('on-eat', idx, field, value)}
      />

      <EffectList
        title="Bajón (tras el subidón)"
        hint={highDuration === 0 ? "Sin efecto mientras la duración del subidón sea 0." : undefined}
        entries={onCrash}
        accent="text-red-400"
        onAdd={() => addEffect('on-crash')}
        onRemove={(idx) => removeEffect('on-crash', idx)}
        onSetField={(idx, field, value) => setEffectField('on-crash', idx, field, value)}
      />
    </div>
  );
}
