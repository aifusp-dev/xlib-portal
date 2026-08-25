"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { HologramTemplateConfig, emptyHologramTemplate } from "@/lib/studio";
import CommandActionRow from "@/components/CommandActionRow";
import HologramTextEditor from "@/components/HologramTextEditor";

interface HologramTemplatesEditorProps {
  holograms: Record<string, HologramTemplateConfig>;
  mutate: (fn: (holograms: Record<string, HologramTemplateConfig>) => void) => void;
}

const inputCls = "w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-yellow-400/50";
const labelCls = "text-[10px] text-gray-500 uppercase font-black tracking-widest";
const addButtonCls = "flex items-center gap-1 text-[10px] font-black uppercase bg-pink-500/10 text-pink-400 px-3 py-1.5 rounded-lg border border-pink-500/20 hover:bg-pink-500/20 transition-colors";

export default function HologramTemplatesEditor({ holograms, mutate }: HologramTemplatesEditorProps) {
  const ids = Object.keys(holograms);
  const [selected, setSelected] = useState<string | null>(ids[0] ?? null);

  const addTemplate = () => {
    const raw = prompt("Id de la plantilla (la usarás como /xholograms create <id>):");
    if (!raw) return;
    const id = raw.trim().toLowerCase().replace(/\s+/g, "_");
    if (!id) return;
    if (holograms[id]) {
      alert("Ya existe una plantilla con ese id.");
      return;
    }
    mutate((h) => { h[id] = emptyHologramTemplate(); });
    setSelected(id);
  };

  const removeTemplate = (id: string) => {
    if (!confirm(`¿Borrar la plantilla '${id}'? Las colocaciones que ya existan en el mundo quedarán huérfanas hasta que borres esta plantilla también allí.`)) return;
    mutate((h) => { delete h[id]; });
    if (selected === id) setSelected(null);
  };

  const template = selected ? holograms[selected] : null;

  const mutateTemplate = (fn: (t: HologramTemplateConfig) => void) => {
    if (!selected) return;
    mutate((h) => { fn(h[selected]); });
  };

  return (
    <div className="flex gap-6">
      <div className="w-56 shrink-0 space-y-2">
        <button onClick={addTemplate} className={cn(addButtonCls, "w-full justify-center")}>
          <Plus className="w-3 h-3" /> Plantilla
        </button>

        <div className="space-y-1">
          {ids.map((id) => (
            <div
              key={id}
              onClick={() => setSelected(id)}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors",
                selected === id ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5"
              )}
            >
              <span className="truncate">{id}</span>
              <button onClick={(e) => { e.stopPropagation(); removeTemplate(id); }} className="text-gray-600 hover:text-red-500 shrink-0">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          {ids.length === 0 && <p className="text-[10px] text-gray-600 italic px-3">Ninguna plantilla todavía.</p>}
        </div>
      </div>

      <div className="flex-1 space-y-6 min-w-0">
        {!template ? (
          <p className="text-sm text-gray-500 italic">Selecciona o crea una plantilla.</p>
        ) : (
          <>
            <div>
              <label className={labelCls}>Líneas</label>
              <div className="mt-1">
                <HologramTextEditor
                  value={template.lines.join("\n")}
                  onChange={(text) => mutateTemplate((t) => { t.lines = text.split("\n"); })}
                  rows={4}
                  placeholder={"Título\nSubtítulo"}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Ancho click</label>
                <input
                  type="number" step="0.1" value={template.width}
                  onChange={(e) => mutateTemplate((t) => { t.width = parseFloat(e.target.value) || 1.5; })}
                  className={cn(inputCls, "mt-1")}
                />
              </div>
              <div>
                <label className={labelCls}>Alto click</label>
                <input
                  type="number" step="0.1" value={template.height}
                  onChange={(e) => mutateTemplate((t) => { t.height = parseFloat(e.target.value) || 1.5; })}
                  className={cn(inputCls, "mt-1")}
                />
              </div>
              <div>
                <label className={labelCls}>Escala</label>
                <input
                  type="number" step="0.1" value={template.scale}
                  onChange={(e) => mutateTemplate((t) => { t.scale = parseFloat(e.target.value) || 1.0; })}
                  className={cn(inputCls, "mt-1")}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Permiso para VER el hologram (vacío = cualquiera lo ve)</label>
              <input
                type="text" value={template.permission}
                onChange={(e) => mutateTemplate((t) => { t.permission = e.target.value; })}
                className={cn(inputCls, "mt-1")}
                placeholder="xholograms.usar"
              />
              <p className="text-[9px] text-gray-600 italic mt-1">Quien no tenga este permiso no ve el hologram en absoluto, no solo se le bloquean sus acciones de click.</p>
            </div>

            <PagesEditor
              pages={template.pages}
              onChange={(pages) => mutateTemplate((t) => { t.pages = pages; })}
            />

            <CommandListEditor
              label="Click derecho"
              commands={template.rightClickCommands}
              onChange={(cmds) => mutateTemplate((t) => { t.rightClickCommands = cmds; })}
            />
            <CommandListEditor
              label="Click izquierdo"
              commands={template.leftClickCommands}
              onChange={(cmds) => mutateTemplate((t) => { t.leftClickCommands = cmds; })}
            />

            <p className="text-[10px] text-gray-600 italic">
              Usa %param% en cualquier comando: se sustituye por el valor propio de cada colocación
              (ej. <code>/xholograms create {selected} macdonalds</code> hace que %param% sea &quot;macdonalds&quot; solo ahí).
              {template.pages.length > 0 && " Con páginas, los comandos se siguen ejecutando en cada click además de cambiar de página."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Páginas extra (además de "Líneas", que es siempre la página principal/compartida). Si hay
 * alguna, click derecho/izquierdo pasan a navegar entre páginas — cada una la ve solo, de forma
 * privada, el jugador que la pida (ver HologramPlacementManager#turnPage en el plugin).
 */
function PagesEditor({ pages, onChange }: { pages: string[][]; onChange: (p: string[][]) => void }) {
  const addPage = () => onChange([...pages, ["&aNueva página"]]);
  const updatePage = (i: number, text: string) => onChange(pages.map((p, idx) => (idx === i ? text.split("\n") : p)));
  const removePage = (i: number) => onChange(pages.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className={labelCls}>Páginas extra (privadas, navegables con click)</label>
        <button onClick={addPage} className={addButtonCls}>
          <Plus className="w-3 h-3" /> Página
        </button>
      </div>
      <div className="space-y-2">
        {pages.map((page, i) => (
          <div key={i} className="flex gap-2 items-start bg-black/20 border border-white/5 rounded-xl p-3">
            <span className="text-[10px] text-gray-500 font-bold pt-2 shrink-0">#{i + 2}</span>
            <div className="flex-1 min-w-0">
              <HologramTextEditor value={page.join("\n")} onChange={(text) => updatePage(i, text)} rows={2} />
            </div>
            <button onClick={() => removePage(i)} className="text-gray-600 hover:text-red-500 shrink-0 pt-2">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      {pages.length === 0 && <p className="text-[10px] text-gray-600 italic">Sin páginas extra: click solo ejecuta las acciones de abajo, si tiene.</p>}
    </div>
  );
}

function CommandListEditor({ label, commands, onChange }: { label: string; commands: string[]; onChange: (c: string[]) => void }) {
  const add = () => onChange([...commands, ""]);
  const update = (i: number, raw: string) => onChange(commands.map((c, idx) => (idx === i ? raw : c)));
  const remove = (i: number) => onChange(commands.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className={labelCls}>{label}</label>
        <button onClick={add} className={addButtonCls}>
          <Plus className="w-3 h-3" /> Comando
        </button>
      </div>
      <div className="space-y-2">
        {commands.map((cmd, i) => (
          <CommandActionRow key={i} value={cmd} onChange={(raw) => update(i, raw)} onRemove={() => remove(i)} />
        ))}
      </div>
      {commands.length === 0 && <p className="text-[10px] text-gray-600 italic">Sin acciones.</p>}
    </div>
  );
}
