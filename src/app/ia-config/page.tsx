"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { 
  Upload, 
  FileCode, 
  Download, 
  Package,
  Settings2,
  Trash2,
  FolderOpen,
  Zap,
  Search,
  Maximize2,
  Plus,
  Cloud,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseUploadedFiles, generateZIP, EcosystemState, sanitizePath, StudioFile } from "@/lib/studio";
import { exportEcosystem } from "@/lib/export";
import { Model3DViewer } from "@/components/Model3DViewer";
import SyncModal from "@/components/SyncModal";

const VisualPreview = ({ mcPath, rawFiles, namespace }: { mcPath: string | null, rawFiles: StudioFile[], namespace: string }) => {
    const [url, setUrl] = useState<string | null>(null);
    const [is3D, setIs3D] = useState(false);
    const [modelData, setModelData] = useState<any | null>(null);
    const [textureUrls, setTextureUrls] = useState<Record<string, string>>({});

    useEffect(() => {
        let currentUrl: string | null = null;
        const objectUrls: string[] = [];
        let isCurrent3D = false;
        let currentModel: any = null;
        let currentTextures: Record<string, string> = {};
        
        const cleanup = () => {
            if (currentUrl) URL.revokeObjectURL(currentUrl);
            objectUrls.forEach(u => URL.revokeObjectURL(u));
        };

        if (!mcPath) return cleanup;

        const [ns, path] = mcPath.includes(':') ? mcPath.split(':') : [namespace, mcPath];

        const targetModel = `resource_pack/assets/${ns}/models/${path}.json`;
        const modelFile = rawFiles.find(f => f.inferredPath.endsWith(targetModel));

        if (modelFile) {
            try {
                const text = new TextDecoder().decode(modelFile.content as ArrayBuffer);
                const model = JSON.parse(text);
                if (model.elements) {
                    isCurrent3D = true;
                    currentModel = model;
                    
                    if (model.textures) {
                        Object.entries(model.textures).forEach(([key, texPath]: [string, any]) => {
                            const [tNs, tP] = texPath.includes(':') ? texPath.split(':') : [ns, texPath];
                            const texFile = rawFiles.find(f => f.inferredPath.endsWith(`resource_pack/assets/${tNs}/textures/${tP}.png`));
                            if (texFile) {
                                const u = URL.createObjectURL(new Blob([texFile.content]));
                                currentTextures[key] = u;
                                objectUrls.push(u);
                            }
                        });
                    }
                }
            } catch (e) {
                console.error("3D Load failed", e);
            }
        }

        if (!isCurrent3D) {
            const targetTex = `resource_pack/assets/${ns}/textures/${path}.png`;
            const file = rawFiles.find(f => f.inferredPath.endsWith(targetTex));
            if (file) {
                currentUrl = URL.createObjectURL(new Blob([file.content]));
            }
        }

        setIs3D(isCurrent3D);
        setModelData(currentModel);
        setTextureUrls(currentTextures);
        setUrl(currentUrl);

        return cleanup;
    }, [mcPath, rawFiles, namespace]);

    if (is3D && modelData) {
        return (
            <div className="w-32 h-32 bg-black/40 rounded-2xl flex items-center justify-center border border-white/10 shrink-0 overflow-hidden shadow-inner cursor-grab active:cursor-grabbing">
                <Model3DViewer model={modelData} textureUrls={textureUrls} />
            </div>
        );
    }

    if (!url) return <div className="w-32 h-32 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 shrink-0"><Package className="w-8 h-8 text-gray-700" /></div>;
    
    return (
        <div className="w-32 h-32 bg-black/40 rounded-2xl flex items-center justify-center border border-white/10 shrink-0 overflow-hidden group/preview relative shadow-inner">
            <img src={url} alt="Preview" className="max-w-[80%] max-h-[80%] object-contain image-pixelated transition-transform group-hover/preview:scale-110 duration-500" />
        </div>
    );
};

