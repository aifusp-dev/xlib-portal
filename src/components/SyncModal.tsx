"use client";

import { useState } from 'react';
import { Cloud, CloudUpload, CloudDownload, X, Check, Copy, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSync: () => Promise<string | null>; // Returns token
    onImport: (token: string) => Promise<void>;
}

export default function SyncModal({ isOpen, onClose, onSync, onImport }: SyncModalProps) {
    const [mode, setActiveMode] = useState<'export' | 'import'>('export');
    const [token, setToken] = useState<string | null>(null);
    const [inputToken, setInputToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSync = async () => {
        setLoading(true);
        setError(null);
        try {
            const generatedToken = await onSync();
            if (generatedToken) {
                setToken(generatedToken);
            }
        } catch (err) {
            setError('Error al generar la sincronización.');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!inputToken) return;
        setLoading(true);
        setError(null);
        try {
            await onImport(inputToken);
            onClose();
        } catch (err) {
            setError('Token inválido o expirado.');
        } finally {
            setLoading(false);
        }
    };

    const copyToken = () => {
        if (!token) return;
        navigator.clipboard.writeText(token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative bg-[#111827] border border-[#374151] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-[#374151] flex justify-between items-center">
                    <div className="flex items-center gap-3 text-yellow-400">
                        <Cloud className="w-6 h-6" />
                        <h2 className="text-xl font-bold text-white tracking-tight">xLib Bridge</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-2 bg-black/20 flex gap-1 mx-6 mt-6 rounded-xl border border-white/5">
                    <button 
                        onClick={() => { setActiveMode('export'); setToken(null); setError(null); }}
                        className={cn("flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase rounded-lg transition-all", mode === 'export' ? "bg-accent text-white" : "text-gray-500 hover:text-gray-300")}
                    >
                        <CloudUpload className="w-4 h-4" /> Web a Servidor
                    </button>
                    <button 
                        onClick={() => { setActiveMode('import'); setToken(null); setError(null); }}
                        className={cn("flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase rounded-lg transition-all", mode === 'import' ? "bg-accent text-white" : "text-gray-500 hover:text-gray-300")}
                    >
                        <CloudDownload className="w-4 h-4" /> Servidor a Web
                    </button>
                </div>

                <div className="p-8">
                    {mode === 'export' ? (
                        <div className="space-y-6">
                            {!token ? (
                                <div className="text-center space-y-6 py-4">
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Publica tu configuración actual para descargarla directamente en tu servidor de Minecraft sin archivos manuales.
                                    </p>
                                    <button 
                                        onClick={handleSync}
                                        disabled={loading}
                                        className="w-full bg-accent hover:bg-accent/90 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-3"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />}
                                        Generar Token de Sincronización
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                                    <div className="bg-black/40 rounded-2xl p-6 border border-yellow-400/20 text-center space-y-4">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tu Token de Sincronización</p>
                                        <div className="flex items-center justify-center gap-4">
                                            <span className="text-4xl font-black text-yellow-400 tracking-tighter mono">{token}</span>
                                            <button onClick={copyToken} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-400" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex gap-4">
                                        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-white uppercase">Instrucciones</p>
                                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                                Escribe <code className="bg-black/40 px-1.5 py-0.5 rounded text-blue-400">/xlib sync {token}</code> en tu servidor para actualizar los archivos.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 text-center">
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Introduce el token generado desde tu servidor para cargar tu configuración actual aquí en la web.
                            </p>
                            <div className="space-y-4">
                                <input 
                                    type="text" 
                                    value={inputToken}
                                    onChange={(e) => setInputToken(e.target.value.toUpperCase())}
                                    placeholder="SYNC-XXXXXX"
                                    className="w-full bg-black/40 border border-[#374151] rounded-2xl px-6 py-4 text-center text-xl font-black text-yellow-400 placeholder:text-gray-700 outline-none focus:border-yellow-400/30 transition-all uppercase"
                                />
                                <button 
                                    onClick={handleImport}
                                    disabled={loading || !inputToken}
                                    className="w-full bg-accent hover:bg-accent/90 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudDownload className="w-5 h-5" />}
                                    Cargar desde Servidor
                                </button>
                                {error && <p className="text-red-400 text-xs font-bold uppercase">{error}</p>}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-black/40 border-t border-[#374151] text-center">
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">
                        Los tokens expiran tras 15 minutos o un solo uso.
                    </p>
                </div>
            </div>
        </div>
    );
}
