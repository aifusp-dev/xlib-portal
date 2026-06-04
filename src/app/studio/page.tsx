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
  Cloud
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateZIP, parseUploadedFiles, EcosystemState, stringifyYaml, sanitizePath, StudioFile } from "@/lib/studio";
import { exportEcosystem } from "@/lib/export";
import SyncModal from "@/components/SyncModal";
import { Model3DViewer } from "@/components/Model3DViewer";

interface IAItemConfig {
  resource?: {
    generate?: boolean;
    model_path?: string;
    textures?: string[];
  };
}

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

export default function StudioPage() {
  const [projectState, setProjectState] = useState<EcosystemState | null>(null);
  const [activeView, setActiveView] = useState<'xfoods' | 'xcrops' | 'xmachines'>("xfoods");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [activePreview, setActivePreview] = useState<'plugin' | 'ia'>('plugin');
  const [searchTerm, setSearchTerm] = useState("");
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isAutoImporting, setIsAutoImporting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const iaFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Auto-import from URL
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

  const handleCreateNew = () => {
    if (!projectState) return;
    const timestamp = Date.now();
    let newId = "";
    const newState = { ...projectState };

    if (activeView === 'xfoods') {
      newId = sanitizePath(`nueva_comida_${timestamp}`);
      newState.foods[newId] = {
        config: {
            "display-name": "&eNueva Comida",
            "lore": ["&7Descripción de la comida."],
            "item": { "material": "PORKCHOP", "custom-model-data": 0, "max-stack": 64 },
            "stats": { "food-level": 4, "saturation": 2.0, "bites": 1, "consumable": true, "expiry-minutes": 0, "consumption-ticks": 30 },
            "nutrition": { "proteins": 0, "carbs": 0, "sugars": 0, "vitamins": 0 },
            "integration": { "disease-id": "", "disease-chance": 0.0 },
            "leftovers": { "material": "AIR", "custom-model-data": 0 },
            "effects": { "sound": "ENTITY_GENERIC_EAT", "particle": "VILLAGER_HAPPY" }
        },
        folder: ""
      };
    } else if (activeView === 'xcrops') {
      newId = sanitizePath(`nuevo_cultivo_${timestamp}`);
      newState.crops[newId] = {
        config: {
            "display-name": "Nuevo Cultivo",
            "seed": { "material": "WHEAT_SEEDS", "display-name": "&aSemilla de Cultivo", "lore": ["&7Plántame en un macetero."], "custom-model-data": 0 },
            "growth": { 
                "wither-time": 2400000, 
                "stages": { 
                    "stage0": { "material": "FERN", "scale": 1.0, "y-offset": 0.0, "duration": 60000 },
                    "stage1": { "material": "LARGE_FERN", "scale": 1.0, "y-offset": 0.0, "duration": 120000 }
                } 
            },
            "harvest": { "xfoods-id": "apple", "amount": 1, "message": "&a¡Has cosechado con éxito!" },
            "visuals": { "hologram-title": "&fCultivo en Progreso" },
            "requirements": { "seed-nbt": newId }
        },
        folder: ""
      };
    } else {
      newId = sanitizePath(`nueva_maquina_${timestamp}`);
      newState.machines[newId] = {
        config: {
            "display-name": "&6Nueva Estación de Cocina",
            "recipes": {
                "receta_1": {
                    "inputs": { "i1": { "id": "PORKCHOP", "amount": 1 } },
                    "output": { "id": "COOKED_PORKCHOP", "amount": 1 },
                    "time": 200,
                    "burn-time": 100,
                    "burnt-id": "COAL",
                    "use-minigame": false,
                    "sounds": { "start": "BLOCK_CAMPFIRE_CRACKLE", "finish": "ENTITY_PLAYER_LEVELUP" }
                }
            }
        },
        folder: ""
      };
    }
    
    setProjectState(newState);
    setSelectedItem(newId);
  };

  const handleCloneItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectState) return;
    
    const newState = { ...projectState };
    const currentMap = activeView === 'xfoods' ? newState.foods : 
                     (activeView === 'xcrops' ? newState.crops : newState.machines);
    
    const originalEntry = currentMap[id];
    if (!originalEntry) return;

    let finalId = sanitizePath(`${id}_copy`);
    let counter = 1;
    while (currentMap[finalId]) {
        finalId = sanitizePath(`${id}_copy_${counter++}`);
    }

    const newEntry = JSON.parse(JSON.stringify(originalEntry));
    
    if (activeView === 'xfoods') newState.foods[finalId] = newEntry;
    else if (activeView === 'xcrops') newState.crops[finalId] = newEntry;
    else newState.machines[finalId] = newEntry;

    setProjectState(newState);
    setSelectedItem(finalId);
  };

  const renameSelectedItem = (newId: string) => {
    if (!projectState || !selectedItem || !newId || newId === selectedItem) return;
    const sanitizedId = sanitizePath(newId);
    if (sanitizedId === selectedItem) return;

    const newState = { ...projectState };
    let targetMap: Record<string, { config: Record<string, unknown>, folder?: string }>;
    if (activeView === 'xfoods') targetMap = newState.foods;
    else if (activeView === 'xcrops') targetMap = newState.crops;
    else targetMap = newState.machines;
    
    if (targetMap[sanitizedId]) return;

    targetMap[sanitizedId] = { ...targetMap[selectedItem] };
    delete targetMap[selectedItem];

    // Rename in IA items if exists
    const iaKey = `${newState.projectName}/${selectedItem}`;
    const newIaKey = `${newState.projectName}/${sanitizedId}`;
    if (newState.iaItems[iaKey]) {
        newState.iaItems[newIaKey] = newState.iaItems[iaKey];
        delete newState.iaItems[iaKey];
        
        const iaConfig = newState.iaItems[newIaKey];
        if (iaConfig.items && (iaConfig.items as Record<string, unknown>)[selectedItem]) {
            (iaConfig.items as Record<string, unknown>)[sanitizedId] = (iaConfig.items as Record<string, unknown>)[selectedItem];
            delete (iaConfig.items as Record<string, unknown>)[selectedItem];
            
            const itemData = (iaConfig.items as Record<string, any>)[sanitizedId];
            if (itemData.permission) itemData.permission = itemData.permission.replace(selectedItem, sanitizedId);
            if (itemData.resource && itemData.resource.textures) {
                itemData.resource.textures = itemData.resource.textures.map((t: string) => t.replace(selectedItem, sanitizedId));
            }
        }
    }
    
    setSelectedItem(sanitizedId);
    setProjectState(newState);
  };

  const updateItemField = (path: string, value: unknown) => {
    if (!projectState || !selectedItem) return;
    const newState = { ...projectState };
    const entry = activeView === 'xfoods' ? newState.foods[selectedItem] : (activeView === 'xcrops' ? newState.crops[selectedItem] : newState.machines[selectedItem]);
    
    if (path === 'folder') {
        entry.folder = value as string;
        setProjectState(newState);
        return;
    }

    if (path === 'ia-toggle') {
        const item = entry.config;
        if (value) {
            if (!item.item && activeView === 'xfoods') item.item = {};
            if (!item.seed && activeView === 'xcrops') item.seed = {};
            
            const target = activeView === 'xfoods' ? item.item : item.seed;
            const subfolder = activeView === 'xfoods' ? 'food' : 'crops';
            (target as Record<string, unknown>)['itemsadder-id'] = `${newState.projectName}:${selectedItem}`;
            const currentCMD = (target as Record<string, unknown>)['custom-model-data'] as number || 0;
            
            const iaItems: Record<string, unknown> = {
                [selectedItem]: {
                    display_name: item['display-name'] || "Nuevo Ítem",
                    permission: `${newState.projectName.toLowerCase()}.${selectedItem}`,
                    resource: { 
                        material: (target as Record<string, string>)?.material || "PAPER",
                        generate: true, 
                        textures: [`${newState.projectName}:item/${subfolder}/${selectedItem}`] 
                    },
                    ...(currentCMD > 0 ? { specific_properties: { custom_model_data: currentCMD } } : {})
                }
            };

            const fullKey = `${newState.projectName}/${selectedItem}`;
            newState.iaItems[fullKey] = { 
                info: { namespace: newState.projectName },
                items: iaItems 
            };
        } else {
            if (activeView === 'xfoods' && item.item) delete (item.item as Record<string, unknown>)['itemsadder-id'];
            if (activeView === 'xcrops' && item.seed) delete (item.seed as Record<string, unknown>)['itemsadder-id'];
            delete newState.iaItems[`${newState.projectName}/${selectedItem}`];
        }
        setProjectState(newState);
        return;
    }

    const keys = path.split('.');
    let current: Record<string, unknown> = entry as unknown as Record<string, unknown>;
    
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key]) current[key] = {};
        current = current[key] as Record<string, unknown>;
    }
    
    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;

    const iaKey = `${newState.projectName}/${selectedItem}`;
    if (newState.iaItems[iaKey] && (path.includes('itemsadder-id') || path.includes('display-name') || path.includes('material'))) {
        const item = entry.config;
        const subfolder = activeView === 'xfoods' ? 'food' : 'crops';
        const target = activeView === 'xfoods' ? item.item : item.seed;
        const iaItems: Record<string, unknown> = {
            [selectedItem]: {
                display_name: item['display-name'] || "Nuevo Ítem",
                permission: `${newState.projectName.toLowerCase()}.${selectedItem}`,
                resource: { 
                    material: (target as Record<string, string>)?.material || "PAPER",
                    generate: true, 
                    textures: [`${newState.projectName}:item/${subfolder}/${selectedItem}`] 
                }
            }
        };

        newState.iaItems[iaKey] = {
            info: { namespace: newState.projectName },
            items: iaItems
        };
    }

    if (path.endsWith('.lore') && typeof value === 'string') {
        current[lastKey] = value.split('\n');
    }

    setProjectState(newState);
  };

  const handleIAFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let filesList: File[] = [];
    if ('dataTransfer' in e) {
      e.preventDefault();
      filesList = Array.from(e.dataTransfer.files);
    } else {
      filesList = Array.from((e.target as HTMLInputElement).files || []);
    }

    if (filesList.length === 0 || !projectState || !selectedItem) return;
    
    const newState = { ...projectState };
    const ns = sanitizePath(projectState.projectName);
    const itemEntry = activeView === 'xfoods' ? newState.foods[selectedItem] : newState.crops[selectedItem];
    const subfolder = sanitizePath(itemEntry?.folder || (activeView === 'xfoods' ? 'food' : 'crops'));
    
    let hasModel = false;
    let modelName = "";

    for (const file of filesList) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'png' && ext !== 'json') continue;

      let buffer = await file.arrayBuffer();
      const isJson = ext === 'json';
      const sanitizedFileName = sanitizePath(file.name);

      if (isJson) {
        hasModel = true;
        modelName = sanitizedFileName.replace(".json", "");
        
        try {
            const text = new TextDecoder().decode(buffer);
            const model = JSON.parse(text);
            if (model.textures) {
                Object.keys(model.textures).forEach(key => {
                    const texPath = model.textures[key] as string;
                    if (!texPath.includes(':') || texPath.startsWith(`${ns}:`)) {
                        const cleanName = sanitizePath(texPath.split('/').pop() || texPath);
                        model.textures[key] = `${ns}:item/${subfolder}/${cleanName}`;
                    } else {
                        model.textures[key] = sanitizePath(texPath);
                    }
                });
                const updatedJson = JSON.stringify(model, null, 2);
                buffer = new TextEncoder().encode(updatedJson).buffer;
            }
        } catch (err) {
            console.error("Error processing JSON model", err);
        }
      }

      const assetType = isJson ? 'models' : 'textures';
      const inferredPath = `resource_pack/assets/${ns}/${assetType}/item/${subfolder}/${sanitizedFileName}`;

      newState.rawFiles.push({
        name: sanitizedFileName,
        content: buffer,
        type: 'raw',
        inferredPath: `plugins/ItemsAdder/contents/${ns}/${inferredPath}`
      });
    }

    const iaKey = `${ns}/${selectedItem}`;
    if (newState.iaItems[iaKey]) {
      const iaItem = (newState.iaItems[iaKey].items as Record<string, IAItemConfig>)[selectedItem];
      const currentResource = iaItem.resource || {};
      const alreadyHasModel = !!currentResource.model_path;

      if (hasModel) {
        iaItem.resource = { 
          generate: false, 
          model_path: `${ns}:item/${subfolder}/${modelName}` 
        };
      } else if (!alreadyHasModel) {
        const firstPng = filesList.find(f => f.name.endsWith('.png'));
        if (firstPng) {
          const texName = sanitizePath(firstPng.name.replace(".png", ""));
          iaItem.resource = { 
            generate: true, 
            textures: [`${ns}:item/${subfolder}/${texName}`] 
          };
        }
      }
    }

    setProjectState(newState);
    alert(`¡Archivos vinculados con éxito!`);
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
             <FolderSearch className="w-16 h-16 text-yellow-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Studio Pro Engine</h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">Sube tu carpeta de proyecto o importa desde el servidor.</p>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-[#374151] rounded-3xl p-16 hover:border-yellow-400/5 hover:bg-yellow-400/5 transition-all cursor-pointer group">
                <input type="file" ref={fileInputRef} onChange={handleFolderUpload} className="hidden" {...({ webkitdirectory: "", directory: "" } as any)} />
                <div className="space-y-6">
                    <div className="bg-white/5 p-5 rounded-2xl w-fit mx-auto group-hover:scale-110 transition-transform duration-300">
                        <Upload className="w-10 h-10 text-gray-400 group-hover:text-yellow-400" />
                    </div>
                    <p className="text-white font-bold text-xl">Seleccionar Carpeta</p>
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

  const currentMap = activeView === 'xfoods' ? projectState.foods : (activeView === 'xcrops' ? projectState.crops : projectState.machines);
  const groupedItems: Record<string, string[]> = {};
  Object.entries(currentMap).forEach(([id, data]) => {
    if (searchTerm && !id.toLowerCase().includes(searchTerm.toLowerCase())) return;
    const folder = data.folder || "Raíz";
    if (!groupedItems[folder]) groupedItems[folder] = [];
    groupedItems[folder].push(id);
  });

  const currentItem = selectedItem ? currentMap[selectedItem] : null;
  const isIAEnabled = currentItem ? !!projectState.iaItems[`${projectState.projectName}/${selectedItem}`] : false;

  return (
    <div className="h-full flex flex-col space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center bg-[#111827] p-6 rounded-2xl border border-[#374151]">
        <div className="flex items-center gap-6">
          <div className="bg-yellow-400 p-2 rounded-lg text-black font-black text-xs">PRO</div>
          <h2 className="text-xl font-bold text-white tracking-tight">Proyecto: <span className="text-yellow-400">{projectState.projectName}</span></h2>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsSyncModalOpen(true)} className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-500/20 transition-all border border-blue-500/20 group">
            <Cloud className="w-4 h-4 group-hover:animate-bounce" /> xLib Bridge
          </button>
          <button onClick={() => { setProjectState(null); setSelectedItem(null); }} className="px-6 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-colors">Cerrar</button>
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
              <button onClick={() => { setActiveView('xfoods'); setSelectedItem(null); }} className={cn("px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all flex-shrink-0", activeView === 'xfoods' ? "bg-accent text-white" : "text-gray-500 hover:text-gray-300")}>Comidas</button>
              <button onClick={() => { setActiveView('xmachines'); setSelectedItem(null); }} className={cn("px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all flex-shrink-0", activeView === 'xmachines' ? "bg-accent text-white" : "text-gray-500 hover:text-gray-300")}>Máquinas</button>
              <button onClick={() => { setActiveView('xcrops'); setSelectedItem(null); }} className={cn("px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all flex-shrink-0", activeView === 'xcrops' ? "bg-accent text-white" : "text-gray-500 hover:text-gray-300")}>Cultivos</button>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors" />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar ID..." 
                    className="w-full bg-white/2 border border-[#374151] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-yellow-400/30 focus:bg-yellow-400/5 transition-all"
                />
              </div>
              
              <div className="space-y-4">
                 <button onClick={handleCreateNew} className="w-full bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                    <Plus className="w-3 h-3" /> Crear Nuevo
                 </button>

                 {Object.entries(groupedItems).map(([folder, items]) => (
                    <div key={folder} className="space-y-1">
                        <button 
                            onClick={() => setOpenFolders(prev => ({ ...prev, [folder]: !prev[folder] }))}
                            className="w-full flex items-center justify-between px-2 py-1 hover:bg-white/5 rounded-lg transition-colors group"
                        >
                            <div className="flex items-center gap-2">
                                {openFolders[folder] ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
                                <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-gray-300 transition-colors tracking-widest">{folder}</span>
                            </div>
                            <span className="text-[9px] font-bold text-gray-700 bg-white/5 px-1.5 py-0.5 rounded-md">{items.length}</span>
                        </button>
                        
                        {(openFolders[folder] || folder === "Raíz") && (
                            <div className="space-y-0.5 ml-2 border-l border-white/5 pl-2 animate-in slide-in-from-left-1 duration-200">
                                {items.map(id => (
                                    <div 
                                        key={id} 
                                        onClick={() => setSelectedItem(id)} 
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all border flex items-center justify-between group", 
                                            selectedItem === id ? "bg-accent/10 border-accent/50 text-white" : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5"
                                        )}
                                    >
                                        <span className="truncate">{id}</span>
                                        <button onClick={(e) => handleCloneItem(id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-md transition-all"><Copy className="w-3 h-3 text-gray-500" /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                 ))}
              </div>
           </div>
        </aside>

        <main className="col-span-6 bg-[#111827] border border-[#374151] rounded-2xl overflow-y-auto p-8 shadow-2xl space-y-8 custom-scrollbar">
           {selectedItem && currentItem ? (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-8 pb-20">
                <div className="flex justify-between items-start border-b border-[#374151] pb-6">
                   <div className="flex gap-6 items-center flex-1">
                      <VisualPreview 
                        mcPath={activeView === 'xfoods' ? (currentItem.config.item as Record<string, string>)?.material : (activeView === 'xcrops' ? (currentItem.config.seed as Record<string, string>)?.material : null)} 
                        rawFiles={projectState.rawFiles}
                        namespace={projectState.projectName}
                      />
                      <div className="space-y-1 flex-1">
                         <div className="flex items-center gap-2">
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Identificador del Ítem</label>
                         </div>
                         <div className="flex gap-2 items-center">
                            <input 
                                type="text" 
                                defaultValue={selectedItem} 
                                onBlur={(e) => renameSelectedItem(e.target.value)}
                                className="text-2xl font-bold bg-transparent text-yellow-400 border-none outline-none focus:ring-0 w-full hover:bg-white/5 rounded px-1 transition-colors" 
                            />
                         </div>
                      </div>
                   </div>
                   <div className="flex flex-col gap-2">
                      <button onClick={(e) => handleCloneItem(selectedItem, e)} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"><Copy className="w-3 h-3"/> Clonar</button>
                      <button onClick={() => { if(confirm("¿Borrar?")) { const newState = {...projectState}; if(activeView === 'xfoods') delete newState.foods[selectedItem]; else if(activeView === 'xcrops') delete newState.crops[selectedItem]; else delete newState.machines[selectedItem]; setProjectState(newState); setSelectedItem(null); }}} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20"><Trash2 className="w-3 h-3"/> Eliminar</button>
                   </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-yellow-400"><Info className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest">Ajustes Base</h4></div>
                    <div className={cn("grid gap-6", activeView !== 'xmachines' ? "grid-cols-3" : "grid-cols-2")}>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Nombre Display</label>
                            <input type="text" value={(currentItem.config['display-name'] as string) || ''} onChange={(e) => updateItemField('config.display-name', e.target.value)} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none" />
                        </div>
                        {activeView !== 'xmachines' && (
                            <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Material</label>
                                <input type="text" value={(activeView === 'xfoods' ? (currentItem.config.item as Record<string, string>)?.material : (currentItem.config.seed as Record<string, string>)?.material) || ''} onChange={(e) => updateItemField(activeView === 'xfoods' ? 'config.item.material' : 'config.seed.material', e.target.value)} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Custom Model Data</label>
                                <input type="number" value={(activeView === 'xfoods' ? (currentItem.config.item as Record<string, number>)?.['custom-model-data'] : (currentItem.config.seed as Record<string, number>)?.['custom-model-data']) || 0} onChange={(e) => updateItemField(activeView === 'xfoods' ? 'config.item.custom-model-data' : 'config.seed.custom-model-data', e.target.value)} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none" />
                            </div>
                            {activeView === 'xfoods' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Stack Máximo</label>
                                    <input type="number" value={(currentItem.config.item as Record<string, number>)?.['max-stack'] || 64} onChange={(e) => updateItemField('config.item.max-stack', parseInt(e.target.value))} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none" />
                                </div>
                            )}
                            </>
                        )}
                    </div>
                    {activeView === 'xfoods' && (
                        <>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151]"><label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Nivel Comida</label><input type="number" value={(currentItem.config.stats as Record<string, number>)?.['food-level'] || 0} onChange={(e) => updateItemField('config.stats.food-level', parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" /></div>
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151]"><label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Saturación</label><input type="number" step="0.1" value={(currentItem.config.stats as Record<string, number>)?.saturation || 0} onChange={(e) => updateItemField('config.stats.saturation', parseFloat(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" /></div>
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151]"><label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Mordiscos</label><input type="number" value={(currentItem.config.stats as Record<string, number>)?.bites || 1} onChange={(e) => updateItemField('config.stats.bites', parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" /></div>
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151]"><label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Ticks Consumo</label><input type="number" value={(currentItem.config.stats as Record<string, number>)?.['consumption-ticks'] || 30} onChange={(e) => updateItemField('config.stats.consumption-ticks', parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" /></div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Lore</label>
                            <textarea rows={3} value={Array.isArray(currentItem.config.lore) ? (currentItem.config.lore as string[]).join('\n') : ''} onChange={(e) => updateItemField('config.lore', e.target.value)} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none resize-none text-sm" />
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151]"><label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Proteínas</label><input type="number" value={(currentItem.config.nutrition as Record<string, number>)?.proteins || 0} onChange={(e) => updateItemField('config.nutrition.proteins', parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" /></div>
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151]"><label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Carbos</label><input type="number" value={(currentItem.config.nutrition as Record<string, number>)?.carbs || 0} onChange={(e) => updateItemField('config.nutrition.carbs', parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" /></div>
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151]"><label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Azúcares</label><input type="number" value={(currentItem.config.nutrition as Record<string, number>)?.sugars || 0} onChange={(e) => updateItemField('config.nutrition.sugars', parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" /></div>
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151]"><label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Vitaminas</label><input type="number" value={(currentItem.config.nutrition as Record<string, number>)?.vitamins || 0} onChange={(e) => updateItemField('config.nutrition.vitamins', parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" /></div>
                        </div>

                        <div className="space-y-6 pt-4 border-t border-[#374151]">
                            <div className="flex items-center gap-2 text-purple-400"><Zap className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest">Efectos y Sonidos</h4></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Sonido al Comer</label>
                                    <input type="text" value={(currentItem.config.effects as Record<string, string>)?.sound || 'ENTITY_GENERIC_EAT'} onChange={(e) => updateItemField('config.effects.sound', e.target.value)} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none" placeholder="ENTITY_GENERIC_EAT" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Partícula</label>
                                    <input type="text" value={(currentItem.config.effects as Record<string, string>)?.particle || 'VILLAGER_HAPPY'} onChange={(e) => updateItemField('config.effects.particle', e.target.value)} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none" placeholder="VILLAGER_HAPPY" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 pt-4 border-t border-[#374151]">
                            <div className="flex items-center gap-2 text-orange-400"><Clock className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest">Expiración y Caducidad</h4></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Tiempo Expiración (min)</label>
                                    <input type="number" value={(currentItem.config.stats as Record<string, number>)?.['expiry-minutes'] || 0} onChange={(e) => updateItemField('config.stats.expiry-minutes', parseInt(e.target.value))} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none" placeholder="0 = nunca" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">ID al Caducar (xFoods)</label>
                                    <AutocompleteInput 
                                        value={(currentItem.config.stats as Record<string, string>)?.['expired-id'] || ''} 
                                        onChange={(val) => updateItemField('config.stats.expired-id', val)}
                                        options={Object.keys(projectState.foods)}
                                        placeholder="ej: bigmac_podrida"
                                        className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 pt-4 border-t border-[#374151]">
                            <div className="flex items-center gap-2 text-red-400"><Binary className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest">Integración RPXHealth (Enfermedades)</h4></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">ID Enfermedad</label>
                                    <input type="text" value={(currentItem.config.integration as Record<string, string>)?.['disease-id'] || ''} onChange={(e) => updateItemField('config.integration.disease-id', e.target.value)} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none" placeholder="ej: salmonella" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Probabilidad (0.0 - 1.0)</label>
                                    <input type="number" step="0.01" value={(currentItem.config.integration as Record<string, number>)?.['disease-chance'] || 0} onChange={(e) => updateItemField('config.integration.disease-chance', parseFloat(e.target.value))} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 pt-4 border-t border-[#374151]">
                            <div className="flex items-center gap-2 text-gray-400"><Trash2 className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest">Residuos (Leftovers)</h4></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Material Residuo</label>
                                    <input type="text" value={(currentItem.config.leftovers as Record<string, string>)?.material || ''} onChange={(e) => updateItemField('config.leftovers.material', e.target.value)} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none" placeholder="ej: BOWL" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Custom Model Data Residuo</label>
                                    <input type="number" value={(currentItem.config.leftovers as Record<string, number>)?.['custom-model-data'] || 0} onChange={(e) => updateItemField('config.leftovers.custom-model-data', parseInt(e.target.value))} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 pt-4 border-t border-[#374151]">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-green-400"><FileCode className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest">Comandos al Consumir</h4></div>
                                <button 
                                    onClick={() => {
                                        const newState = { ...projectState };
                                        const food = newState.foods[selectedItem].config;
                                        if (!food.commands) food.commands = [] as string[];
                                        (food.commands as string[]).push("me disfruta de una comida");
                                        setProjectState(newState);
                                    }}
                                    className="text-[9px] font-black uppercase bg-green-400/10 text-green-400 px-3 py-1.5 rounded-lg border border-green-400/20 hover:bg-green-400/20 transition-all"
                                >
                                    + Añadir Comando
                                </button>
                            </div>
                            <div className="space-y-2">
                                {(Array.isArray(currentItem.config.commands) ? currentItem.config.commands : []).map((cmd, idx) => (
                                    <div key={idx} className="flex gap-2 items-center bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-2">
                                        <input 
                                            type="text" 
                                            value={cmd} 
                                            onChange={(e) => {
                                                const newState = { ...projectState };
                                                (newState.foods[selectedItem].config.commands as string[])[idx] = e.target.value;
                                                setProjectState(newState);
                                            }}
                                            className="flex-1 bg-transparent text-sm text-white outline-none"
                                        />
                                        <button 
                                            onClick={() => {
                                                const newState = { ...projectState };
                                                (newState.foods[selectedItem].config.commands as string[]).splice(idx, 1);
                                                setProjectState(newState);
                                            }}
                                            className="text-gray-600 hover:text-red-400"
                                        >
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    </div>
                                ))}
                                {(currentItem.config.commands as string[] || []).length === 0 && (
                                    <p className="text-[10px] text-gray-600 italic px-1 text-center py-2">No hay comandos configurados.</p>
                                )}
                            </div>
                        </div>
                        </>
                    )}
                    {activeView === 'xmachines' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center border-b border-[#374151] pb-4">
                                <div className="flex items-center gap-2 text-orange-400"><Flame className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest">Recetas de la Estación</h4></div>
                                <button 
                                    onClick={() => {
                                        const newState = { ...projectState };
                                        const machine = newState.machines[selectedItem].config;
                                        if (!machine.recipes) machine.recipes = {};
                                        const recipes = machine.recipes as Record<string, unknown>;
                                        const rid = `receta_${Object.keys(recipes).length + 1}`;
                                        recipes[rid] = {
                                            inputs: { i1: { id: "PORKCHOP", amount: 1 } },
                                            output: { id: "COOKED_PORKCHOP", amount: 1 },
                                            time: 200,
                                            "burn-time": 100
                                        };
                                        setProjectState(newState);
                                    }}
                                    className="text-[10px] font-black uppercase bg-orange-400/10 text-orange-400 px-3 py-1.5 rounded-lg border border-orange-400/20 hover:bg-orange-400/20 transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-3 h-3"/> Añadir Receta
                                </button>
                            </div>
                            
                            <div className="grid gap-6">
                                {Object.entries((currentItem.config.recipes as Record<string, unknown>) || {}).map(([rid, rData]: [string, any]) => (
                                    <div key={rid} className="bg-[#0b0f19] rounded-2xl border border-[#374151] overflow-hidden">
                                        <div className="bg-white/5 px-6 py-3 flex justify-between items-center border-b border-white/5">
                                            <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">{rid}</span>
                                            <button 
                                                onClick={() => {
                                                    const newState = { ...projectState };
                                                    delete (newState.machines[selectedItem].config.recipes as Record<string, unknown>)[rid];
                                                    setProjectState(newState);
                                                }}
                                                className="text-gray-600 hover:text-red-400"
                                            >
                                                <Trash2 className="w-3.5 h-3.5"/>
                                            </button>
                                        </div>
                                        <div className="p-6 space-y-6">
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Ingredientes</label>
                                                        <button 
                                                            onClick={() => {
                                                                const newState = { ...projectState };
                                                                const recipe = (newState.machines[selectedItem].config.recipes as Record<string, any>)[rid];
                                                                if (!recipe.inputs) recipe.inputs = {};
                                                                const inputs = recipe.inputs as Record<string, unknown>;
                                                                const inputId = `i${Object.keys(inputs).length + 1}`;
                                                                inputs[inputId] = { id: "item_id", amount: 1 };
                                                                setProjectState(newState);
                                                            }}
                                                            className="text-[8px] font-bold text-orange-400/60 hover:text-orange-400"
                                                        >+ AÑADIR</button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {Object.entries((rData.inputs as Record<string, unknown>) || {}).map(([iKey, iVal]: [string, any]) => (
                                                            <div key={iKey} className="flex gap-2 items-center">
                                                                <input 
                                                                    type="text" 
                                                                    value={iVal.id} 
                                                                    onChange={(e) => updateItemField(`config.recipes.${rid}.inputs.${iKey}.id`, e.target.value)}
                                                                    className="flex-1 bg-black/20 border border-white/5 rounded px-2 py-1 text-[10px] text-white outline-none" 
                                                                />
                                                                <input 
                                                                    type="number" 
                                                                    value={iVal.amount} 
                                                                    onChange={(e) => updateItemField(`config.recipes.${rid}.inputs.${iKey}.amount`, parseInt(e.target.value))}
                                                                    className="w-12 bg-black/20 border border-white/5 rounded px-2 py-1 text-[10px] text-white outline-none" 
                                                                />
                                                                <button 
                                                                    onClick={() => {
                                                                        const newState = { ...projectState };
                                                                        delete (newState.machines[selectedItem].config.recipes as Record<string, any>)[rid].inputs[iKey];
                                                                        setProjectState(newState);
                                                                    }}
                                                                    className="text-gray-700 hover:text-red-500"
                                                                ><Trash2 className="w-3 h-3"/></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-4 text-right">
                                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Resultado</label>
                                                    <div className="flex gap-2 justify-end">
                                                        <input 
                                                            type="text" 
                                                            value={(rData.output as { id: string, amount: number })?.id || ''} 
                                                            onChange={(e) => updateItemField(`config.recipes.${rid}.output.id`, e.target.value)}
                                                            className="flex-1 bg-black/20 border border-white/5 rounded px-2 py-1 text-[10px] text-white outline-none text-right" 
                                                        />
                                                        <input 
                                                            type="number" 
                                                            value={(rData.output as { id: string, amount: number })?.amount || 1} 
                                                            onChange={(e) => updateItemField(`config.recipes.${rid}.output.amount`, parseInt(e.target.value))}
                                                            className="w-12 bg-black/20 border border-white/5 rounded px-2 py-1 text-[10px] text-white outline-none" 
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 pt-2 text-left">
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-bold text-gray-600 uppercase">Tiempo (Ticks)</label>
                                                            <input type="number" value={rData.time || 200} onChange={(e) => updateItemField(`config.recipes.${rid}.time`, parseInt(e.target.value))} className="w-full bg-black/20 border border-white/5 rounded px-2 py-1 text-[10px] text-white outline-none" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-bold text-gray-600 uppercase">Gasto Combustible</label>
                                                            <input type="number" value={rData['burn-time'] || 100} onChange={(e) => updateItemField(`config.recipes.${rid}.burn-time`, parseInt(e.target.value))} className="w-full bg-black/20 border border-white/5 rounded px-2 py-1 text-[10px] text-white outline-none" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-bold text-gray-600 uppercase">Sonido Inicio</label>
                                                            <input 
                                                                type="text" 
                                                                value={(rData.sounds as Record<string, string>)?.start || ''} 
                                                                onChange={(e) => updateItemField(`config.recipes.${rid}.sounds.start`, e.target.value)}
                                                                className="w-full bg-black/20 border border-white/5 rounded px-2 py-1 text-[10px] text-white outline-none"
                                                                placeholder="SOUND_ID"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-bold text-gray-600 uppercase">Sonido Fin</label>
                                                            <input 
                                                                type="text" 
                                                                value={(rData.sounds as Record<string, string>)?.finish || ''} 
                                                                onChange={(e) => updateItemField(`config.recipes.${rid}.sounds.finish`, e.target.value)}
                                                                className="w-full bg-black/20 border border-white/5 rounded px-2 py-1 text-[10px] text-white outline-none"
                                                                placeholder="SOUND_ID"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* RPG SECTION */}
                                                    <div className="mt-4 p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl space-y-3 text-left">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Zap className="w-3 h-3 text-purple-400" />
                                                            <span className="text-[9px] font-black text-purple-400 uppercase tracking-wider">Sistema RPG</span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[8px] font-bold text-gray-600 uppercase">Categoría</label>
                                                            <AutocompleteInput 
                                                                value={(rData.rpg as Record<string, unknown>)?.category as string || 'comida'} 
                                                                onChange={(val) => updateItemField(`config.recipes.${rid}.rpg.category`, val)}
                                                                options={['comida', 'cafeteria', 'quimica']}
                                                                placeholder="ID Categoría"
                                                                className="w-full bg-black/20 border border-white/5 rounded px-2 py-1 text-[10px] text-white outline-none focus:border-purple-500/30"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-bold text-gray-600 uppercase">Nivel Req.</label>
                                                                <input 
                                                                    type="number" 
                                                                    value={(rData.rpg as Record<string, number>)?.['required-level'] || 1} 
                                                                    onChange={(e) => updateItemField(`config.recipes.${rid}.rpg.required-level`, parseInt(e.target.value))}
                                                                    className="w-full bg-black/20 border border-white/5 rounded px-2 py-1 text-[10px] text-white outline-none focus:border-purple-500/30"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-bold text-gray-600 uppercase">Recompensa XP</label>
                                                                <input 
                                                                    type="number" 
                                                                    value={(rData.rpg as Record<string, number>)?.['xp-reward'] || 10} 
                                                                    onChange={(e) => updateItemField(`config.recipes.${rid}.rpg.xp-reward`, parseInt(e.target.value))}
                                                                    className="w-full bg-black/20 border border-white/5 rounded px-2 py-1 text-[10px] text-white outline-none focus:border-purple-500/30"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeView === 'xcrops' && (
                        <div className="space-y-8">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center border-b border-[#374151] pb-4">
                                    <div className="flex items-center gap-2 text-green-400"><FolderSearch className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest">Fases de Crecimiento (Stages)</h4></div>
                                    <button 
                                        onClick={() => {
                                            const newState = { ...projectState };
                                            const crop = newState.crops[selectedItem].config;
                                            if (!crop.growth) crop.growth = { stages: {} };
                                            const growth = crop.growth as Record<string, Record<string, unknown>>;
                                            if (!growth.stages) growth.stages = {};
                                            const stages = growth.stages as Record<string, unknown>;
                                            const stageCount = Object.keys(stages).length;
                                            const sid = `stage${stageCount}`;
                                            stages[sid] = { material: "FERN", scale: 1.0, "y-offset": 0.0, duration: 60000 };
                                            setProjectState(newState);
                                        }}
                                        className="text-[10px] font-black uppercase bg-green-400/10 text-green-400 px-3 py-1.5 rounded-lg border border-green-400/20 hover:bg-green-400/20 transition-all flex items-center gap-2"
                                    >
                                        <Plus className="w-3 h-3"/> Añadir Fase
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {Object.entries((currentItem.config.growth as Record<string, unknown>)?.stages as Record<string, unknown> || {}).map(([sid, sData]) => {
                                        const stageData = (sData as Record<string, unknown>) || {};
                                        return (
                                        <div key={sid} className="bg-[#0b0f19] rounded-2xl border border-[#374151] overflow-hidden">
                                            <div className="bg-white/5 px-6 py-3 flex justify-between items-center border-b border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">{sid}</span>
                                                    <input 
                                                        type="text" 
                                                        value={stageData.material as string || ''} 
                                                        onChange={(e) => updateItemField(`config.growth.stages.${sid}.material`, e.target.value)}
                                                        className="bg-transparent text-xs font-bold text-white outline-none border-b border-white/10 focus:border-yellow-400/50" 
                                                        placeholder="Material"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        const newState = { ...projectState };
                                                        delete (newState.crops[selectedItem].config.growth as Record<string, any>).stages[sid];
                                                        setProjectState(newState);
                                                    }}
                                                    className="text-gray-600 hover:text-red-400"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5"/>
                                                </button>
                                            </div>
                                            <div className="p-6 grid grid-cols-4 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-bold text-gray-600 uppercase">Escala</label>
                                                    <input type="number" step="0.1" value={stageData.scale as number || 1.0} onChange={(e) => updateItemField(`config.growth.stages.${sid}.scale`, parseFloat(e.target.value))} className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-white outline-none" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-bold text-gray-600 uppercase">Offset Y</label>
                                                    <input type="number" step="0.1" value={stageData['y-offset'] as number || 0.0} onChange={(e) => updateItemField(`config.growth.stages.${sid}.y-offset`, parseFloat(e.target.value))} className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-white outline-none" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-bold text-gray-600 uppercase">Duración (ms)</label>
                                                    <input type="number" value={stageData.duration as number || 60000} onChange={(e) => updateItemField(`config.growth.stages.${sid}.duration`, parseInt(e.target.value))} className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-white outline-none" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter">ItemsAdder ID</label>
                                                    <input 
                                                        type="text" 
                                                        value={stageData['itemsadder-id'] as string || ''} 
                                                        onChange={(e) => updateItemField(`config.growth.stages.${sid}.itemsadder-id`, e.target.value)}
                                                        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-white outline-none text-[10px]" 
                                                        placeholder="namespace:item"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ItemsAdder Toggle */}
                {(activeView === 'xfoods' || activeView === 'xcrops') && (
                <div className={cn("p-6 rounded-2xl border transition-all", isIAEnabled ? "bg-yellow-400/5 border-yellow-400/20" : "bg-white/2 border-white/5")}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Settings2 className={cn("w-5 h-5", isIAEnabled ? "text-yellow-400" : "text-gray-600")} />
                            <div><h4 className="text-sm font-bold text-white">Integración ItemsAdder</h4><p className="text-[11px] text-gray-500 uppercase font-medium">Texturas y Modelos Custom</p></div>
                        </div>
                        <label className="switch">
                            <input type="checkbox" checked={isIAEnabled} onChange={(e) => updateItemField('ia-toggle', e.target.checked)} />
                            <span className="slider"></span>
                        </label>
                    </div>
                    {isIAEnabled && (
                        <div className="mt-6 pt-6 border-t border-yellow-400/10 animate-in slide-in-from-top-2 duration-300 space-y-6">
                            {/* Mode Indicator */}
                            <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-lg", (projectState.iaItems[`${projectState.projectName}/${selectedItem}`]?.items as Record<string, IAItemConfig>)?.[selectedItem]?.resource?.generate ? "bg-green-400/10 text-green-400" : "bg-blue-400/10 text-blue-400")}>
                                        {(projectState.iaItems[`${projectState.projectName}/${selectedItem}`]?.items as Record<string, IAItemConfig>)?.[selectedItem]?.resource?.generate ? <Zap className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-gray-500">Modo de Renderizado</p>
                                        <h5 className="text-xs font-bold text-white">
                                            {(projectState.iaItems[`${projectState.projectName}/${selectedItem}`]?.items as Record<string, IAItemConfig>)?.[selectedItem]?.resource?.generate ? "Imagen 2D (Auto-generada)" : "Modelo 3D (Custom JSON)"}
                                        </h5>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        const newState = { ...projectState };
                                        const iaKey = `${newState.projectName}/${selectedItem}`;
                                        const iaItem = (newState.iaItems[iaKey].items as Record<string, IAItemConfig>)[selectedItem];
                                            if (iaItem.resource) {
                                                iaItem.resource.generate = !iaItem.resource.generate;
                                                if (iaItem.resource.generate) delete iaItem.resource.model_path;
                                                else iaItem.resource.model_path = `${newState.projectName}:item/${activeView === 'xfoods' ? 'food' : 'crops'}/${selectedItem}`;
                                            }
                                        setProjectState(newState);
                                    }}
                                    className="text-[9px] font-black uppercase bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all"
                                >
                                    Cambiar Modo
                                </button>
                            </div>

                            {/* Drop Zone */}
                            <div 
                                onClick={() => iaFileInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleIAFileUpload}
                                className="border-2 border-dashed border-yellow-400/20 rounded-2xl p-8 text-center hover:border-yellow-400/40 hover:bg-yellow-400/5 transition-all group cursor-pointer relative"
                            >
                                <input 
                                    type="file" 
                                    ref={iaFileInputRef} 
                                    onChange={handleIAFileUpload} 
                                    className="hidden" 
                                    accept=".png,.json"
                                    multiple
                                />
                                <div className="bg-yellow-400/10 p-3 rounded-full w-fit mx-auto mb-3 group-hover:scale-110 transition-transform">
                                    <Upload className="w-6 h-6 text-yellow-400" />
                                </div>
                                <h4 className="text-white font-bold text-sm">Actualizar Activos</h4>
                                <p className="text-[9px] text-gray-500 mt-1 uppercase font-black tracking-widest">Sube .png o .json</p>
                            </div>

                            {/* Linked Files List */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-gray-500 uppercase px-1">Archivos Vinculados</label>
                                <div className="grid gap-2">
                                    {projectState.rawFiles
                                        .filter(f => {
                                            const cleanId = sanitizePath(selectedItem);
                                            const sub = activeView === 'xfoods' ? 'food' : 'crops';
                                            return f.inferredPath.includes(`/${cleanId}.`) || 
                                                   (f.inferredPath.includes(`/item/${sub}/`) && f.inferredPath.includes(`/${cleanId}_`));
                                        })
                                        .slice(-5) // Show last 5 relevant files
                                        .map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <FileCode className={cn("w-3 h-3", file.name.endsWith('.json') ? "text-blue-400" : "text-green-400")} />
                                                    <span className="text-[10px] text-gray-300 font-medium truncate max-w-[150px]">{file.name}</span>
                                                </div>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newState = { ...projectState };
                                                        newState.rawFiles = newState.rawFiles.filter(f => f !== file);
                                                        setProjectState(newState);
                                                    }}
                                                    className="text-gray-600 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-3 h-3"/>
                                                </button>
                                            </div>
                                        ))
                                    }
                                    {projectState.rawFiles.filter(f => f.inferredPath.includes(`/${selectedItem}.`) || f.inferredPath.includes(`/${activeView === 'xfoods' ? 'food' : 'crops'}/`)).length === 0 && (
                                        <p className="text-[10px] text-gray-600 italic px-1">No hay archivos específicos cargados.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                )}
             </div>
           ) : (
             <div className="h-full flex items-center justify-center text-center opacity-50 grayscale scale-95 transition-all">
                <div className="space-y-4"><Package className="w-20 h-20 mx-auto text-gray-700" /><p className="text-gray-600 font-bold uppercase tracking-widest">Selecciona un elemento para editar</p></div>
             </div>
           )}
        </main>

        <section className="col-span-3 bg-black border border-[#374151] rounded-2xl overflow-hidden flex flex-col shadow-2xl lg:sticky lg:top-0 h-fit max-h-[90vh]">
           <div className="bg-[#111827] px-4 py-3 border-b border-[#374151] flex items-center justify-between">
              <div className="flex items-center gap-2"><Binary className="w-4 h-4 text-accent" /><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Preview</span></div>
              <div className="flex gap-2">
                 <button onClick={() => setActivePreview('plugin')} className={cn("text-[9px] font-black px-2 py-0.5 rounded border transition-all", activePreview === 'plugin' ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" : "text-gray-600 border-transparent")}>PLUGIN</button>
                 <button disabled={!isIAEnabled} onClick={() => setActivePreview('ia')} className={cn("text-[9px] font-black px-2 py-0.5 rounded border transition-all disabled:opacity-0", activePreview === 'ia' ? "text-blue-400 bg-blue-400/10 border-blue-400/20" : "text-gray-600 border-transparent")}>IA</button>
              </div>
           </div>
           <div className="flex-1 p-6 overflow-auto font-mono text-[12px] text-blue-200 leading-relaxed scrollbar-hide">
              <pre className="whitespace-pre-wrap break-words">
                {selectedItem && currentItem ? (
                  activePreview === 'plugin' ? stringifyYaml(currentItem.config) : (projectState.iaItems[`${projectState.projectName}/${selectedItem}`] ? stringifyYaml(projectState.iaItems[`${projectState.projectName}/${selectedItem}`]) : "# No hay config de IA")
                ) : "# Selecciona un ítem..."}
              </pre>
           </div>
           <div className="p-4 bg-[#111827] border-t border-[#374151]">
              <button onClick={() => { if (selectedItem && currentItem) { const yaml = activePreview === 'plugin' ? stringifyYaml(currentItem.config) : stringifyYaml(projectState.iaItems[`${projectState.projectName}/${selectedItem}`]); navigator.clipboard.writeText(yaml || ""); alert("Copiado"); } }} className="w-full bg-[#1f2937] hover:bg-[#374151] text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-[#374151]">Copiar Código</button>
           </div>
        </section>
      </div>
    </div>
  );
}
