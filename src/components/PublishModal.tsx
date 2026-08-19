"use client";

import { useState } from 'react';
import { Rocket, X, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PublishModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemId: string;
    /** Devuelve un mensaje de error, o null si se publicó bien. */
    onPublish: (title: string, description: string) => Promise<string | null>;
}

export default function PublishModal({ isOpen, onClose, itemId, onPublish }: PublishModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    if (!isOpen) return null;

    const close = () => {
        onClose();
        // Reset tras la animación de cierre, no antes.
        setTimeout(() => { setTitle(''); setDescription(''); setError(null); setDone(false); }, 200);
    };

    const submit = async () => {
        if (!title.trim()) { setError('Ponle un título.'); return; }
        setLoading(true);
        setError(null);
        const errMsg = await onPublish(title.trim(), description.trim());
        setLoading(false);
        if (errMsg) setError(errMsg);
        else setDone(true);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={close} />
            <div className="relative bg-[#111827] border border-[#374151] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-[#374151] flex justify-between items-center">
                    <div className="flex items-center gap-3 text-yellow-400">
                        <Rocket className="w-6 h-6" />
                        <h2 className="text-xl font-bold text-white tracking-tight">Publicar en Descubrir</h2>
                    </div>
                    <button onClick={close} className="text-gray-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8">
                    {done ? (
                        <div className="text-center space-y-4 py-4 animate-in fade-in">
                            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
                            <p className="text-white font-semibold">¡Enviado!</p>
                            <p className="text-gray-400 text-sm">Queda pendiente hasta que un Verificador lo revise. Te avisamos aquí si lo aprueba o lo rechaza.</p>
                            <button onClick={close} className="mt-2 px-6 py-2 rounded-xl bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition-colors">Cerrar</button>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <p className="text-gray-400 text-sm">
                                Vas a publicar <code className="bg-black/40 px-1.5 py-0.5 rounded text-yellow-400">{itemId}</code> (con su vínculo IA y assets, si los tiene) para que cualquiera pueda instalarlo desde Descubrir.
                            </p>
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
                            {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
                            <button
                                onClick={submit}
                                disabled={loading}
                                className={cn("w-full bg-accent hover:bg-accent/90 text-white py-3.5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-3", loading && "opacity-60")}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                                Enviar a revisión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
