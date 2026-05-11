"use client";

import { useState, useRef } from "react";
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
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseUploadedFiles, EcosystemState, stringifyYaml } from "@/lib/studio";
import { exportEcosystem } from "@/lib/export";

interface IAItemConfig {
  resource?: {
    generate?: boolean;
    model_path?: string;
    textures?: string[];
  };
}

export default function StudioPage() {
  const [projectState, setProjectState] = useState<EcosystemState | null>(null);
  const [activeView, setActiveView] = useState<'xfoods' | 'xcrops' | 'xmachines'>("xfoods");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [activePreview, setActivePreview] = useState<'plugin' | 'ia'>('plugin');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const iaFileInputRef = useRef<HTMLInputElement>(null);

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
    const ns = projectState.projectName;
    const subfolder = activeView === 'xfoods' ? 'food' : 'crops';
    
    let hasModel = false;
    let modelName = "";

    for (const file of filesList) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'png' && ext !== 'json') continue;

      const buffer = await file.arrayBuffer();
      const isJson = ext === 'json';
      if (isJson) {
        hasModel = true;
        modelName = file.name.replace(".json", "");
      }

      // Determine where to put it in the resource pack
      const assetType = isJson ? 'models' : 'textures';
      const inferredPath = `${assetType}/items/${subfolder}/${file.name}`;

      newState.rawFiles.push({
        name: file.name,
        content: buffer,
        type: 'raw',
        inferredPath: `plugins/ItemsAdder/contents/${ns}/resourcepack/assets/${ns}/${inferredPath}`
      });
    }

    // Update IA Config based on what was uploaded
    if (newState.iaItems[selectedItem]) {
      const iaItem = (newState.iaItems[selectedItem].items as Record<string, IAItemConfig>)[selectedItem];
      const currentResource = iaItem.resource || {};
      const alreadyHasModel = !!currentResource.model_path;

      if (hasModel) {
        // If this batch has a model, we definitely want to use it
        iaItem.resource = { 
          generate: false, 
          model_path: `${ns}:items/${subfolder}/${modelName}` 
        };
      } else if (!alreadyHasModel) {
        // Only switch to texture-based if there isn't a model already configured
        const firstPng = filesList.find(f => f.name.endsWith('.png'));
        if (firstPng) {
          const texName = firstPng.name.replace(".png", "");
          iaItem.resource = { 
            generate: true, 
            textures: [`${ns}:items/${subfolder}/${texName}`] 
          };
        }
      }
      // If alreadyHasModel is true and no model was in this batch, 
      // we keep the model_path but the textures were still added to rawFiles.
    }

    setProjectState(newState);
    alert(`¡${filesList.length} archivos vinculados con éxito!`);
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    try {
      const state = await parseUploadedFiles(e.target.files);
      setProjectState(state);
    } catch (err) {
      console.error("Import failed", err);
    }
  };

  const handleCreateNew = () => {
    if (!projectState) return;
    const timestamp = Date.now();
    let newId = "";
    const newState = { ...projectState };

    if (activeView === 'xfoods') {
      newId = `nueva_comida_${timestamp}`;
      newState.foods[newId] = {
        config: {
            "display-name": "&eNueva Comida",
            "lore": ["&7Descripción de la comida."],
            "item": { "material": "PORKCHOP", "custom-model-data": 0, "max-stack": 64 },
            "stats": { "food-level": 4, "saturation": 2.0, "bites": 1, "consumable": true, "expiry-minutes": 0, "consumption-ticks": 30 },
            "nutrition": { "proteins": 0, "carbs": 0, "sugars": 0, "vitamins": 0 },
            "effects": { "sound": "ENTITY_GENERIC_EAT", "particle": "VILLAGER_HAPPY" }
        },
        folder: ""
      };
    } else if (activeView === 'xcrops') {
      newId = `nuevo_cultivo_${timestamp}`;
      newState.crops[newId] = {
        config: {
            "display-name": "Nuevo Cultivo",
            "seed": { "material": "WHEAT_SEEDS", "display-name": "&aSemilla", "lore": ["&7Semilla de cultivo."], "custom-model-data": 0 },
            "growth": { "wither-time": 2400, "stages": { "stage0": { "material": "FERN", "scale": 1.0, "y-offset": 0.1, "duration": 60 } } },
            "harvest": { "xfoods-id": "apple", "amount": 1, "message": "&a¡Has cosechado!" },
            "visuals": { "hologram-title": "&fCultivo" },
            "requirements": { "seed-nbt": newId }
        },
        folder: ""
      };
    } else {
      newId = `nueva_maquina_${timestamp}`;
      newState.machines[newId] = {
        config: {
            "display-name": "&6Nueva Estación",
            "recipes": {}
        },
        folder: ""
      };
    }
    
    setProjectState(newState);
    setSelectedItem(newId);
  };

  const renameSelectedItem = (newId: string) => {
    if (!projectState || !selectedItem || !newId || newId === selectedItem) return;
    const newState = { ...projectState };
    let targetMap: Record<string, { config: Record<string, unknown>, folder?: string }>;
    if (activeView === 'xfoods') targetMap = newState.foods;
    else if (activeView === 'xcrops') targetMap = newState.crops;
    else targetMap = newState.machines;
    
    if (targetMap[newId]) return;

    targetMap[newId] = { ...targetMap[selectedItem] };
    delete targetMap[selectedItem];
    
    setProjectState(newState);
    setSelectedItem(newId);
  };

  const updateItemField = (path: string, value: unknown) => {
    if (!projectState || !selectedItem) return;
    const newState = { ...projectState };
    
    // Determine target map
    const targetMap = activeView === 'xfoods' ? newState.foods : 
                     (activeView === 'xcrops' ? newState.crops : newState.machines);
    
    const entry = targetMap[selectedItem];
    if (!entry) return;

    if (path === 'config.item.custom-model-data' || path === 'config.seed.custom-model-data') {
        const val = parseInt(value as string) || 0;
        const item = activeView === 'xfoods' ? newState.foods[selectedItem].config : newState.crops[selectedItem].config;
        if (activeView === 'xfoods') {
            if (!item.item) item.item = {};
            (item.item as Record<string, unknown>)['custom-model-data'] = val;
        } else {
            if (!item.seed) item.seed = {};
            (item.seed as Record<string, unknown>)['custom-model-data'] = val;
        }
        
        // Sync to IA if exists
        if (newState.iaItems[selectedItem]) {
            const iaItem = (newState.iaItems[selectedItem].items as Record<string, Record<string, unknown>>)?.[selectedItem];
            if (iaItem) {
                if (!iaItem.specific_properties) iaItem.specific_properties = {};
                (iaItem.specific_properties as Record<string, unknown>).custom_model_data = val;
            }
        }
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
            
            newState.iaItems[selectedItem] = {
                items: {
                    [selectedItem]: {
                        display_name: item['display-name'] || "Nuevo Ítem",
                        permission: `${newState.projectName.toLowerCase()}.${selectedItem}`,
                        resource: { 
                            generate: true, 
                            textures: [`${newState.projectName}:items/${subfolder}/${selectedItem}`] 
                        },
                        ...(currentCMD > 0 ? { specific_properties: { custom_model_data: currentCMD } } : {})
                    }
                }
            };
        } else {
            if (activeView === 'xfoods' && item.item) delete (item.item as Record<string, unknown>)['itemsadder-id'];
            if (activeView === 'xcrops' && item.seed) delete (item.seed as Record<string, unknown>)['itemsadder-id'];
            delete newState.iaItems[selectedItem];
        }
        setProjectState(newState);
        return;
    }

    // Standard nested path update
    const keys = path.split('.');
    let current: Record<string, unknown> = entry as unknown as Record<string, unknown>;
    
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key]) current[key] = {};
        current = current[key] as Record<string, unknown>;
    }
    
    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;

    // Handle lore as list
    if (path.endsWith('.lore') && typeof value === 'string') {
        current[lastKey] = value.split('\n');
    }

    setProjectState(newState);
  };

  const handleAddRecipe = () => {
    if (!projectState || !selectedItem || activeView !== 'xmachines') return;
    const newState = { ...projectState };
    const machine = newState.machines[selectedItem].config as { recipes: Record<string, Record<string, unknown>> };
    if (!machine.recipes) machine.recipes = {};
    const rid = `recipe_${Date.now()}`;
    machine.recipes[rid] = { inputs: { i1: { id: "item", amount: 1 } }, output: { id: "result", amount: 1 }, time: 200 };
    setProjectState(newState);
  };

  const handleRemoveRecipe = (recipeId: string) => {
    if (!projectState || !selectedItem || activeView !== 'xmachines') return;
    const newState = { ...projectState };
    const machineConfig = newState.machines[selectedItem].config as { recipes: Record<string, Record<string, unknown>> };
    delete machineConfig.recipes[recipeId];
    setProjectState(newState);
  };

  const toggleFolder = (folderName: string) => {
    setOpenFolders(prev => ({ ...prev, [folderName]: prev[folderName] === false }));
  };

  const handleExport = async () => {
    if (!projectState) return;
    await exportEcosystem(projectState);
  };

  if (!projectState) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="space-y-4">
          <div className="bg-yellow-400/10 p-6 rounded-full w-fit mx-auto border border-yellow-400/20">
             <FolderSearch className="w-16 h-16 text-yellow-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Studio Pro Engine</h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">Sube tu carpeta de proyecto para gestionar la jerarquía.</p>
        </div>
        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-[#374151] rounded-3xl p-20 hover:border-yellow-400/5 hover:bg-yellow-400/5 transition-all cursor-pointer group">
          <input type="file" ref={fileInputRef} onChange={handleFolderUpload} className="hidden" {...({ webkitdirectory: "", directory: "" } as Record<string, string>)} />
          <div className="space-y-6">
            <div className="bg-white/5 p-5 rounded-2xl w-fit mx-auto group-hover:scale-110 transition-transform duration-300">
              <Upload className="w-10 h-10 text-gray-400 group-hover:text-yellow-400" />
            </div>
            <p className="text-white font-bold text-xl">Seleccionar Carpeta</p>
          </div>
        </div>
      </div>
    );
  }

  const currentMap = activeView === 'xfoods' ? projectState.foods : (activeView === 'xcrops' ? projectState.crops : projectState.machines);
  const groupedItems: Record<string, string[]> = {};
  Object.entries(currentMap).forEach(([id, data]) => {
    const folder = data.folder || "Raíz";
    if (!groupedItems[folder]) groupedItems[folder] = [];
    groupedItems[folder].push(id);
  });

  const currentItem = selectedItem ? currentMap[selectedItem] : null;
  const isIAEnabled = currentItem ? (activeView === 'xfoods' ? !!(currentItem.config.item as Record<string, unknown>)?.['itemsadder-id'] : !!(currentItem.config.seed as Record<string, unknown>)?.['itemsadder-id']) : false;

  return (
    <div className="h-full flex flex-col space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center bg-[#111827] p-6 rounded-2xl border border-[#374151]">
        <div className="flex items-center gap-6">
          <div className="bg-yellow-400 p-2 rounded-lg text-black font-black text-xs">PRO</div>
          <h2 className="text-xl font-bold text-white tracking-tight">Proyecto: <span className="text-yellow-400">{projectState.projectName}</span></h2>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setProjectState(null); setSelectedItem(null); }} className="px-6 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-colors">Cerrar</button>
          <button onClick={handleExport} className="flex items-center gap-2 bg-yellow-400 text-black px-8 py-2.5 rounded-xl font-bold hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-400/20"><Download className="w-4 h-4" /> Descargar Todo (.zip)</button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
        <aside className="col-span-3 bg-[#111827] border border-[#374151] rounded-2xl flex flex-col overflow-hidden shadow-xl">
           <div className="p-4 border-b border-[#374151] flex gap-2 overflow-x-auto scrollbar-hide">
              <button onClick={() => { setActiveView('xfoods'); setSelectedItem(null); }} className={cn("px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all flex-shrink-0", activeView === 'xfoods' ? "bg-accent text-white" : "text-gray-500 hover:text-gray-300")}>Comidas</button>
              <button onClick={() => { setActiveView('xmachines'); setSelectedItem(null); }} className={cn("px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all flex-shrink-0", activeView === 'xmachines' ? "bg-accent text-white" : "text-gray-500 hover:text-gray-300")}>Máquinas</button>
              <button onClick={() => { setActiveView('xcrops'); setSelectedItem(null); }} className={cn("px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all flex-shrink-0", activeView === 'xcrops' ? "bg-accent text-white" : "text-gray-500 hover:text-gray-300")}>Cultivos</button>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <button onClick={handleCreateNew} className="w-full flex items-center gap-3 px-4 py-3 bg-yellow-400/5 border border-yellow-400/20 rounded-xl text-xs font-bold text-yellow-400 hover:bg-yellow-400/10 transition-all"><Plus className="w-4 h-4" /> Crear Nuevo</button>
              {Object.entries(groupedItems).map(([folder, items]) => (
                <div key={folder} className="space-y-1">
                   <button onClick={() => toggleFolder(folder)} className="w-full flex items-center gap-2 px-2 py-1 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-gray-300 transition-colors">
                     {openFolders[folder] ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                     <FolderOpen className="w-3 h-3" /> {folder}
                   </button>
                   {openFolders[folder] !== true && (
                     <div className="space-y-1 pl-4 animate-in slide-in-from-top-1 duration-200">
                        {items.map(id => (
                            <div key={id} onClick={() => setSelectedItem(id)} className={cn("px-4 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all border", selectedItem === id ? "bg-yellow-400/10 border-yellow-400/50 text-white" : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5")}>{id}</div>
                        ))}
                     </div>
                   )}
                </div>
              ))}
           </div>
        </aside>

        <main className="col-span-6 bg-[#111827] border border-[#374151] rounded-2xl overflow-y-auto p-8 shadow-2xl space-y-8">
           {selectedItem && currentItem ? (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-8 pb-10">
                <div className="flex justify-between items-start border-b border-[#374151] pb-6">
                   <div className="space-y-1 flex-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">ID Único</label>
                      <input type="text" value={selectedItem} onChange={(e) => renameSelectedItem(e.target.value)} className="bg-transparent text-2xl font-bold text-yellow-400 focus:outline-none border-b border-transparent focus:border-yellow-400/30 w-full" />
                   </div>
                   <div className="bg-yellow-400/10 border border-yellow-400/20 px-3 py-1.5 rounded-lg text-[10px] font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2"><FileCode className="w-3.3 h-3.3" /> {activeView.toUpperCase()}</div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-blue-400"><FolderOpen className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest">Organización</h4></div>
                    <input type="text" value={(currentItem.folder as string) || ''} onChange={(e) => updateItemField('folder', e.target.value)} placeholder="ej: macdonalds/burgers" className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-yellow-400 outline-none transition-colors" />
                </div>

                {/* --- RENDER EDITOR CONTENT --- */}
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
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151]"><label className="text-[9px] font-bold text-gray-600 uppercase block mb-1">Proteínas</label><input type="number" value={(currentItem.config.nutrition as Record<string, number>)?.proteins || 0} onChange={(e) => updateItemField('config.nutrition.proteins', parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" /></div>
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151]"><label className="text-[9px] font-bold text-gray-600 uppercase block mb-1">Carbos</label><input type="number" value={(currentItem.config.nutrition as Record<string, number>)?.carbs || 0} onChange={(e) => updateItemField('config.nutrition.carbs', parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" /></div>
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151]"><label className="text-[9px] font-bold text-gray-600 uppercase block mb-1">Azúcares</label><input type="number" value={(currentItem.config.nutrition as Record<string, number>)?.sugars || 0} onChange={(e) => updateItemField('config.nutrition.sugars', parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" /></div>
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151]"><label className="text-[9px] font-bold text-gray-600 uppercase block mb-1">Vitaminas</label><input type="number" value={(currentItem.config.nutrition as Record<string, number>)?.vitamins || 0} onChange={(e) => updateItemField('config.nutrition.vitamins', parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" /></div>
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
                                {(currentItem.config.commands as string[] || []).map((cmd, idx) => (
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
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-yellow-400">
                                    <Flame className="w-4 h-4" />
                                    <h4 className="text-xs font-black uppercase tracking-widest">Recetas de la Estación</h4>
                                </div>
                                <button onClick={handleAddRecipe} className="text-[10px] font-black uppercase bg-yellow-400/10 text-yellow-400 px-3 py-1.5 rounded-lg border border-yellow-400/20 hover:bg-yellow-400/20 transition-all flex items-center gap-2">
                                    <Plus className="w-3 h-3"/> Añadir Receta
                                </button>
                            </div>
                            
                            <div className="grid gap-6">
                                {Object.entries(currentItem.config.recipes as Record<string, { inputs: Record<string, { id: string, amount: number }>, output: { id: string, amount: number }, time: number }> || {}).map(([rid, rData]) => (
                                    <div key={rid} className="bg-[#0b0f19] rounded-2xl border border-[#374151] p-6 relative group/recipe space-y-4">
                                        <button onClick={() => handleRemoveRecipe(rid)} className="absolute top-4 right-4 text-gray-600 hover:text-red-500 opacity-0 group-hover/recipe:opacity-100 transition-all">
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                        
                                        <div className="grid grid-cols-2 gap-6">
                                            {/* Inputs Section */}
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <label className="text-[9px] font-bold text-gray-500 uppercase">Entradas (Inputs)</label>
                                                    <button 
                                                        onClick={() => {
                                                            const newState = { ...projectState };
                                                            const recipe = (newState.machines[selectedItem].config.recipes as Record<string, Record<string, unknown>>)[rid];
                                                            const inputId = `i${Object.keys((recipe.inputs as Record<string, unknown>) || {}).length + 1}`;
                                                            if (!recipe.inputs) recipe.inputs = {};
                                                            (recipe.inputs as Record<string, unknown>)[inputId] = { id: "item_id", amount: 1 };
                                                            setProjectState(newState);
                                                        }}
                                                        className="text-[8px] font-bold bg-white/5 hover:bg-white/10 px-2 py-1 rounded"
                                                    >
                                                        + Item
                                                    </button>
                                                </div>
                                                <div className="space-y-2">
                                                    {Object.entries((rData.inputs as Record<string, { id: string, amount: number }>) || {}).map(([inputId, input]) => (
                                                        <div key={inputId} className="flex gap-2 items-center bg-black/20 p-2 rounded-lg border border-white/5">
                                                            <input 
                                                                type="text" 
                                                                value={input.id} 
                                                                onChange={(e) => updateItemField(`config.recipes.${rid}.inputs.${inputId}.id`, e.target.value)}
                                                                className="flex-1 bg-transparent text-[11px] text-white outline-none" 
                                                                placeholder="ID Item"
                                                            />
                                                            <input 
                                                                type="number" 
                                                                value={input.amount} 
                                                                onChange={(e) => updateItemField(`config.recipes.${rid}.inputs.${inputId}.amount`, parseInt(e.target.value))}
                                                                className="w-12 bg-transparent text-[11px] text-yellow-400 font-bold outline-none text-right"
                                                            />
                                                            <button 
                                                                onClick={() => {
                                                                    const newState = { ...projectState };
                                                                    delete ((newState.machines[selectedItem].config.recipes as Record<string, Record<string, unknown>>)[rid].inputs as Record<string, unknown>)[inputId];
                                                                    setProjectState(newState);
                                                                }}
                                                                className="text-gray-600 hover:text-red-400"
                                                            >
                                                                <Trash2 className="w-3 h-3"/>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Output & Time Section */}
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-bold text-gray-500 uppercase">Resultado (Output)</label>
                                                    <div className="flex gap-2 items-center bg-yellow-400/5 p-2 rounded-lg border border-yellow-400/10">
                                                        <input 
                                                            type="text" 
                                                            value={(rData.output as { id: string, amount: number })?.id || ''} 
                                                            onChange={(e) => updateItemField(`config.recipes.${rid}.output.id`, e.target.value)}
                                                            className="flex-1 bg-transparent text-[11px] text-white font-bold outline-none" 
                                                            placeholder="Resultado ID"
                                                        />
                                                        <input 
                                                            type="number" 
                                                            value={(rData.output as { id: string, amount: number })?.amount || 1} 
                                                            onChange={(e) => updateItemField(`config.recipes.${rid}.output.amount`, parseInt(e.target.value))}
                                                            className="w-12 bg-transparent text-[11px] text-yellow-400 font-bold outline-none text-right"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-bold text-gray-500 uppercase flex items-center gap-2">
                                                        <Clock className="w-3 h-3" /> Tiempo (Ticks)
                                                    </label>
                                                    <input 
                                                        type="number" 
                                                        value={rData.time || 200} 
                                                        onChange={(e) => updateItemField(`config.recipes.${rid}.time`, parseInt(e.target.value))}
                                                        className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-[11px] text-white outline-none focus:border-yellow-400/30"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
                                    <div className={cn("p-2 rounded-lg", (projectState.iaItems[selectedItem]?.items as Record<string, IAItemConfig>)?.[selectedItem]?.resource?.generate ? "bg-green-400/10 text-green-400" : "bg-blue-400/10 text-blue-400")}>
                                        {(projectState.iaItems[selectedItem]?.items as Record<string, IAItemConfig>)?.[selectedItem]?.resource?.generate ? <Zap className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-gray-500">Modo de Renderizado</p>
                                        <h5 className="text-xs font-bold text-white">
                                            {(projectState.iaItems[selectedItem]?.items as Record<string, IAItemConfig>)?.[selectedItem]?.resource?.generate ? "Imagen 2D (Auto-generada)" : "Modelo 3D (Custom JSON)"}
                                        </h5>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        const newState = { ...projectState };
                                        const iaItem = (newState.iaItems[selectedItem].items as Record<string, IAItemConfig>)[selectedItem];
                                        if (iaItem.resource) {
                                            iaItem.resource.generate = !iaItem.resource.generate;
                                            if (iaItem.resource.generate) delete iaItem.resource.model_path;
                                            else iaItem.resource.model_path = `${newState.projectName}:items/${activeView === 'xfoods' ? 'food' : 'crops'}/${selectedItem}`;
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
                                        .filter(f => f.inferredPath.includes(`/${selectedItem}.`) || f.inferredPath.includes(`/${activeView === 'xfoods' ? 'food' : 'crops'}/`))
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
                  activePreview === 'plugin' ? stringifyYaml(currentItem.config) : (projectState.iaItems[selectedItem] ? stringifyYaml(projectState.iaItems[selectedItem]) : "# No hay config de IA")
                ) : "# Selecciona un ítem..."}
              </pre>
           </div>
           <div className="p-4 bg-[#111827] border-t border-[#374151]">
              <button onClick={() => { if (selectedItem && currentItem) { navigator.clipboard.writeText(activePreview === 'plugin' ? stringifyYaml(currentItem.config) : stringifyYaml(projectState.iaItems[selectedItem])); alert("Copiado"); } }} className="w-full bg-[#1f2937] hover:bg-[#374151] text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-[#374151]">Copiar Código</button>
           </div>
        </section>
      </div>
    </div>
  );
}
