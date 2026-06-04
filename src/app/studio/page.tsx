"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { 
  Upload, 
  FileCode, 
  Download, 
  Plus, 
  FolderSearch,
  Package,
  Binary,
  Settings2,
  Info,
  Flame,
  Trash2,
  Clock,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Zap,
  Copy,
  Search,
  Cloud,
  ChefHat,
  Sprout,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateZIP, parseUploadedFiles, EcosystemState, stringifyYaml, sanitizePath, StudioFile } from "@/lib/studio";
import { exportEcosystem } from "@/lib/export";
import SyncModal from "@/components/SyncModal";
import { Model3DViewer } from "@/components/Model3DViewer";

// --- TYPES ---
interface IAItemConfig {
  resource?: {
    generate?: boolean;
    model_path?: string;
    textures?: string[];
  };
}

// --- COMPONENTS ---
const AutocompleteInput = ({ value, onChange, options, placeholder, className }: { 
    value: string, 
    onChange: (val: string) => void, 
    options: string[], 
    placeholder?: string, 
    className?: string 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const filtered = options.filter(opt => opt.toLowerCase().includes(value.toLowerCase()));

    return (
        <div className="relative w-full">
            <input 
                type="text" 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                className={className} 
                placeholder={placeholder}
            />
            {isOpen && filtered.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-[#111827] border border-[#374151] rounded-xl shadow-2xl max-h-40 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {filtered.map(opt => (
                        <div 
                            key={opt} 
                            onClick={() => { onChange(opt); setIsOpen(false); }}
                            className="px-4 py-2 text-[10px] text-gray-300 hover:bg-white/5 cursor-pointer uppercase font-bold"
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

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

// --- MAIN PAGE ---
export default function StudioWorkspace() {
  const [projectState, setProjectState] = useState<EcosystemState | null>(null);
  const [activeEditor, setActiveEditor] = useState<'ia' | 'xfoods' | 'xcrops' | 'xmachines'>('xfoods');
  const [activeCategory, setActiveCategory] = useState<string>("items"); 
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [activePreview, setActivePreview] = useState<'plugin' | 'ia'>('plugin');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isAutoImporting, setIsAutoImporting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const iaFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    const state = await parseUploadedFiles(files);
    setProjectState(state);
    return state;
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
                alert("Error al importar: El token no existe o ha expirado.");
                window.history.replaceState({}, '', window.location.pathname);
            })
            .finally(() => setIsAutoImporting(false));
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

  const updateField = (path: string, value: any, iaFullKey?: string) => {
    if (!projectState || !selectedItem) return;
    const newState = { ...projectState };
    
    if (activeEditor === 'ia' && iaFullKey) {
        let targetMap: any;
        if (activeCategory === 'items') targetMap = newState.iaItems;
        else if (activeCategory === 'blocks') targetMap = newState.iaBlocks;
        else targetMap = newState.iaFurnitures;

        const config = targetMap[iaFullKey];
        if (!config) return;

        const keys = path.split('.');
        let current: any = config;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
    } 
    else {
        const entry = activeEditor === 'xfoods' ? newState.foods[selectedItem] : 
                      (activeEditor === 'xcrops' ? newState.crops[selectedItem] : newState.machines[selectedItem]);
        
        if (path === 'folder') {
            entry.folder = value;
        } else if (path === 'ia-toggle') {
            const item = entry.config;
            if (value) {
                if (!(item as any).item && activeEditor === 'xfoods') (item as any).item = {};
                if (!(item as any).seed && activeEditor === 'xcrops') (item as any).seed = {};
                
                const target = activeEditor === 'xfoods' ? (item as any).item : (item as any).seed;
                const subfolder = activeEditor === 'xfoods' ? 'food' : 'crops';
                (target as Record<string, unknown>)['itemsadder-id'] = `${newState.projectName}:${selectedItem}`;
                
                const iaItems: Record<string, unknown> = {
                    [selectedItem]: {
                        display_name: (item as any)['display-name'] || "Nuevo Ítem",
                        permission: `${newState.projectName.toLowerCase()}.${selectedItem}`,
                        resource: { 
                            material: (target as Record<string, string>)?.material || "PAPER",
                            generate: true, 
                            textures: [`${newState.projectName}:item/${subfolder}/${selectedItem}`] 
                        }
                    }
                };

                const fullKey = `${newState.projectName}/${selectedItem}`;
                newState.iaItems[fullKey] = { 
                    info: { namespace: newState.projectName },
                    items: iaItems 
                };
            } else {
                if (activeEditor === 'xfoods' && (item as any).item) delete (item as any).item['itemsadder-id'];
                if (activeEditor === 'xcrops' && (item as any).seed) delete (item as any).seed['itemsadder-id'];
                delete newState.iaItems[`${newState.projectName}/${selectedItem}`];
            }
        } else {
            const keys = path.split('.');
            let current: any = entry;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current = current[keys[i]];
            }
            if (keys[keys.length-1] === 'lore' && typeof value === 'string') {
                current[keys[keys.length-1]] = value.split('\n');
            } else {
                current[keys[keys.length-1]] = value;
            }
        }
    }
    setProjectState(newState);
  };

  const handleCreateNew = () => {
    if (!projectState) return;
    const timestamp = Date.now();
    const newState = { ...projectState };
    if (activeEditor === 'ia') {
        const id = prompt("ID del objeto ItemsAdder:");
        if (!id || !selectedNamespace) return;
        const sid = sanitizePath(id);
        const targetFileId = activeCategory === 'furnitures' ? "created_furnitures" : (activeCategory === 'blocks' ? "created_blocks" : "created_items");
        const fullKey = `${selectedNamespace}/${targetFileId}`;
        
        let targetMap: any;
        let keyName = "";
        if (activeCategory === 'items') { targetMap = newState.iaItems; keyName = "items"; }
        else if (activeCategory === 'blocks') { targetMap = newState.iaBlocks; keyName = "blocks"; }
        else { targetMap = newState.iaFurnitures; keyName = "furnitures"; }

        // MANDATORY: Ensure info section exists with namespace and type
        if (!targetMap[fullKey]) {
            targetMap[fullKey] = { 
                info: { 
                    namespace: selectedNamespace,
                    type: activeCategory.toUpperCase()
                }, 
                [keyName]: {} 
            };
        }
        if (!targetMap[fullKey][keyName]) targetMap[fullKey][keyName] = {};

        targetMap[fullKey][keyName][sid] = activeCategory === 'furnitures' ? {
            display_name: id,
            resource: { material: "PAPER", generate: true, model_path: `${selectedNamespace}:furniture/${sid}` },
            specific_properties: {
                furniture: {
                    furniture_type: "ARMOR_STAND",
                    armor_stand: { invisible: true, small: true },
                    hitbox: { length: 1, width: 1, height: 1 }
                }
            }
        } : { 
            display_name: id, 
            resource: { material: "PAPER", generate: true, textures: [`${selectedNamespace}:item/${sid}`] } 
        };
        setProjectState(newState);
        setSelectedItem(sid);
    } else {
        const id = sanitizePath(`nuevo_${timestamp}`);
        if (activeEditor === 'xfoods') newState.foods[id] = { config: { "display-name": "Nueva Comida", stats: { "food-level": 4, saturation: 2.0, bites: 1 }, item: { material: "PORKCHOP" } }, folder: "" };
        else if (activeEditor === 'xcrops') newState.crops[id] = { config: { "display-name": "Nuevo Cultivo", seed: { material: "WHEAT_SEEDS" }, growth: { stages: {} } }, folder: "" };
        else newState.machines[id] = { config: { "display-name": "Nueva Estación", recipes: {} }, folder: "" };
        setProjectState(newState);
        setSelectedItem(id);
    }
  };

  const handleCloneItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectState) return;
    const newState = { ...projectState };
    const currentMap = activeEditor === 'xfoods' ? newState.foods : (activeEditor === 'xcrops' ? newState.crops : newState.machines);
    const originalEntry = currentMap[id];
    if (!originalEntry) return;
    let finalId = sanitizePath(`${id}_copy`);
    let counter = 1;
    while (currentMap[finalId]) { finalId = sanitizePath(`${id}_copy_${counter++}`); }
    const copy = JSON.parse(JSON.stringify(originalEntry));
    if (activeEditor === 'xfoods') newState.foods[finalId] = copy;
    else if (activeEditor === 'xcrops') newState.crops[finalId] = copy;
    else newState.machines[finalId] = copy;
    setProjectState(newState);
    setSelectedItem(finalId);
  };

  const filteredItems = useMemo(() => {
    if (!projectState) return [];
    if (activeEditor === 'ia') {
        if (!selectedNamespace) return [];
        const result: [string, any][] = [];
        let targetMap: any;
        if (activeCategory === 'items') targetMap = projectState.iaItems;
        else if (activeCategory === 'blocks') targetMap = projectState.iaBlocks;
        else targetMap = projectState.iaFurnitures;
        Object.entries(targetMap).forEach(([fullKey, config]: [string, any]) => {
            if (fullKey.startsWith(`${selectedNamespace}/`)) {
                const subMap = config[activeCategory] || {};
                Object.entries(subMap).forEach(([id, data]) => {
                    if (!searchTerm || id.toLowerCase().includes(searchTerm.toLowerCase())) result.push([id, { fullKey, data }]);
                });
            }
        });
        return result;
    } else {
        const targetMap = activeEditor === 'xfoods' ? projectState.foods : (activeEditor === 'xcrops' ? projectState.crops : projectState.machines);
        return Object.entries(targetMap).filter(([id]) => !searchTerm || id.toLowerCase().includes(searchTerm.toLowerCase()));
    }
  }, [projectState, activeEditor, activeCategory, selectedNamespace, searchTerm]);

  const selectedData = useMemo(() => {
    if (!selectedItem || !projectState) return null;
    if (activeEditor === 'ia') return filteredItems.find(([id]) => id === selectedItem)?.[1];
    const targetMap = activeEditor === 'xfoods' ? projectState.foods : (activeEditor === 'xcrops' ? projectState.crops : projectState.machines);
    return targetMap[selectedItem];
  }, [selectedItem, filteredItems, activeEditor, projectState]);

  const groupedX = useMemo(() => {
    if (!projectState || activeEditor === 'ia') return {};
    const targetMap = activeEditor === 'xfoods' ? projectState.foods : (activeEditor === 'xcrops' ? projectState.crops : projectState.machines);
    const groups: Record<string, string[]> = {};
    Object.entries(targetMap).forEach(([id, data]) => {
        if (searchTerm && !id.toLowerCase().includes(searchTerm.toLowerCase())) return;
        const folder = data.folder || "Raíz";
        if (!groups[folder]) groups[folder] = [];
        groups[folder].push(id);
    });
    return groups;
  }, [projectState, activeEditor, searchTerm]);

  const handleIAFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let filesList: File[] = [];
    if ('dataTransfer' in e) {
      e.preventDefault();
      filesList = Array.from(e.dataTransfer.files);
    } else {
      filesList = Array.from((e.target as HTMLInputElement).files || []);
    }

    if (filesList.length === 0 || !projectState || !selectedItem || !selectedNamespace || !selectedData) return;
    
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
        const modelName = sanitizedFileName.replace(".json", "");
        try {
            const text = new TextDecoder().decode(buffer);
            const model = JSON.parse(text);
            if (model.textures) {
                Object.keys(model.textures).forEach(key => {
                    const texPath = model.textures[key] as string;
                    const fileName = sanitizePath(texPath.split('/').pop() || texPath).replace('.png', '');
                    // IMPORTANT: ItemsAdder paths in JSON should NOT include "textures/"
                    // Correct: namespace:furniture/file (points to assets/ns/textures/furniture/file.png)
                    if (!texPath.includes(':') || texPath.startsWith(`${ns}:`)) {
                        model.textures[key] = `${ns}:${subfolder}/${fileName}`;
                    }
                });
                buffer = new TextEncoder().encode(JSON.stringify(model, null, 2)).buffer;
            }
        } catch (err) { console.error("Error processing JSON model", err); }

        newState.rawFiles.push({
          name: sanitizedFileName,
          content: buffer,
          type: 'raw',
          inferredPath: `plugins/ItemsAdder/contents/${ns}/resource_pack/assets/${ns}/models/${subfolder}/${sanitizedFileName}`
        });

        const pathInConfig = `${activeCategory}.${selectedItem}.resource`;
        updateField(`${pathInConfig}.model_path`, `${ns}:${subfolder}/${modelName}`, selectedData.fullKey);
        updateField(`${pathInConfig}.generate`, false, selectedData.fullKey);
      }
    }
    setProjectState(newState);
    alert(`¡Archivos vinculados!`);
  };

  const isIAEnabled = selectedItem && projectState ? !!projectState.iaItems[`${projectState.projectName}/${selectedItem}`] : false;

  if (!mounted) return null;

  if (isAutoImporting) {
    return (
        <div className="h-screen flex flex-col items-center justify-center space-y-6 bg-[#0b0f19]">
            <div className="relative"><div className="w-24 h-24 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" /><Cloud className="absolute inset-0 m-auto w-8 h-8 text-yellow-400 animate-pulse" /></div>
            <h2 className="text-xl font-bold text-white tracking-widest uppercase">Sincronizando...</h2>
        </div>
    );
  }

  if (!projectState) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-12 animate-in fade-in zoom-in-95 duration-700">
        <div className="space-y-4">
          <div className="bg-yellow-400/10 p-6 rounded-full w-fit mx-auto border border-yellow-400/20"><Settings2 className="w-16 h-16 text-yellow-400" /></div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight italic uppercase">Studio Workspace</h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto italic uppercase text-xs font-black tracking-widest">IA • XFOODS • XCROPS</p>
        </div>
        <div className="grid grid-cols-2 gap-8">
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-[#374151] rounded-3xl p-16 hover:border-yellow-400/10 hover:bg-yellow-400/5 transition-all cursor-pointer group">
                <input type="file" ref={fileInputRef} onChange={handleFolderUpload} className="hidden" {...({ webkitdirectory: "", directory: "" } as any)} />
                <Upload className="w-12 h-12 text-gray-500 mx-auto mb-6 group-hover:text-yellow-400 transition-colors" />
                <p className="text-white font-bold text-xl uppercase tracking-tighter">Subir Carpeta</p>
            </div>
            <div onClick={() => setIsSyncModalOpen(true)} className="border-2 border-dashed border-blue-500/20 rounded-3xl p-16 hover:border-blue-500/10 hover:bg-blue-500/5 transition-all cursor-pointer group">
                <Cloud className="w-12 h-12 text-gray-500 mx-auto mb-6 group-hover:text-blue-400 transition-colors" />
                <p className="text-white font-bold text-xl uppercase tracking-tighter">xLib Bridge</p>
            </div>
        </div>
        <SyncModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} onSync={handleSyncToBridge} onImport={handleImportFromBridge} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="bg-[#111827] p-6 rounded-2xl border border-[#374151] flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-8">
            <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5">
                <button onClick={() => { setActiveEditor('xfoods'); setSelectedItem(null); }} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all", activeEditor === 'xfoods' ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-gray-500 hover:text-white")}><ChefHat className="w-3.5 h-3.5" /> xFoods</button>
                <button onClick={() => { setActiveEditor('ia'); setSelectedItem(null); }} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all", activeEditor === 'ia' ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/20" : "text-gray-500 hover:text-white")}><Settings2 className="w-3.5 h-3.5" /> ItemsAdder</button>
                <button onClick={() => { setActiveEditor('xcrops'); setSelectedItem(null); }} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all", activeEditor === 'xcrops' ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "text-gray-500 hover:text-white")}><Sprout className="w-3.5 h-3.5" /> xCrops</button>
                <button onClick={() => { setActiveEditor('xmachines'); setSelectedItem(null); }} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all", activeEditor === 'xmachines' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-gray-500 hover:text-white")}><Flame className="w-3.5 h-3.5" /> Estaciones</button>
            </div>
            {activeEditor === 'ia' && selectedNamespace && (
                <div className="flex flex-col border-l border-[#374151] pl-8">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 italic">Pack</label>
                    <select value={selectedNamespace} onChange={(e) => { setSelectedNamespace(e.target.value); setSelectedItem(null); }} className="bg-transparent text-lg font-bold text-yellow-400 outline-none cursor-pointer uppercase italic">
                        {availableNamespaces.map(ns => <option key={ns} value={ns} className="bg-[#111827] text-white">{ns}</option>)}
                    </select>
                </div>
            )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsSyncModalOpen(true)} className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-500/20 transition-all border border-blue-500/20"><Cloud className="w-4 h-4" /> Bridge</button>
          <button onClick={() => { setProjectState(null); setSelectedItem(null); }} className="px-6 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">Cerrar</button>
          <button onClick={() => exportEcosystem(projectState)} className="flex items-center gap-2 bg-accent text-white px-8 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-accent/20"><Download className="w-4 h-4" /> ZIP</button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
        <aside className="col-span-3 bg-[#111827] border border-[#374151] rounded-2xl flex flex-col overflow-hidden shadow-xl">
           {activeEditor === 'ia' && (
               <div className="p-4 border-b border-[#374151] flex gap-2 overflow-x-auto scrollbar-hide">
                  <button onClick={() => { setActiveCategory('items'); setSelectedItem(null); }} className={cn("px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all flex-shrink-0", activeCategory === 'items' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}>Ítems</button>
                  <button onClick={() => { setActiveCategory('blocks'); setSelectedItem(null); }} className={cn("px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all flex-shrink-0", activeCategory === 'blocks' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}>Bloques</button>
                  <button onClick={() => { setActiveCategory('furnitures'); setSelectedItem(null); }} className={cn("px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all flex-shrink-0", activeCategory === 'furnitures' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}>Muebles</button>
               </div>
           )}
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex gap-2">
                <div className="relative group flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors" />
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar..." className="w-full bg-white/2 border border-[#374151] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-yellow-400/30 transition-all" />
                </div>
                <button onClick={handleCreateNew} className="p-2.5 bg-accent text-white rounded-xl hover:opacity-90 transition-all shadow-lg shadow-accent/10"><Plus className="w-5 h-5" /></button>
              </div>
              <div className="space-y-1">
                {activeEditor === 'ia' ? (
                    filteredItems.map(([id, entry]) => (
                        <div key={id} onClick={() => setSelectedItem(id)} className={cn("px-4 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all border flex flex-col group", selectedItem === id ? "bg-yellow-400/10 border-yellow-400/50 text-white" : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5")}>
                            <span>{id}</span>
                            <span className="text-[8px] text-gray-600 truncate uppercase font-black tracking-widest">{entry.fullKey.split('/')[1]}.yml</span>
                        </div>
                    ))
                ) : (
                    Object.entries(groupedX).map(([folder, items]) => (
                        <div key={folder} className="space-y-1">
                            <button onClick={() => setOpenFolders(prev => ({ ...prev, [folder]: !prev[folder] }))} className="w-full flex items-center justify-between px-2 py-1 hover:bg-white/5 rounded-lg transition-colors group">
                                <div className="flex items-center gap-2">{openFolders[folder] ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}<span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-gray-300 tracking-widest">{folder}</span></div>
                            </button>
                            {(openFolders[folder] || folder === "Raíz") && (
                                <div className="space-y-0.5 ml-2 border-l border-white/5 pl-2">
                                    {items.map(id => (
                                        <div key={id} onClick={() => setSelectedItem(id)} className={cn("px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all border flex items-center justify-between group", selectedItem === id ? "bg-accent/10 border-accent/50 text-white" : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5")}>
                                            <span className="truncate">{id}</span>
                                            <button onClick={(e) => handleCloneItem(id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-md transition-all"><Copy className="w-3 h-3 text-gray-500" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
              </div>
           </div>
        </aside>

        {/* EDITOR */}
        <main className="col-span-6 bg-[#111827] border border-[#374151] rounded-2xl overflow-y-auto p-8 shadow-2xl custom-scrollbar">
           {selectedItem && selectedData ? (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-10 pb-20">
                <div className="flex justify-between items-start border-b border-[#374151] pb-8">
                   <div className="flex gap-6 items-center flex-1">
                      <VisualPreview 
                        mcPath={activeEditor === 'ia' ? (selectedData.data.resource?.model_path || selectedData.data.resource?.textures?.[0]) : (activeEditor === 'xfoods' ? selectedData.config.item?.material : selectedData.config.seed?.material)} 
                        rawFiles={projectState.rawFiles} 
                        namespace={activeEditor === 'ia' ? (selectedNamespace || projectState.projectName) : projectState.projectName}
                      />
                      <div className="space-y-1 flex-1">
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Identificador del Ítem</label>
                         <h3 className="text-3xl font-bold text-yellow-400 tracking-tighter uppercase italic">{selectedItem}</h3>
                      </div>
                   </div>
                   <div className="flex flex-col gap-2">
                        <button onClick={(e) => handleCloneItem(selectedItem, e)} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"><Copy className="w-3 h-3"/> Clonar</button>
                        <button className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20"><Trash2 className="w-3 h-3"/> Borrar</button>
                   </div>
                </div>

                <div className="space-y-8">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-yellow-400"><Info className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest">Ajustes Base</h4></div>
                        <div className={cn("grid gap-6", activeEditor === 'ia' || activeEditor === 'xmachines' ? "grid-cols-2" : "grid-cols-3")}>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Nombre Display</label>
                                <input type="text" value={(activeEditor === 'ia' ? selectedData.data.display_name : selectedData.config['display-name']) || ''} onChange={(e) => updateField(activeEditor === 'ia' ? `config.${activeCategory}.${selectedItem}.display_name` : 'config.display-name', e.target.value, activeEditor === 'ia' ? selectedData.fullKey : undefined)} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400" />
                            </div>
                            {activeEditor !== 'xmachines' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Material</label>
                                    <input type="text" value={(activeEditor === 'ia' ? selectedData.data.resource?.material : (activeEditor === 'xfoods' ? selectedData.config.item?.material : selectedData.config.seed?.material)) || ''} onChange={(e) => updateField(activeEditor === 'ia' ? `config.${activeCategory}.${selectedItem}.resource.material` : (activeEditor === 'xfoods' ? 'config.item.material' : 'config.seed.material'), e.target.value, activeEditor === 'ia' ? selectedData.fullKey : undefined)} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400" />
                                </div>
                            )}
                            {(activeEditor === 'xfoods' || activeEditor === 'xcrops') && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Custom Model Data</label>
                                    <input type="number" value={(activeEditor === 'xfoods' ? selectedData.config.item?.['custom-model-data'] : selectedData.config.seed?.['custom-model-data']) || 0} onChange={(e) => updateField(activeEditor === 'xfoods' ? 'config.item.custom-model-data' : 'config.seed.custom-model-data', parseInt(e.target.value))} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400" />
                                </div>
                            )}
                        </div>
                    </div>

                    {activeEditor === 'xfoods' && (
                        <>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151]"><label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Nivel Comida</label><input type="number" value={selectedData.config.stats?.['food-level'] || 0} onChange={(e) => updateField('config.stats.food-level', parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" /></div>
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151]"><label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Saturación</label><input type="number" step="0.1" value={selectedData.config.stats?.saturation || 0} onChange={(e) => updateField('config.stats.saturation', parseFloat(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" /></div>
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151]"><label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Mordiscos</label><input type="number" value={selectedData.config.stats?.bites || 1} onChange={(e) => updateField('config.stats.bites', parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" /></div>
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151]"><label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Ticks Consumo</label><input type="number" value={selectedData.config.stats?.['consumption-ticks'] || 30} onChange={(e) => updateField('config.stats.consumption-ticks', parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" /></div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">Lore</label>
                            <textarea rows={4} value={Array.isArray(selectedData.config.lore) ? selectedData.config.lore.join('\n') : ''} onChange={(e) => updateField('config.lore', e.target.value)} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none resize-none text-sm focus:border-yellow-400" />
                        </div>
                        <div className="space-y-6 pt-4 border-t border-[#374151]">
                            <div className="flex items-center gap-2 text-orange-400"><Clock className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest">Expiración</h4></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><label className="text-[10px] font-bold text-gray-600 uppercase">Minutos</label><input type="number" value={selectedData.config.stats?.['expiry-minutes'] || 0} onChange={(e) => updateField('config.stats.expiry-minutes', parseInt(e.target.value))} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none" /></div>
                                <div className="space-y-2"><label className="text-[10px] font-bold text-gray-600 uppercase">ID al Caducar</label><AutocompleteInput value={selectedData.config.stats?.['expired-id'] || ''} onChange={(val) => updateField('config.stats.expired-id', val)} options={Object.keys(projectState.foods)} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none" /></div>
                            </div>
                        </div>
                        <div className="space-y-6 pt-4 border-t border-[#374151]">
                            <div className="flex items-center gap-2 text-red-400"><Binary className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest">Integración RPXHealth</h4></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><label className="text-[10px] font-bold text-gray-600 uppercase">ID Enfermedad</label><input type="text" value={selectedData.config.integration?.['disease-id'] || ''} onChange={(e) => updateField('config.integration.disease-id', e.target.value)} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none" /></div>
                                <div className="space-y-2"><label className="text-[10px] font-bold text-gray-600 uppercase">Probabilidad</label><input type="number" step="0.01" value={selectedData.config.integration?.['disease-chance'] || 0} onChange={(e) => updateField('config.integration.disease-chance', parseFloat(e.target.value))} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none" /></div>
                            </div>
                        </div>
                        <div className="space-y-6 pt-4 border-t border-[#374151]">
                             <div className="flex justify-between items-center"><h4 className="text-xs font-black text-green-400 uppercase tracking-widest">Comandos</h4><button onClick={() => { const newState = {...projectState}; const food = newState.foods[selectedItem as string].config; if(!food.commands) food.commands = []; (food.commands as any).push(""); setProjectState(newState); }} className="text-[10px] font-bold text-green-400">+ AÑADIR</button></div>
                             <div className="space-y-2">{(Array.isArray(selectedData.config.commands) ? selectedData.config.commands : []).map((cmd: string, idx: number) => (<div key={idx} className="flex gap-2"><input type="text" value={cmd} onChange={(e) => { const newState = {...projectState}; (newState.foods[selectedItem as string].config.commands as any)[idx] = e.target.value; setProjectState(newState); }} className="flex-1 bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-white outline-none" /><button onClick={() => { const newState = {...projectState}; (newState.foods[selectedItem as string].config.commands as any).splice(idx, 1); setProjectState(newState); }} className="text-gray-600 hover:text-red-500"><Trash2 className="w-4 h-4"/></button></div>))}</div>
                        </div>
                        </>
                    )}

                    {activeEditor === 'xcrops' && (
                         <div className="space-y-8">
                             <div className="flex justify-between items-center border-b border-[#374151] pb-4"><div className="flex items-center gap-2 text-green-400"><FolderSearch className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest">Etapas</h4></div><button onClick={() => { const newState = {...projectState}; const crop = newState.crops[selectedItem as string].config; if(!(crop as any).growth) (crop as any).growth = { stages: {} }; if(!(crop as any).growth.stages) (crop as any).growth.stages = {}; const sid = `stage${Object.keys((crop as any).growth.stages).length}`; (crop as any).growth.stages[sid] = { material: "FERN", scale: 1.0, duration: 60000 }; setProjectState(newState); }} className="text-[10px] font-black uppercase bg-green-500/10 text-green-500 px-3 py-1.5 rounded-lg border border-green-500/20">+ Nueva Etapa</button></div>
                             <div className="grid gap-6">{Object.entries((selectedData.config.growth?.stages as Record<string, any>) || {}).map(([sid, sData]) => (<div key={sid} className="bg-[#0b0f19] rounded-2xl border border-[#374151] overflow-hidden"><div className="bg-white/5 px-6 py-2 flex justify-between items-center border-b border-white/5"><span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">{sid}</span><button onClick={() => { const newState = {...projectState}; delete (newState.crops[selectedItem as string].config.growth as any).stages[sid]; setProjectState(newState); }} className="text-gray-600 hover:text-red-500"><Trash2 className="w-4 h-4"/></button></div><div className="p-6 grid grid-cols-3 gap-4"><div className="space-y-1"><label className="text-[8px] font-bold text-gray-600 uppercase">Material</label><input type="text" value={sData.material || ''} onChange={(e) => updateField(`config.growth.stages.${sid}.material`, e.target.value)} className="w-full bg-black/20 border border-white/5 rounded px-2 py-1 text-xs text-white outline-none" /></div><div className="space-y-1"><label className="text-[8px] font-bold text-gray-600 uppercase">Escala</label><input type="number" step="0.1" value={sData.scale || 1.0} onChange={(e) => updateField(`config.growth.stages.${sid}.scale`, parseFloat(e.target.value))} className="w-full bg-black/20 border border-white/5 rounded px-2 py-1 text-xs text-white outline-none" /></div><div className="space-y-1"><label className="text-[8px] font-bold text-gray-600 uppercase">Duración</label><input type="number" value={sData.duration || 60000} onChange={(e) => updateField(`config.growth.stages.${sid}.duration`, parseInt(e.target.value))} className="w-full bg-black/20 border border-white/5 rounded px-2 py-1 text-xs text-white outline-none" /></div></div></div>))}</div>
                         </div>
                    )}

                    {activeEditor === 'ia' && (
                        <div className="space-y-8">
                            <div className="bg-[#0b0f19] p-8 rounded-3xl border border-white/5 space-y-6">
                                <div className="flex justify-between items-center"><h4 className="text-xs font-black uppercase text-gray-400 tracking-widest italic">Recursos</h4><button onClick={() => iaFileInputRef.current?.click()} className="bg-yellow-400/10 text-yellow-400 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border border-yellow-400/20">Inyectar</button><input type="file" ref={iaFileInputRef} onChange={handleIAFileUpload} className="hidden" accept=".png,.json" multiple /></div>
                                <div className="space-y-4">
                                    <div className="space-y-2"><label className="text-[10px] font-bold text-gray-600 uppercase">Ruta Modelo</label><input type="text" value={selectedData.data.resource?.model_path || ''} onChange={(e) => updateField(`config.${activeCategory}.${selectedItem}.resource.model_path`, e.target.value, selectedData.fullKey)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none text-xs" /></div>
                                    <label className="flex items-center gap-3 cursor-pointer"><div className="relative"><input type="checkbox" checked={selectedData.data.resource?.generate || false} onChange={(e) => updateField(`config.${activeCategory}.${selectedItem}.resource.generate`, e.target.checked, selectedData.fullKey)} className="sr-only" /><div className={cn("w-8 h-4 rounded-full transition-colors", selectedData.data.resource?.generate ? "bg-green-500" : "bg-gray-700")}></div><div className={cn("absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform", selectedData.data.resource?.generate ? "translate-x-4" : "")}></div></div><span className="text-[10px] font-black text-gray-500 uppercase">Auto-Gen 2D</span></label>
                                </div>
                            </div>
                            {activeCategory === 'furnitures' && (
                                <div className="bg-[#0b0f19] p-8 rounded-3xl border border-white/5 space-y-6"><h4 className="text-xs font-black uppercase text-blue-400 tracking-widest italic">Hitbox</h4><div className="grid grid-cols-3 gap-3">{['length', 'width', 'height'].map(dim => (<div key={dim} className="bg-black/20 p-2 rounded-lg border border-white/5"><label className="text-[8px] font-bold text-gray-500 uppercase block mb-1">{dim}</label><input type="number" step="0.1" value={selectedData.data.specific_properties?.furniture?.hitbox?.[dim] || 1} onChange={(e) => updateField(`config.${activeCategory}.${selectedItem}.specific_properties.furniture.hitbox.${dim}`, parseFloat(e.target.value), selectedData.fullKey)} className="w-full bg-transparent text-white font-bold outline-none text-xs" /></div>))}</div></div>
                            )}
                        </div>
                    )}
                </div>

                {(activeEditor === 'xfoods' || activeEditor === 'xcrops') && (
                <div className={cn("p-8 rounded-3xl border transition-all", isIAEnabled ? "bg-yellow-400/5 border-yellow-400/20" : "bg-white/2 border-white/5")}><div className="flex justify-between items-center"><div className="flex items-center gap-3"><Settings2 className={cn("w-6 h-6", isIAEnabled ? "text-yellow-400" : "text-gray-600")} /><div><h4 className="text-md font-black text-white uppercase tracking-tighter italic">ItemsAdder</h4><p className="text-[11px] text-gray-500 uppercase font-black tracking-widest">Modelos 3D y texturas</p></div></div><label className="switch"><input type="checkbox" checked={isIAEnabled} onChange={(e) => updateField('ia-toggle', e.target.checked)} /><span className="slider"></span></label></div></div>
                )}
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30 grayscale scale-95 transition-all py-20"><div className="bg-white/5 p-10 rounded-full border border-white/5 animate-pulse"><Package className="w-20 h-20 text-gray-700" /></div><div className="space-y-2"><h3 className="text-2xl font-black text-gray-400 uppercase tracking-widest italic">Selecciona un elemento</h3><p className="text-sm text-gray-600 uppercase font-black tracking-tighter">Explora las categorías para iniciar la edición profesional.</p></div></div>
           )}
        </main>

        <section className="col-span-3 bg-black border border-[#374151] rounded-2xl overflow-hidden flex flex-col shadow-2xl lg:sticky lg:top-0 h-fit max-h-[90vh]">
           <div className="bg-[#111827] px-4 py-3 border-b border-[#374151] flex items-center justify-between"><div className="flex items-center gap-2"><Binary className="w-4 h-4 text-accent" /><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Live Code</span></div><div className="flex gap-2"><button onClick={() => setActivePreview('plugin')} className={cn("text-[9px] font-black px-2 py-0.5 rounded border transition-all", activePreview === 'plugin' ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" : "text-gray-600 border-transparent")}>PLUGIN</button><button disabled={!isIAEnabled && activeEditor !== 'ia'} onClick={() => setActivePreview('ia')} className={cn("text-[9px] font-black px-2 py-0.5 rounded border transition-all disabled:opacity-0", activePreview === 'ia' ? "text-blue-400 bg-blue-400/10 border-blue-400/20" : "text-gray-600 border-transparent")}>IA</button></div></div>
           <div className="flex-1 p-6 overflow-auto font-mono text-[12px] text-blue-200 leading-relaxed scrollbar-hide"><pre className="whitespace-pre-wrap break-words">{selectedItem && selectedData ? (activePreview === 'plugin' ? stringifyYaml(activeEditor === 'ia' ? selectedData.data : selectedData.config) : (activeEditor === 'ia' ? "# Modo IA Activo" : (projectState.iaItems[`${projectState.projectName}/${selectedItem}`] ? stringifyYaml(projectState.iaItems[`${projectState.projectName}/${selectedItem}`]) : "# No hay config de IA"))) : "# Selecciona un ítem..."}</pre></div>
           <div className="p-4 bg-[#111827] border-t border-[#374151]"><button onClick={() => { if (selectedItem && selectedData) { const yaml = activePreview === 'plugin' ? stringifyYaml(activeEditor === 'ia' ? selectedData.data : selectedData.config) : stringifyYaml(projectState.iaItems[`${projectState.projectName}/${selectedItem}`]); navigator.clipboard.writeText(yaml || ""); alert("Copiado"); } }} className="w-full bg-[#1f2937] hover:bg-[#374151] text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-[#374151]">Copiar Código</button></div>
        </section>
      </div>

      <SyncModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} onSync={handleSyncToBridge} onImport={handleImportFromBridge} />
    </div>
  );
}
