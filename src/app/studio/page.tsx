"use client";

import { useState, useRef } from "react";
import { 
  Upload, 
  FileCode, 
  Download, 
  Plus, 
  FolderSearch,
  CheckCircle2,
  Package,
  ChefHat,
  Sprout,
  Binary,
  Settings2,
  TrendingUp,
  Apple,
  Zap,
  Info,
  Flame,
  UtensilsCrossed,
  Layers,
  Trash2,
  Clock,
  Dices,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseUploadedFiles, EcosystemState, stringifyYaml } from "@/lib/studio";
import { exportEcosystem } from "@/lib/export";

export default function StudioPage() {
  const [projectState, setProjectState] = useState<EcosystemState | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [activeView, setActiveView] = useState<'xfoods' | 'xcrops' | 'xmachines'>("xfoods");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [activePreview, setActivePreview] = useState<'plugin' | 'ia'>('plugin');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setIsImporting(true);
    try {
      const state = await parseUploadedFiles(e.target.files);
      setProjectState(state);
    } catch (err) {
      console.error("Import failed", err);
    } finally {
      setIsImporting(false);
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
            "item": { "material": "PORKCHOP", "custom-model-data": 0 },
            "stats": { "food-level": 4, "saturation": 2.0, "bites": 1, "consumable": true, "max-stack": 64, "expiry-minutes": 0 },
            "nutrition": { "proteins": 0, "carbs": 0, "sugars": 0, "vitamins": 0 }
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
    let targetMap: any;
    if (activeView === 'xfoods') targetMap = newState.foods;
    else if (activeView === 'xcrops') targetMap = newState.crops;
    else targetMap = newState.machines;
    
    if (targetMap[newId]) return;

    targetMap[newId] = { ...targetMap[selectedItem] };
    delete targetMap[selectedItem];
    
    setProjectState(newState);
    setSelectedItem(newId);
  };

  const updateItemField = (path: string, value: any) => {
    if (!projectState || !selectedItem) return;
    const newState = { ...projectState };
    
    if (path === 'folder') {
        if (activeView === 'xfoods') newState.foods[selectedItem].folder = value;
        else if (activeView === 'xcrops') newState.crops[selectedItem].folder = value;
        else newState.machines[selectedItem].folder = value;
        setProjectState(newState);
        return;
    }

    if (path === 'ia-toggle') {
        const item = activeView === 'xfoods' ? newState.foods[selectedItem].config : newState.crops[selectedItem].config;
        if (value) {
            if (!item.item && activeView === 'xfoods') item.item = {};
            if (!item.seed && activeView === 'xcrops') item.seed = {};
            
            const target = activeView === 'xfoods' ? item.item : item.seed;
            target['itemsadder-id'] = `xLib:${selectedItem}`;
            
            newState.iaItems[selectedItem] = {
                items: {
                    [selectedItem]: {
                        display_name: item['display-name'] || "Nuevo Ítem",
                        permission: `xlib.${selectedItem}`,
                        resource: { generate: true, textures: [`xLib:items/${activeView === 'xfoods' ? 'food' : 'crops'}/${selectedItem}`] }
                    }
                }
            };
        } else {
            if (activeView === 'xfoods' && item.item) delete item.item['itemsadder-id'];
            if (activeView === 'xcrops' && item.seed) delete item.seed['itemsadder-id'];
            delete newState.iaItems[selectedItem];
        }
        setProjectState(newState);
        return;
    }

    const item = activeView === 'xfoods' ? newState.foods[selectedItem].config : 
                 (activeView === 'xcrops' ? newState.crops[selectedItem].config : newState.machines[selectedItem].config);
    
    const keys = path.split('.');
    let current = item;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    if (path.endsWith('.lore') && typeof value === 'string') {
        current[keys[keys.length - 1]] = value.split('\n').map((l: string) => l.trim());
    }

    setProjectState(newState);
  };

  const handleAddRecipe = () => {
    if (!projectState || !selectedItem || activeView !== 'xmachines') return;
    const newState = { ...projectState };
    const machine = newState.machines[selectedItem].config;
    if (!machine.recipes) machine.recipes = {};
    const rid = `recipe_${Date.now()}`;
    machine.recipes[rid] = { inputs: { i1: { id: "item", amount: 1 } }, output: { id: "result", amount: 1 }, time: 200 };
    setProjectState(newState);
  };

  const handleRemoveRecipe = (recipeId: string) => {
    if (!projectState || !selectedItem || activeView !== 'xmachines') return;
    const newState = { ...projectState };
    delete newState.machines[selectedItem].config.recipes[recipeId];
    setProjectState(newState);
  };

  const handleAddStage = () => {
    if (!projectState || !selectedItem || activeView !== 'xcrops') return;
    const newState = { ...projectState };
    const crop = newState.crops[selectedItem].config;
    if (!crop.growth) crop.growth = {};
    if (!crop.growth.stages) crop.growth.stages = {};
    const sid = `stage${Object.keys(crop.growth.stages).length}`;
    crop.growth.stages[sid] = { material: "FERN", scale: 1.0, "y-offset": 0.1, duration: 60 };
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
          <input type="file" ref={fileInputRef} onChange={handleFolderUpload} className="hidden" {...({ webkitdirectory: "", directory: "" } as any)} />
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
  const isIAEnabled = currentItem ? (activeView === 'xfoods' ? !!currentItem.config.item?.['itemsadder-id'] : !!currentItem.config.seed?.['itemsadder-id']) : false;

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
                    <input type="text" value={currentItem.folder || ''} onChange={(e) => updateItemField('folder', e.target.value)} placeholder="ej: macdonalds/burgers" className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-yellow-400 outline-none transition-colors" />
                </div>

                {/* --- RENDER EDITOR CONTENT --- */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-yellow-400"><Info className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest">Ajustes Base</h4></div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Nombre Display</label>
                            <input type="text" value={currentItem.config['display-name'] || ''} onChange={(e) => updateItemField('config.display-name', e.target.value)} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none" />
                        </div>
                        {activeView !== 'xmachines' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Material</label>
                                <input type="text" value={(activeView === 'xfoods' ? currentItem.config.item?.material : currentItem.config.seed?.material) || ''} onChange={(e) => updateItemField(activeView === 'xfoods' ? 'config.item.material' : 'config.seed.material', e.target.value)} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none" />
                            </div>
                        )}
                    </div>
                    {activeView === 'xfoods' && (
                        <>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Lore</label>
                            <textarea rows={3} value={Array.isArray(currentItem.config.lore) ? currentItem.config.lore.join('\n') : ''} onChange={(e) => updateItemField('config.lore', e.target.value)} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none resize-none text-sm" />
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151]"><label className="text-[9px] font-bold text-gray-600 uppercase block mb-1">Proteínas</label><input type="number" value={currentItem.config.nutrition?.proteins || 0} onChange={(e) => updateItemField('config.nutrition.proteins', parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" /></div>
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151]"><label className="text-[9px] font-bold text-gray-600 uppercase block mb-1">Carbos</label><input type="number" value={currentItem.config.nutrition?.carbs || 0} onChange={(e) => updateItemField('config.nutrition.carbs', parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" /></div>
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151]"><label className="text-[9px] font-bold text-gray-600 uppercase block mb-1">Azúcares</label><input type="number" value={currentItem.config.nutrition?.sugars || 0} onChange={(e) => updateItemField('config.nutrition.sugars', parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" /></div>
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151]"><label className="text-[9px] font-bold text-gray-600 uppercase block mb-1">Vitaminas</label><input type="number" value={currentItem.config.nutrition?.vitamins || 0} onChange={(e) => updateItemField('config.nutrition.vitamins', parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" /></div>
                        </div>
                        </>
                    )}
                    {activeView === 'xmachines' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-yellow-400"><Flame className="w-4 h-4" /><h4 className="text-xs font-black uppercase tracking-widest">Recetas</h4></div><button onClick={handleAddRecipe} className="text-[10px] font-black uppercase bg-yellow-400/10 text-yellow-400 px-3 py-1.5 rounded-lg border border-yellow-400/20 hover:bg-yellow-400/20 transition-all flex items-center gap-2"><Plus className="w-3 h-3"/> Añadir</button></div>
                            <div className="space-y-4">
                                {Object.entries(currentItem.config.recipes || {}).map(([rid, rData]: [string, any]) => (
                                    <div key={rid} className="bg-[#0b0f19] rounded-2xl border border-[#374151] p-6 relative group/recipe">
                                        <button onClick={() => handleRemoveRecipe(rid)} className="absolute top-4 right-4 text-gray-600 hover:text-red-500 opacity-0 group-hover/recipe:opacity-100 transition-all"><Trash2 className="w-4 h-4"/></button>
                                        <div className="flex gap-4 items-center"><UtensilsCrossed className="w-4 h-4 text-gray-600"/><input type="text" value={rData.output?.id || ''} onChange={(e) => updateItemField(`config.recipes.${rid}.output.id`, e.target.value)} className="bg-transparent text-white font-bold outline-none border-b border-white/10" placeholder="Resultado (xFoods ID)"/></div>
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
                        <div className="mt-6 pt-6 border-t border-yellow-400/10 animate-in slide-in-from-top-2 duration-300">
                            <div className="border-2 border-dashed border-yellow-400/20 rounded-2xl p-10 text-center hover:border-yellow-400/40 hover:bg-yellow-400/5 transition-all group cursor-pointer">
                                <div className="bg-yellow-400/10 p-4 rounded-full w-fit mx-auto mb-4 group-hover:scale-110 transition-transform"><Upload className="w-8 h-8 text-yellow-400" /></div>
                                <h4 className="text-white font-bold text-sm">Drop Zone</h4>
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
