"use client";

import { useMemo, useState } from "react";
import { FileImage, FileJson, Music4, Trash2, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { StudioFile } from "@/lib/studio";

interface OrphanFilesModalProps {
    isOpen: boolean;
    onClose: () => void;
    orphanFiles: StudioFile[];
    onDeleteSelected: (paths: string[]) => void;
}

const iconFor = (name: string) => {
    if (name.endsWith('.png')) return <FileImage className="w-4 h-4 text-blue-400 shrink-0" />;
    if (name.endsWith('.json')) return <FileJson className="w-4 h-4 text-accent shrink-0" />;
    if (name.endsWith('.ogg')) return <Music4 className="w-4 h-4 text-purple-400 shrink-0" />;
    return <FileImage className="w-4 h-4 text-ink-2 shrink-0" />;
};

const formatSize = (content: StudioFile['content']): string => {
    const bytes = content instanceof ArrayBuffer ? content.byteLength
        : content instanceof Blob ? content.size
        : new TextEncoder().encode(String(content)).length;
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
};

/** Quita el prefijo común "plugins/ItemsAdder/contents/" para que la lista sea legible. */
const displayPath = (inferredPath: string) => inferredPath.replace(/^plugins\/ItemsAdder\/contents\//, '');

/**
 * Lista los rawFiles (.json/.png/.ogg de ItemsAdder) que ningún ítem/bloque/mueble/sonido/canción
 * referencia ya -- el mismo tipo de huérfano que motivó el bug de resource_pack/ y los de
 * Clonar/Renombrar: un fichero real en el ZIP que ya no cumple ninguna función, solo ocupa sitio
 * y confunde si alguien lo encuentra navegando el servidor a mano.
 */
export default function OrphanFilesModal({ isOpen, onClose, orphanFiles, onDeleteSelected }: OrphanFilesModalProps) {
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const sorted = useMemo(
        () => [...orphanFiles].sort((a, b) => a.inferredPath.localeCompare(b.inferredPath)),
        [orphanFiles]
    );

    if (!isOpen) return null;

    const allSelected = sorted.length > 0 && selected.size === sorted.length;

    const toggle = (path: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path); else next.add(path);
            return next;
        });
    };

    const toggleAll = () => {
        setSelected(allSelected ? new Set() : new Set(sorted.map(f => f.inferredPath)));
    };

    const handleDelete = () => {
        if (selected.size === 0) return;
        if (!confirm(`¿Borrar ${selected.size} archivo(s)? No se puede deshacer.`)) return;
        onDeleteSelected(Array.from(selected));
        setSelected(new Set());
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-surface-1 border border-line-strong w-full max-w-2xl rounded-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-line-strong flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3 text-orange-400">
                        <AlertTriangle className="w-6 h-6" />
                        <h2 className="text-xl font-bold text-ink tracking-tight">Recursos Sueltos</h2>
                    </div>
                    <button onClick={onClose} className="text-ink-2 hover:text-ink transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="px-6 py-4 bg-black/20 border-b border-line-strong shrink-0">
                    <p className="text-xs text-ink-2 leading-relaxed">
                        Modelos, texturas y sonidos de ItemsAdder que ya no referencia ningún ítem, bloque, mueble,
                        sonido ni canción de este proyecto. Suelen quedar así tras borrar/editar un ítem desde fuera
                        del Studio, o de versiones antiguas de la convención de carpetas. Revisa la lista antes de
                        borrar: si dos ítems comparten a propósito el mismo modelo/textura, esta vista no lo sabe.
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {sorted.length === 0 ? (
                        <div className="py-16 text-center text-ink-2 text-sm">
                            No hay ningún recurso suelto. Todo lo que hay en el proyecto está en uso.
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {sorted.map(file => (
                                <label key={file.inferredPath} className="flex items-center gap-3 px-6 py-3 hover:bg-white/5 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={selected.has(file.inferredPath)}
                                        onChange={() => toggle(file.inferredPath)}
                                        className="w-4 h-4 accent-orange-400 shrink-0"
                                    />
                                    {iconFor(file.name)}
                                    <span className="flex-1 truncate text-sm text-ink font-mono">{displayPath(file.inferredPath)}</span>
                                    <span className="text-[10px] text-ink-3 font-bold uppercase shrink-0">{formatSize(file.content)}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-black/40 border-t border-line-strong flex items-center justify-between shrink-0">
                    {sorted.length > 0 ? (
                        <label className="flex items-center gap-2 text-xs text-ink-2 cursor-pointer">
                            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 accent-orange-400" />
                            Seleccionar todos ({sorted.length})
                        </label>
                    ) : <span />}
                    <button
                        onClick={handleDelete}
                        disabled={selected.size === 0}
                        className={cn("flex items-center gap-2 px-6 py-2.5 rounded-md font-bold text-sm transition-all",
                            selected.size === 0
                                ? "bg-white/5 text-ink-3 cursor-not-allowed"
                                : "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20")}
                    >
                        <Trash2 className="w-4 h-4" /> Borrar seleccionados ({selected.size})
                    </button>
                </div>
            </div>
        </div>
    );
}