export default function IAConfigPage() {
  const [projectState, setProjectState] = useState<EcosystemState | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("items");
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isAutoImporting, setIsAutoImporting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iaFileInputRef = useRef<HTMLInputElement>(null);

  const availableNamespaces = useMemo(() => {
    if (!projectState) return [];
    const nss = new Set<string>();
    Object.keys(projectState.iaItems).forEach(k => nss.add(k.split('/')[0]));
    Object.keys(projectState.iaBlocks).forEach(k => nss.add(k.split('/')[0]));
    Object.keys(projectState.iaFurnitures).forEach(k => nss.add(k.split('/')[0]));
    return Array.from(nss).filter(n => n !== '__iainternal').sort();
  }, [projectState]);

  useEffect(() => {
    if (availableNamespaces.length > 0 && !selectedNamespace) {
        setSelectedNamespace(availableNamespaces[0]);
    }
  }, [availableNamespaces, selectedNamespace]);

  const handleSyncToBridge = async () => {
    if (!projectState) return null;
    const blob = await generateZIP(projectState);
    const formData = new FormData();
    formData.append('file', blob, 'sync.zip');

    const res = await fetch('/api/sync/publish', {
        method: 'POST',
        body: formData
    });
    const data = await res.json();
    return data.token;
  };

  const handleImportFromBridge = async (token: string) => {
    const res = await fetch(`/api/sync/download/${token}`);
    if (!res.ok) throw new Error('Token invalid');
    
    const blob = await res.blob();
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(blob);
    const files: File[] = [];
    
    for (const [path, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue;
        const buffer = await zipEntry.async('arraybuffer');
        files.push(new File([buffer], path, { type: 'application/octet-stream' }));
    }

    return await parseUploadedFiles(files);
  };

  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token && !projectState && !isAutoImporting) {
        setIsAutoImporting(true);
        handleImportFromBridge(token)
            .then((state) => {
                setProjectState(state);
                setTimeout(() => {
                    window.history.replaceState({}, '', window.location.pathname);
                }, 100);
            })
            .catch(err => {
                console.error("[Bridge] Auto-import failed", err);
                alert("Error al importar: El token no existe, ha expirado o el archivo está corrupto.");
                window.history.replaceState({}, '', window.location.pathname);
            })
            .finally(() => {
                setIsAutoImporting(false);
            });
    }
  }, [projectState, isAutoImporting, mounted]);

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    try {
      const state = await parseUploadedFiles(e.target.files);
      setProjectState(state);
    } catch (err) {
      console.error("Import failed", err);
    }
  };

  const handleExport = async () => {
    if (!projectState) return;
    await exportEcosystem(projectState);
  };

  const updateIAField = (fullKey: string, path: string, value: any) => {
    if (!projectState) return;
    const newState = { ...projectState };
    
    let targetMap: any;
    if (activeCategory === 'items') targetMap = newState.iaItems;
    else if (activeCategory === 'blocks') targetMap = newState.iaBlocks;
    else targetMap = newState.iaFurnitures;

    const config = targetMap[fullKey];
    if (!config) return;

    const keys = path.split('.');
    let current: any = config;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setProjectState(newState);
  };

  const groupedIA = useMemo(() => {
    if (!projectState || !selectedNamespace) return { items: {}, blocks: {}, furnitures: {} };
    
    const result: Record<string, Record<string, any>> = {
        items: {},
        blocks: {},
        furnitures: {}
    };

    // Filter Items by namespace prefix
    Object.entries(projectState.iaItems).forEach(([fullKey, config]: [string, any]) => {
        if (fullKey.startsWith(`${selectedNamespace}/`)) {
            if (config.items) Object.entries(config.items).forEach(([id, d]) => result.items[id] = { fullKey, data: d });
        }
    });
    Object.entries(projectState.iaBlocks).forEach(([fullKey, config]: [string, any]) => {
        if (fullKey.startsWith(`${selectedNamespace}/`)) {
            if (config.blocks) Object.entries(config.blocks).forEach(([id, d]) => result.blocks[id] = { fullKey, data: d });
        }
    });
    Object.entries(projectState.iaFurnitures).forEach(([fullKey, config]: [string, any]) => {
        if (fullKey.startsWith(`${selectedNamespace}/`)) {
            if (config.furnitures) Object.entries(config.furnitures).forEach(([id, d]) => result.furnitures[id] = { fullKey, data: d });
        }
    });

    return result;
  }, [projectState, selectedNamespace]);

  const currentCategoryMap = groupedIA[activeCategory as keyof typeof groupedIA] || {};
  const filteredItems = Object.entries(currentCategoryMap).filter(([id]) => 
    !searchTerm || id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedData = selectedItem ? currentCategoryMap[selectedItem] : null;

  const handleCreateNew = () => {
    if (!projectState || !selectedNamespace) return;
    const id = prompt("Introduce el ID del nuevo objeto:");
    if (!id) return;
    const sanitizedId = sanitizePath(id);
    const newState = { ...projectState };
    const ns = selectedNamespace;

    const defaultData = {
        display_name: id,
        resource: {
            material: "PAPER",
            generate: true,
            textures: [`${ns}:item/${sanitizedId}`]
        }
    };

    const targetFileId = "new_content";
    const fullKey = `${ns}/${targetFileId}`;
    
    let targetMap: any;
    let keyName = "";
    if (activeCategory === 'items') { targetMap = newState.iaItems; keyName = "items"; }
    else if (activeCategory === 'blocks') { targetMap = newState.iaBlocks; keyName = "blocks"; }
    else { targetMap = newState.iaFurnitures; keyName = "furnitures"; }

    if (!targetMap[fullKey]) targetMap[fullKey] = { info: { namespace: ns }, [keyName]: {} };
    targetMap[fullKey][keyName][sanitizedId] = activeCategory === 'furnitures' ? {
        ...defaultData,
        resource: { ...defaultData.resource, model_path: `${ns}:furniture/${sanitizedId}` },
        specific_properties: {
            furniture: {
                furniture_type: "ARMOR_STAND",
                armor_stand: { invisible: true, small: true },
                hitbox: { length: 1, width: 1, height: 1 }
            }
        }
    } : defaultData;

    setProjectState(newState);
    setSelectedItem(sanitizedId);
  };

  const handleIAFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !projectState || !selectedItem || !selectedNamespace) return;
    const filesList = Array.from(e.target.files);
    const newState = { ...projectState };
    const ns = selectedNamespace;
    
    const subfolder = activeCategory === 'furnitures' ? 'furniture' : (activeCategory === 'blocks' ? 'block' : 'item');

    for (const file of filesList) {
        if (file.name.endsWith('.png')) {
            const buffer = await file.arrayBuffer();
            const sanitizedFileName = sanitizePath(file.name);
            newState.rawFiles.push({
                name: sanitizedFileName,
                content: buffer,
                type: 'raw',
                inferredPath: `plugins/ItemsAdder/contents/${ns}/resource_pack/assets/${ns}/textures/${subfolder}/${sanitizedFileName}`
            });
        }
    }

    for (const file of filesList) {
        if (file.name.endsWith('.json')) {
            let buffer = await file.arrayBuffer();
            const sanitizedFileName = sanitizePath(file.name);
            const modelName = sanitizedFileName.replace('.json', '');

            try {
                const text = new TextDecoder().decode(buffer);
                const model = JSON.parse(text);
                if (model.textures) {
                    Object.keys(model.textures).forEach(key => {
                        const texPath = model.textures[key] as string;
                        const fileName = sanitizePath(texPath.split('/').pop() || texPath).replace('.png', '');
                        if (!texPath.includes(':') || texPath.startsWith(`${ns}:`)) {
                            model.textures[key] = `${ns}:${subfolder}/${fileName}`;
                        }
                    });
                    buffer = new TextEncoder().encode(JSON.stringify(model, null, 2)).buffer;
                }
            } catch (err) {
                console.error("Error remapping JSON", err);
            }

            newState.rawFiles.push({
                name: sanitizedFileName,
                content: buffer,
                type: 'raw',
                inferredPath: `plugins/ItemsAdder/contents/${ns}/resource_pack/assets/${ns}/models/${subfolder}/${sanitizedFileName}`
            });

            updateIAField(selectedData.fullKey, `${activeCategory}.${selectedItem}.resource.model_path`, `${ns}:${subfolder}/${modelName}`);
            updateIAField(selectedData.fullKey, `${activeCategory}.${selectedItem}.resource.generate`, false);
        }
    }

    setProjectState(newState);
    alert(`¡Archivos vinculados!`);
  };

  if (!mounted) return null;

  if (isAutoImporting) {
    return (
        <div className="h-screen flex flex-col items-center justify-center space-y-6 bg-[#0b0f19]">
            <div className="relative">
                <div className="w-24 h-24 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" />
                <Cloud className="absolute inset-0 m-auto w-8 h-8 text-yellow-400 animate-pulse" />
            </div>
            <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-white">Sincronizando con xLib Bridge...</h2>
                <p className="text-gray-500 text-sm animate-pulse px-4">Estamos descargando y procesando tu configuración directamente desde el servidor.</p>
            </div>
        </div>
    );
  }

  if (!projectState) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="space-y-4">
          <div className="bg-yellow-400/10 p-6 rounded-full w-fit mx-auto border border-yellow-400/20">
             <Settings2 className="w-16 h-16 text-yellow-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">ItemsAdder Config Engine</h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">Sube tu carpeta de contenidos o importa desde el servidor.</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-[#374151] rounded-3xl p-16 hover:border-yellow-400/5 hover:bg-yellow-400/5 transition-all cursor-pointer group">
                <input type="file" ref={fileInputRef} onChange={handleFolderUpload} className="hidden" {...({ webkitdirectory: "", directory: "" } as any)} />
                <div className="space-y-6">
                    <div className="bg-white/5 p-5 rounded-2xl w-fit mx-auto group-hover:scale-110 transition-transform duration-300">
                        <Upload className="w-10 h-10 text-gray-400 group-hover:text-yellow-400" />
                    </div>
                    <p className="text-white font-bold text-xl">Seleccionar Carpeta /contents/</p>
                </div>
            </div>

            <div onClick={() => setIsSyncModalOpen(true)} className="border-2 border-dashed border-blue-500/20 rounded-3xl p-16 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all cursor-pointer group">
                <div className="space-y-6">
                    <div className="bg-blue-500/10 p-5 rounded-2xl w-fit mx-auto group-hover:scale-110 transition-transform duration-300">
                        <Cloud className="w-10 h-10 text-blue-400" />
                    </div>
                    <p className="text-white font-bold text-xl">Importar vía xLib Bridge</p>
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-relaxed">Usa un Token SYNC generado desde el servidor</p>
                </div>
            </div>
        </div>

        <SyncModal 
            isOpen={isSyncModalOpen} 
            onClose={() => setIsSyncModalOpen(false)}
            onSync={handleSyncToBridge}
            onImport={handleImportFromBridge}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center bg-[#111827] p-6 rounded-2xl border border-[#374151]">
        <div className="flex items-center gap-6">
          <div className="bg-yellow-400 p-2 rounded-lg text-black font-black text-xs">IA</div>
          <div className="flex flex-col">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Selector de Pack (Namespace)</label>
              <div className="flex items-center gap-2">
                <select 
                    value={selectedNamespace || ""} 
                    onChange={(e) => { setSelectedNamespace(e.target.value); setSelectedItem(null); }}
                    className="bg-transparent text-xl font-bold text-white outline-none border-none cursor-pointer hover:text-yellow-400 transition-colors"
                >
                    {availableNamespaces.map(ns => (
                        <option key={ns} value={ns} className="bg-[#111827] text-white font-bold">{ns}</option>
                    ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsSyncModalOpen(true)} className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-500/20 transition-all border border-blue-500/20 group">
            <Cloud className="w-4 h-4 group-hover:animate-bounce" /> xLib Bridge
          </button>
          <button onClick={() => { setProjectState(null); setSelectedItem(null); setSelectedNamespace(null); }} className="px-6 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-colors">Cerrar</button>
          <button onClick={handleExport} className="flex items-center gap-2 bg-yellow-400 text-black px-8 py-2.5 rounded-xl font-bold hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-400/20"><Download className="w-4 h-4" /> Exportar ZIP</button>
        </div>
      </header>

      <SyncModal 
        isOpen={isSyncModalOpen} 
        onClose={() => setIsSyncModalOpen(false)}
        onSync={handleSyncToBridge}
        onImport={handleImportFromBridge}
      />

      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
        <aside className="col-span-3 bg-[#111827] border border-[#374151] rounded-2xl flex flex-col overflow-hidden shadow-xl">
           <div className="p-4 border-b border-[#374151] flex gap-2 overflow-x-auto scrollbar-hide">
              <button onClick={() => { setActiveCategory('items'); setSelectedItem(null); }} className={cn("px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all flex-shrink-0", activeCategory === 'items' ? "bg-accent text-white" : "text-gray-500 hover:text-gray-300")}>Ítems</button>
              <button onClick={() => { setActiveCategory('blocks'); setSelectedItem(null); }} className={cn("px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all flex-shrink-0", activeCategory === 'blocks' ? "bg-accent text-white" : "text-gray-500 hover:text-gray-300")}>Bloques</button>
              <button onClick={() => { setActiveCategory('furnitures'); setSelectedItem(null); }} className={cn("px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all flex-shrink-0", activeCategory === 'furnitures' ? "bg-accent text-white" : "text-gray-500 hover:text-gray-300")}>Muebles</button>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex gap-2">
                <div className="relative group flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar ID..." 
                        className="w-full bg-white/2 border border-[#374151] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-yellow-400/30 focus:bg-yellow-400/5 transition-all"
                    />
                </div>
                <button onClick={handleCreateNew} title="Crear Nuevo" className="p-2.5 bg-yellow-400 text-black rounded-xl hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-400/10">
                    <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-1">
                {filteredItems.map(([id, entry]) => (
                    <div 
                        key={id} 
                        onClick={() => setSelectedItem(id)} 
                        className={cn(
                            "px-4 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all border flex items-center justify-between group", 
                            selectedItem === id ? "bg-yellow-400/10 border-yellow-400/50 text-white" : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5"
                        )}
                    >
                        <div className="flex flex-col">
                            <span className="truncate">{id}</span>
                            <span className="text-[8px] text-gray-600 truncate">{entry.fullKey.split('/')[1]}.yml</span>
                        </div>
                    </div>
                ))}
              </div>
           </div>
        </aside>

        <main className="col-span-9 bg-[#111827] border border-[#374151] rounded-2xl overflow-y-auto p-8 shadow-2xl space-y-8">
           {selectedData ? (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-8 pb-10">
                <div className="flex justify-between items-start border-b border-[#374151] pb-6">
                   <div className="flex gap-6 items-center flex-1">
                      <VisualPreview 
                        mcPath={selectedData.data.resource?.model_path || (selectedData.data.resource?.textures?.[0] || null)} 
                        rawFiles={projectState.rawFiles} 
                        namespace={selectedNamespace || ""}
                      />
                      <div className="space-y-1 flex-1">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">ID Único</label>
                         <h3 className="text-2xl font-bold text-yellow-400 px-1">{selectedItem}</h3>
                      </div>
                   </div>
                   <div className="bg-yellow-400/10 border border-yellow-400/20 px-3 py-1.5 rounded-lg text-[10px] font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2">
                     <FileCode className="w-3 h-3" /> {activeCategory.toUpperCase()}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Nombre Display</label>
                            <input 
                                type="text" 
                                value={selectedData.data.display_name || ''} 
                                onChange={(e) => updateIAField(selectedData.fullKey, `${activeCategory}.${selectedItem}.display_name`, e.target.value)}
                                className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400 transition-colors" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Material</label>
                            <input 
                                type="text" 
                                value={selectedData.data.resource?.material || ''} 
                                onChange={(e) => updateIAField(selectedData.fullKey, `${activeCategory}.${selectedItem}.resource.material`, e.target.value)}
                                className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400 transition-colors" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Lore</label>
                            <textarea 
                                rows={4}
                                value={Array.isArray(selectedData.data.lore) ? selectedData.data.lore.join('\n') : ''} 
                                onChange={(e) => updateIAField(selectedData.fullKey, `${activeCategory}.${selectedItem}.lore`, e.target.value.split('\n'))}
                                className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400 transition-colors resize-none text-sm" 
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-[#0b0f19] p-6 rounded-2xl border border-white/5 space-y-6">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Modelo / Texturas</h4>
                                <button onClick={() => iaFileInputRef.current?.click()} className="flex items-center gap-2 bg-yellow-400/10 text-yellow-400 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase hover:bg-yellow-400/20 transition-all border border-yellow-400/20">
                                    <Upload className="w-3 h-3" /> Subir Archivos
                                </button>
                                <input type="file" ref={iaFileInputRef} onChange={handleIAFileUpload} className="hidden" accept=".png,.json" multiple />
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Ruta del Modelo</label>
                                    <input 
                                        type="text" 
                                        value={selectedData.data.resource?.model_path || ''} 
                                        onChange={(e) => updateIAField(selectedData.fullKey, `${activeCategory}.${selectedItem}.resource.model_path`, e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-yellow-400 transition-colors text-xs" 
                                        placeholder="namespace:modelo"
                                    />
                                </div>
                                <label className="flex items-center gap-3 cursor-pointer group/toggle">
                                    <div className="relative">
                                        <input type="checkbox" checked={selectedData.data.resource?.generate || false} onChange={(e) => updateIAField(selectedData.fullKey, `${activeCategory}.${selectedItem}.resource.generate`, e.target.checked)} className="sr-only" />
                                        <div className={cn("w-8 h-4 rounded-full transition-colors", selectedData.data.resource?.generate ? "bg-green-500" : "bg-gray-700")}></div>
                                        <div className={cn("absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform", selectedData.data.resource?.generate ? "translate-x-4" : "")}></div>
                                    </div>
                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest group-hover/toggle:text-white transition-colors">Auto-Generar (2D)</span>
                                </label>
                            </div>
                        </div>

                        {activeCategory === 'furnitures' && (
                            <div className="bg-[#0b0f19] p-6 rounded-2xl border border-white/5 space-y-4">
                                <div className="flex items-center gap-2 text-blue-400"><Maximize2 className="w-4 h-4" /><h4 className="text-[10px] font-black uppercase tracking-widest">Hitbox del Mueble</h4></div>
                                <div className="grid grid-cols-3 gap-3">
                                    {['length', 'width', 'height'].map(dim => (
                                        <div key={dim} className="bg-black/20 p-2 rounded-lg border border-white/5">
                                            <label className="text-[8px] font-bold text-gray-500 uppercase block mb-1">{dim}</label>
                                            <input 
                                                type="number" step="0.1" 
                                                value={selectedData.data.specific_properties?.furniture?.hitbox?.[dim] || 1} 
                                                onChange={(e) => updateIAField(selectedData.fullKey, `${activeCategory}.${selectedItem}.specific_properties.furniture.hitbox.${dim}`, parseFloat(e.target.value))} 
                                                className="w-full bg-transparent text-white font-bold outline-none text-xs" 
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                <div className="bg-white/5 p-8 rounded-full border border-white/5">
                    <FolderOpen className="w-16 h-16 text-gray-800" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-gray-400 tracking-tight">Explorador de Configuración</h3>
                    <p className="text-sm text-gray-600 max-w-xs">Selecciona un ítem del listado lateral para editar su configuración técnica y recursos.</p>
                </div>
             </div>
           )}
        </main>
      </div>
    </div>
  );
}
