"use client";

import { useEffect, useRef, useState } from "react";
import { Disc3, Trash2, Upload } from "lucide-react";
import { SongConfig, StudioFile, sanitizePath, soundKeyRef } from "@/lib/studio";

const NAMESPACE = "xboombox";

interface BoomboxSongsEditorProps {
  songs: Record<string, SongConfig>;
  mutateSongs: (fn: (songs: Record<string, SongConfig>) => void) => void;
  /** Igual que en IASoundsEditor: aquí se reutiliza el mismo motor de sonidos de ItemsAdder,
   * namespace fijo "xboombox" — una canción es, por debajo, un sonido custom + sus metadatos. */
  mutateSounds: (fn: (sounds: Record<string, { sounds: string[] }>) => void) => void;
  rawFiles: StudioFile[];
  mutateRawFiles: (updater: (rawFiles: StudioFile[]) => StudioFile[]) => void;
}

const soundOggPath = (soundId: string) =>
  `plugins/ItemsAdder/contents/${NAMESPACE}/resource_pack/assets/${NAMESPACE}/sounds/${soundId}.ogg`;

const inputCls = "w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-yellow-400/50";
const labelCls = "text-[10px] text-gray-500 uppercase font-black tracking-widest";

/**
 * Sección "Boombox" del Studio: un formulario único (id + nombre + artista + duración + .ogg)
 * que en un solo paso da de alta el sonido custom (namespace "xboombox", reutilizando el mismo
 * mecanismo que IASoundsEditor sobre state.iaSounds/rawFiles) y el fichero de metadatos que lee
 * SongLoader.java (xBoomBox/songs/<id>.yml) — pensado para que no haga falta ir primero a la
 * pestaña genérica de Sonidos de ItemsAdder y luego acordarse de crear la canción aparte.
 */
