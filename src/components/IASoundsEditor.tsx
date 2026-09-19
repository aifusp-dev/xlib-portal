"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Music4, Trash2, Upload } from "lucide-react";
import { StudioFile, sanitizePath, soundKeyRef } from "@/lib/studio";

interface IASoundsEditorProps {
  namespace: string;
  /** Todo state.iaSounds — se filtra aquí dentro por "<namespace>/". */
  sounds: Record<string, { sounds: string[] }>;
  rawFiles: StudioFile[];
  mutateSounds: (fn: (sounds: Record<string, { sounds: string[] }>) => void) => void;
  mutateRawFiles: (updater: (rawFiles: StudioFile[]) => StudioFile[]) => void;
}

const soundOggPath = (ns: string, soundId: string) =>
  `plugins/ItemsAdder/contents/${ns}/resource_pack/assets/${ns}/sounds/${soundId}.ogg`;

/**
 * Sección "Sonidos" del Studio (ItemsAdder): sube .ogg custom y mantiene sounds.json del
 * namespace al día. A diferencia de Ítems/Bloques/Muebles (handleIAFileUpload en page.tsx), un
 * sonido no cuelga de ningún ítem concreto -- se reproduce por su clave namespaced suelta (ver
 * SoundUtils.playRandom en xLib) -- así que esta vista es autocontenida, sin selección de ítem,
 * mismo criterio que DropsEditor/HologramTemplatesEditor.
 */
export default function IASoundsEditor({ namespace, sounds, rawFiles, mutateSounds, mutateRawFiles }: IASoundsEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const prefix = `${namespace}/`;
  const soundIds = useMemo(
    () => Object.keys(sounds).filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length)).sort(),
    [sounds, prefix]
  );

  const handleFiles = (files: FileList | File[]) => {
    const oggFiles = Array.from(files).filter((f) => f.name.toLowerCase().endsWith(".ogg"));
    if (oggFiles.length === 0) return;

    (async () => {
      const newRaw: { soundId: string; buffer: ArrayBuffer }[] = [];
      for (const file of oggFiles) {
        const soundId = sanitizePath(file.name.replace(/\.ogg$/i, ""));
        if (!soundId) continue;
        newRaw.push({ soundId, buffer: await file.arrayBuffer() });
      }

      mutateRawFiles((prev) => {
        const next = [...prev];
        for (const { soundId, buffer } of newRaw) {
          const inferredPath = soundOggPath(namespace, soundId);
          const idx = next.findIndex((f) => f.inferredPath === inferredPath);
          const entry: StudioFile = { name: `${soundId}.ogg`, content: buffer, type: "raw", inferredPath };
          if (idx !== -1) next[idx] = entry; else next.push(entry);
        }
        return next;
      });

      mutateSounds((draft) => {
        for (const { soundId } of newRaw) {
          draft[`${namespace}/${soundId}`] = { sounds: [soundKeyRef(namespace, soundId)] };
        }
      });
    })();
  };

  const deleteSound = (soundId: string) => {
    if (!confirm(`¿Borrar el sonido "${soundId}"?`)) return;
    mutateSounds((draft) => { delete draft[`${namespace}/${soundId}`]; });
    mutateRawFiles((prev) => prev.filter((f) => f.inferredPath !== soundOggPath(namespace, soundId)));
  };

  return (
    <div className="space-y-8">
      <div
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        className={`bg-surface-0 p-8 rounded-3xl border-2 border-dashed transition-colors space-y-4 ${dragOver ? "border-yellow-400/50 bg-yellow-400/5" : "border-white/5 hover:border-yellow-400/30"}`}
      >
        <div className="flex justify-between items-center">
          <h4 className="eyebrow">
            Sonidos custom <span className="text-gray-600 normal-case font-medium">(arrastra .ogg aquí — namespace {namespace})</span>
          </h4>
          <button onClick={() => fileInputRef.current?.click()} className="badge badge-ia flex items-center gap-1.5">
            <Upload className="w-3 h-3" /> Subir
          </button>
          <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && handleFiles(e.target.files)} className="hidden" accept=".ogg" multiple />
        </div>
        <p className="hint">
          Cada .ogg se registra como un evento de sonido con el mismo id que el fichero — se reproduce
          desde el plugin con la clave <code className="text-yellow-400">{namespace}:&lt;id&gt;</code>.
        </p>
      </div>

      <div className="space-y-2">
        {soundIds.length === 0 ? (
          <p className="hint">Todavía no hay sonidos custom en este namespace.</p>
        ) : (
          soundIds.map((soundId) => (
            <SoundRow key={soundId} namespace={namespace} soundId={soundId} rawFiles={rawFiles} onDelete={() => deleteSound(soundId)} />
          ))
        )}
      </div>
    </div>
  );
}

function SoundRow({ namespace, soundId, rawFiles, onDelete }: { namespace: string; soundId: string; rawFiles: StudioFile[]; onDelete: () => void }) {
  const inferredPath = soundOggPath(namespace, soundId);
  const rawFile = rawFiles.find((f) => f.inferredPath === inferredPath);

  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!rawFile || !(rawFile.content instanceof ArrayBuffer)) { setObjectUrl(null); return; }
    const url = URL.createObjectURL(new Blob([rawFile.content], { type: "audio/ogg" }));
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [rawFile]);

  return (
    <div className="flex items-center gap-4 bg-surface-0 border border-white/5 rounded-2xl px-4 py-3">
      <Music4 className="w-4 h-4 text-yellow-400 flex-none" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-white truncate">{soundId}</div>
        <div className="text-[10px] text-gray-600 truncate">{namespace}:{soundId}</div>
      </div>
      {objectUrl ? (
        <audio controls src={objectUrl} className="h-8 max-w-[240px]" />
      ) : (
        <span className="text-[10px] text-orange-400 font-semibold uppercase">Falta el .ogg</span>
      )}
      <button onClick={onDelete} title="Borrar" className="p-2 hover:bg-white/10 rounded-lg transition-all flex-none text-gray-500 hover:text-red-400">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
