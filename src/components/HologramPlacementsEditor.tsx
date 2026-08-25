"use client";

import { useMemo, useState } from "react";
import { Trash2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { HologramPlacementConfig, HologramTemplateConfig } from "@/lib/studio";

interface HologramPlacementsEditorProps {
  placements: Record<string, HologramPlacementConfig>;
  templates: Record<string, HologramTemplateConfig>;
  mutate: (fn: (placements: Record<string, HologramPlacementConfig>) => void) => void;
}

const inputCls = "w-full bg-black/20 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-yellow-400/50";

const AXES = ["x", "y", "z"] as const;

/**
 * Colocaciones ya puestas en el mundo: NO se crean aquí (solo nacen en el juego con
 * {@code /xholograms create}), solo se editan (plantilla, mundo, posición, param) o se borran.
 * Al sincronizar, {@code HologramPlacementManager.reloadFromDisk()} en el plugin teletransporta
 * la entidad real si cambió la posición, y borra la que ya no aparezca aquí.
 */
export default function HologramPlacementsEditor({ placements, templates, mutate }: HologramPlacementsEditorProps) {
  const allIds = Object.keys(placements);
  const [search, setSearch] = useState("");

  const ids = useMemo(() => {
    if (!search.trim()) return allIds;
    const q = search.trim().toLowerCase();
    return allIds.filter((id) => {
      const p = placements[id];
      return id.toLowerCase().includes(q)
        || p.template.toLowerCase().includes(q)
        || p.world.toLowerCase().includes(q)
        || p.param.toLowerCase().includes(q);
    });
  }, [allIds, placements, search]);

  const update = (id: string, patch: Partial<HologramPlacementConfig>) => {
    mutate((p) => { p[id] = { ...p[id], ...patch }; });
  };

  const remove = (id: string) => {
    if (!confirm(`¿Borrar la colocación '${id}'? Al sincronizar también se eliminará su hologram en el mundo.`)) return;
    mutate((p) => { delete p[id]; });
  };

  if (allIds.length === 0) {
    return <p className="text-sm text-gray-500 italic">Todavía no hay ninguna colocación — créalas en el juego con /xholograms create &lt;plantilla&gt;.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="relative w-64">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por id, plantilla, mundo o param..."
          className={cn(inputCls, "pl-7 py-1.5")}
        />
      </div>

      {ids.length === 0 ? (
        <p className="text-[10px] text-gray-600 italic">Sin resultados para &quot;{search}&quot;.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] text-gray-500 uppercase font-black tracking-widest border-b border-white/10">
                <th className="py-2 pr-3">Id</th>
                <th className="py-2 pr-3">Plantilla</th>
                <th className="py-2 pr-3">Mundo</th>
                <th className="py-2 pr-3">X</th>
                <th className="py-2 pr-3">Y</th>
                <th className="py-2 pr-3">Z</th>
                <th className="py-2 pr-3">Param</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {ids.map((id) => {
                const placement = placements[id];
                return (
                  <tr key={id} className="border-b border-white/5">
                    <td className="py-2 pr-3 text-gray-400 whitespace-nowrap">{id}</td>
                    <td className="py-2 pr-3">
                      <select value={placement.template} onChange={(e) => update(id, { template: e.target.value })} className={inputCls}>
                        {Object.keys(templates).map((t) => (
                          <option key={t} value={t} className="bg-surface-1">{t}</option>
                        ))}
                        {!templates[placement.template] && (
                          <option value={placement.template} className="bg-surface-1">{placement.template} (no existe)</option>
                        )}
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <input type="text" value={placement.world} onChange={(e) => update(id, { world: e.target.value })} className={inputCls} />
                    </td>
                    {AXES.map((axis) => (
                      <td key={axis} className="py-2 pr-3">
                        <input
                          type="number" step="0.5" value={placement[axis]}
                          onChange={(e) => update(id, { [axis]: parseFloat(e.target.value) || 0 } as Partial<HologramPlacementConfig>)}
                          className={inputCls}
                        />
                      </td>
                    ))}
                    <td className="py-2 pr-3">
                      <input type="text" value={placement.param} onChange={(e) => update(id, { param: e.target.value })} className={inputCls} />
                    </td>
                    <td className="py-2">
                      <button onClick={() => remove(id)} className="text-gray-600 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