export default function BoomboxSongsEditor({ songs, mutateSongs, mutateSounds, rawFiles, mutateRawFiles }: BoomboxSongsEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [newId, setNewId] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [newDuration, setNewDuration] = useState("");

  const ids = Object.keys(songs).sort();

  const addSong = (files: FileList | File[]) => {
    const oggFile = Array.from(files).find((f) => f.name.toLowerCase().endsWith(".ogg"));
    if (!oggFile) return;

    const id = sanitizePath(newId.trim() || oggFile.name.replace(/\.ogg$/i, ""));
    if (!id) return;
    if (songs[id]) {
      alert(`Ya existe una canción con el id "${id}".`);
      return;
    }

    (async () => {
      const buffer = await oggFile.arrayBuffer();
      const inferredPath = soundOggPath(id);

      mutateRawFiles((prev) => {
        const next = [...prev];
        const idx = next.findIndex((f) => f.inferredPath === inferredPath);
        const entry: StudioFile = { name: `${id}.ogg`, content: buffer, type: "raw", inferredPath };
        if (idx !== -1) next[idx] = entry; else next.push(entry);
        return next;
      });

      mutateSounds((draft) => {
        draft[`${NAMESPACE}/${id}`] = { sounds: [soundKeyRef(NAMESPACE, id)] };
      });

      mutateSongs((draft) => {
        draft[id] = {
          displayName: newDisplayName.trim() || id,
          artist: newArtist.trim() || "unknown",
          duration: newDuration.trim() || "0:00",
          soundId: soundKeyRef(NAMESPACE, id),
        };
      });

      setNewId("");
      setNewDisplayName("");
      setNewArtist("");
      setNewDuration("");
    })();
  };

  const updateSong = (id: string, patch: Partial<SongConfig>) => {
    mutateSongs((draft) => { draft[id] = { ...draft[id], ...patch }; });
  };

  const deleteSong = (id: string) => {
    if (!confirm(`¿Borrar la canción "${id}"? También se borra su .ogg del pack.`)) return;
    mutateSongs((draft) => { delete draft[id]; });
    mutateSounds((draft) => { delete draft[`${NAMESPACE}/${id}`]; });
    mutateRawFiles((prev) => prev.filter((f) => f.inferredPath !== soundOggPath(id)));
  };

  return (
    <div className="space-y-8">
      <div
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); addSong(e.dataTransfer.files); }}
        className={`bg-surface-0 p-8 rounded-3xl border-2 border-dashed transition-colors space-y-4 ${dragOver ? "border-yellow-400/50 bg-yellow-400/5" : "border-white/5 hover:border-yellow-400/30"}`}
      >
        <h4 className="eyebrow">
          Nueva canción <span className="text-gray-600 normal-case font-medium">(rellena los datos y arrastra el .ogg, o dale a Subir)</span>
        </h4>

        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className={labelCls}>Id (nombre de fichero)</label>
            <input type="text" value={newId} onChange={(e) => setNewId(e.target.value)} placeholder="midnight_drive" className={`${inputCls} mt-1`} />
          </div>
          <div>
            <label className={labelCls}>Nombre</label>
            <input type="text" value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} placeholder="Midnight Drive" className={`${inputCls} mt-1`} />
          </div>
          <div>
            <label className={labelCls}>Artista</label>
            <input type="text" value={newArtist} onChange={(e) => setNewArtist(e.target.value)} placeholder="DJ Aifusp" className={`${inputCls} mt-1`} />
          </div>
          <div>
            <label className={labelCls}>Duración</label>
            <input type="text" value={newDuration} onChange={(e) => setNewDuration(e.target.value)} placeholder="3:12" className={`${inputCls} mt-1`} />
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={() => fileInputRef.current?.click()} className="badge badge-ia flex items-center gap-1.5">
            <Upload className="w-3 h-3" /> Subir .ogg
          </button>
          <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && addSong(e.target.files)} className="hidden" accept=".ogg" />
        </div>
        <p className="hint">
          El id se usa como nombre de fichero (<code className="text-yellow-400">xBoomBox/songs/&lt;id&gt;.yml</code>) y
          como clave del sonido (<code className="text-yellow-400">xboombox:&lt;id&gt;</code>). Si lo dejas vacío se usa
          el nombre del propio .ogg.
        </p>
      </div>

      <div className="space-y-2">
        {ids.length === 0 ? (
          <p className="hint">Todavía no hay canciones.</p>
        ) : (
          ids.map((id) => (
            <SongRow key={id} id={id} song={songs[id]} rawFiles={rawFiles} onChange={(patch) => updateSong(id, patch)} onDelete={() => deleteSong(id)} />
          ))
        )}
      </div>
    </div>
  );
}

function SongRow({ id, song, rawFiles, onChange, onDelete }: {
  id: string; song: SongConfig; rawFiles: StudioFile[];
  onChange: (patch: Partial<SongConfig>) => void; onDelete: () => void;
}) {
  const inferredPath = soundOggPath(id);
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
      <Disc3 className="w-4 h-4 text-yellow-400 flex-none" />
      <div className="grid grid-cols-3 gap-3 flex-1 min-w-0">
        <input type="text" value={song.displayName} onChange={(e) => onChange({ displayName: e.target.value })} className={inputCls} />
        <input type="text" value={song.artist} onChange={(e) => onChange({ artist: e.target.value })} className={inputCls} />
        <input type="text" value={song.duration} onChange={(e) => onChange({ duration: e.target.value })} className={inputCls} />
      </div>
      {objectUrl ? (
        <audio controls src={objectUrl} className="h-8 max-w-[200px] flex-none" />
      ) : (
        <span className="text-[10px] text-orange-400 font-semibold uppercase flex-none">Falta el .ogg</span>
      )}
      <button onClick={onDelete} title="Borrar" className="p-2 hover:bg-white/10 rounded-lg transition-all flex-none text-gray-500 hover:text-red-400">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
