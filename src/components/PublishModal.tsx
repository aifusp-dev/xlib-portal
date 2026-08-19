"use client";

import { useState, useMemo } from 'react';
import { Rocket, X, Loader2, CheckCircle2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EcosystemState, PluginEditor, EDITOR_MAPS, EDITOR_LABELS, leafId } from '@/lib/studio';
import { PresetItemRef } from '@/lib/preset-bundle';

interface PublishModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectState: EcosystemState;
    primaryEditor: PluginEditor;
    primaryItemId: string;
    onPublish: (title: string, description: string, items: PresetItemRef[]) => Promise<string | null>;
}

const key = (r: PresetItemRef) => `${r.editor}:${r.itemId}`;

export default function PublishModal({ isOpen, onClose, projectState, primaryEditor, primaryItemId, onPublish }: PublishModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [search, setSearch] = useState('');
    const [extra, setExtra] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    const primaryRef: PresetItemRef = { editor: primaryEditor, itemId: primaryItemId };

    // Todo lo que hay en el proyecto, agrupado por sección, para elegir qué añadir al paquete
    // (p.ej. la comida que produce esta Estación, o el ítem que da este cultivo).
    const candidatesByEditor = useMemo(() => {
        const groups: Record<PluginEditor, string[]> = { xfoods: [], xcrops: [], xmachines: [], xpods: [], xautomation: [] };
        (Object.keys(EDITOR_MAPS) as PluginEditor[]).forEach((editor) => {
            const map = projectState[EDITOR_MAPS[editor]];
            groups[editor] = Object.keys(map)
                .filter((id) => !(editor === primaryEditor && id === primaryItemId))
                .filter((id) => !search || leafId(id).toLowerCase().includes(search.toLowerCase()))
                .sort();
        });
        return groups;
    }, [projectState, primaryEditor, primaryItemId, search]);

    if (!isOpen) return null;

    const close = () => {
        onClose();
        setTimeout(() => { setTitle(''); setDescription(''); setSearch(''); setExtra(new Set()); setError(null); setDone(false); }, 200);
    };

    const toggle = (ref: PresetItemRef) => {
        setExtra((prev) => {
            const next = new Set(prev);
            const k = key(ref);
            if (next.has(k)) next.delete(k); else next.add(k);
            return next;
        });
    };

    const submit = async () => {
        if (!title.trim()) { setError('Ponle un título.'); return; }
        setLoading(true);
        setError(null);
        const items: PresetItemRef[] = [primaryRef, ...[...extra].map((k) => {
            const [editor, ...rest] = k.split(':');
            return { editor: editor as PluginEditor, itemId: rest.join(':') };
        })];
        const errMsg = await onPublish(title.trim(), description.trim(), items);
        setLoading(false);
        if (errMsg) setError(errMsg);
        else setDone(true);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={close} />
            <div className="relative bg-[#111827] border border-[#374151] w-full max-w-2xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
                <div className="p-6 border-b border-[#374151] flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3 text-yellow-400">
                        <Rocket className="w-6 h-6" />
                        <h2 className="text-xl font-bold text-white tracking-tight">Publicar en Descubrir</h2>
                    </div>
                    <button onClick={close} className="text-gray-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-6">
                    {done ? (
                        <div className="text-center space-y-4 py-4 animate-in fade-in">
                            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
                            <p className="text-white font-semibold">¡Enviado!</p>
                            <p className="text-gray-400 text-sm">Queda pendiente hasta que un Verificador lo revise. Te avisamos aquí si lo aprueba o lo rechaza.</p>
                            <button onClick={close} className="mt-2 px-6 py-2 rounded-xl bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition-colors">Cerrar</button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Título</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="p.ej. All-in-One Coffee Machine"
                                    className="w-full bg-black/40 border border-[#374151] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-700 outline-none focus:border-yellow-400/30 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Descripción (opcional)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    placeholder="Qué hace, requisitos, notas para quien la instale..."
                                    className="w-full bg-black/40 border border-[#374151] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-700 outline-none focus:border-yellow-400/30 transition-all resize-none"
                                />
                            </div>

                            <div className="space-y-3 pt-2 border-t border-white/5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        Paquete: qué se instala junto a <code className="text-yellow-400">{leafId(primaryItemId)}</code>
                                    </label>
                                </div>
                                <p className="text-[11px] text-gray-500">
                                    Marca también, por ejemplo, la comida que produce esta Estación o el ítem que da este cultivo — quien instale el paquete se lo lleva todo de una vez.
                                </p>
                                <div className="relative">
                                    <Search className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Buscar en tu proyecto..."
                                        className="w-full bg-black/40 border border-[#374151] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-gray-700 outline-none focus:border-yellow-400/30 transition-all"
                                    />
                                </div>
                                <div className="max-h-56 overflow-y-auto space-y-3 bg-black/20 rounded-xl p-3 border border-white/5">
                                    {(Object.keys(EDITOR_MAPS) as PluginEditor[]).map((editor) => {
                                        const ids = candidatesByEditor[editor];
                                        if (ids.length === 0) return null;
                                        return (
                                            <div key={editor} className="space-y-1">
                                                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-wider px-1">{EDITOR_LABELS[editor]}</p>
                                                {ids.map((id) => {
                                                    const ref = { editor, itemId: id };
                                                    const checked = extra.has(key(ref));
                                                    return (
                                                        <label key={id} className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-white/5 cursor-pointer">
                                                            <input type="checkbox" checked={checked} onChange={() => toggle(ref)} className="rounded bg-black border-white/10 text-yellow-400" />
                                                            <span className="text-xs text-gray-300">{leafId(id)}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                    {Object.values(candidatesByEditor).every((v) => v.length === 0) && (
                                        <p className="text-xs text-gray-600 text-center py-2">No hay nada más en tu proyecto para añadir.</p>
                                    )}
                                </div>
                                {extra.size > 0 && (
                                    <p className="text-[11px] text-yellow-400/80">{extra.size + 1} ítems incluidos en el paquete.</p>
                                )}
                            </div>

                            {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
                            <button
                                onClick={submit}
                                disabled={loading}
                                className={cn("w-full bg-accent hover:bg-accent/90 text-white py-3.5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-3", loading && "opacity-60")}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                                Enviar a revisión
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
