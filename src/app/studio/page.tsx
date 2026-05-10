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
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseUploadedFiles, EcosystemState, stringifyYaml } from "@/lib/studio";
import { exportEcosystem } from "@/lib/export";

export default function StudioPage() {
  const [projectState, setProjectState] = useState<EcosystemState | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [activeView, setActiveView] = useState<'xfoods' | 'xcrops'>("xfoods");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
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
    const newId = activeView === 'xfoods' ? `nueva_comida_${timestamp}` : `nuevo_cultivo_${timestamp}`;
    
    const newState = { ...projectState };
    if (activeView === 'xfoods') {
      newState.foods[newId] = {
        "display-name": "&eNueva Comida",
        "lore": ["&7Descripción de la comida."],
        "item": { "material": "PORKCHOP", "custom-model-data": 0 },
        "stats": { "food-level": 4, "saturation": 2.0, "bites": 1, "consumable": true, "max-stack": 64, "expiry-minutes": 0 },
        "nutrition": { "proteins": 0, "carbs": 0, "sugars": 0, "vitamins": 0 }
      };
    } else {
      newState.crops[newId] = {
        "display-name": "Nuevo Cultivo",
        "seed": { "material": "WHEAT_SEEDS", "display-name": "&aSemilla", "lore": ["&7Semilla de cultivo."], "custom-model-data": 0 },
        "growth": { "wither-time": 2400, "stages": { "stage0": { "material": "FERN", "scale": 1.0, "y-offset": 0.1, "duration": 60 } } },
        "harvest": { "xfoods-id": "apple", "amount": 1, "message": "&a¡Has cosechado!" },
        "visuals": { "hologram-title": "&fCultivo" },
        "requirements": { "seed-nbt": newId }
      };
    }
    
    setProjectState(newState);
    setSelectedItem(newId);
  };

  const updateItemField = (path: string, value: any) => {
    if (!projectState || !selectedItem) return;
    const newState = { ...projectState };
    const item = activeView === 'xfoods' ? newState.foods[selectedItem] : newState.crops[selectedItem];
    
    const keys = path.split('.');
    let current = item;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    // Special logic for lore splitting
    if (path.endsWith('.lore') && typeof value === 'string') {
        current[keys[keys.length - 1]] = value.split('\n').map(l => l.trim());
    }

    setProjectState(newState);
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
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            Sube tu carpeta de proyecto de <code className="bg-[#1f2937] px-2 py-1 rounded text-yellow-400">ItemsAdder/contents/</code> para empezar a gestionar todo tu ecosistema.
          </p>
        </div>

        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#374151] rounded-3xl p-20 hover:border-yellow-400/50 hover:bg-yellow-400/5 transition-all cursor-pointer group"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFolderUpload} 
            className="hidden" 
            {...({ webkitdirectory: "", directory: "" } as any)} 
          />
          <div className="space-y-6">
            <div className="bg-white/5 p-5 rounded-2xl w-fit mx-auto group-hover:scale-110 transition-transform duration-300">
              <Upload className="w-10 h-10 text-gray-400 group-hover:text-yellow-400" />
            </div>
            <div>
              <p className="text-white font-bold text-xl">Seleccionar Carpeta de Proyecto</p>
              <p className="text-gray-500 mt-2">Sube la carpeta de tu namespace dentro de contents/</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const itemsList = activeView === 'xfoods' ? Object.keys(projectState.foods) : Object.keys(projectState.crops);
  const currentItemData = selectedItem ? (activeView === 'xfoods' ? projectState.foods[selectedItem] : projectState.crops[selectedItem]) : null;
  const isIAEnabled = currentItemData ? (activeView === 'xfoods' ? !!currentItemData.item?.['itemsadder-id'] : !!currentItemData.seed?.['itemsadder-id']) : false;

  return (
    <div className="h-full flex flex-col space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center bg-[#111827] p-6 rounded-2xl border border-[#374151]">
        <div className="flex items-center gap-6">
          <div className="bg-yellow-400 p-2 rounded-lg text-black font-black text-xs">PRO</div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Ecosistema: <span className="text-yellow-400">{projectState.projectName}</span></h2>
            <div className="flex gap-4 mt-1">
               <span className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1.5"><ChefHat className="w-3 h-3"/> {Object.keys(projectState.foods).length} Comidas</span>
               <span className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1.5"><Sprout className="w-3 h-3"/> {Object.keys(projectState.crops).length} Cultivos</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setProjectState(null); setSelectedItem(null); }}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-colors"
          >
            Cerrar Proyecto
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-yellow-400 text-black px-8 py-2.5 rounded-xl font-bold hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-400/20"
          >
            <Download className="w-4 h-4" /> Descargar Todo (.zip)
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
        {/* Navigation / List */}
        <aside className="col-span-3 bg-[#111827] border border-[#374151] rounded-2xl flex flex-col overflow-hidden shadow-xl">
           <div className="p-4 border-b border-[#374151] flex gap-2">
              <button 
                onClick={() => { setActiveView('xfoods'); setSelectedItem(null); }}
                className={cn("flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all", activeView === 'xfoods' ? "bg-accent text-white" : "text-gray-500 hover:text-gray-300")}
              >xFoods</button>
              <button 
                onClick={() => { setActiveView('xcrops'); setSelectedItem(null); }}
                className={cn("flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all", activeView === 'xcrops' ? "bg-accent text-white" : "text-gray-500 hover:text-gray-300")}
              >xCrops</button>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <button 
                onClick={handleCreateNew}
                className="w-full flex items-center gap-3 px-4 py-3 bg-yellow-400/5 border border-yellow-400/20 rounded-xl text-xs font-bold text-yellow-400 hover:bg-yellow-400/10 transition-all mb-4"
              >
                 <Plus className="w-4 h-4" /> Crear {activeView === 'xfoods' ? 'Comida' : 'Cultivo'}
              </button>
              {itemsList.map(id => (
                <div 
                  key={id}
                  onClick={() => setSelectedItem(id)}
                  className={cn(
                    "px-4 py-3 rounded-xl text-xs font-medium cursor-pointer transition-all border",
                    selectedItem === id ? "bg-yellow-400/10 border-yellow-400/50 text-white" : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  )}
                >
                  {id}
                </div>
              ))}
           </div>
        </aside>

        {/* Editor Area */}
        <main className="col-span-6 bg-[#111827] border border-[#374151] rounded-2xl overflow-y-auto p-8 shadow-2xl space-y-8">
           {selectedItem && currentItemData ? (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-8 pb-10">
                <div className="flex justify-between items-start border-b border-[#374151] pb-6">
                   <div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">{selectedItem}</h3>
                      <p className="text-gray-500 text-sm mt-1">Configuración Maestro v2</p>
                   </div>
                   <div className="bg-yellow-400/10 border border-yellow-400/20 px-3 py-1.5 rounded-lg text-[10px] font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2">
                      <FileCode className="w-3.3 h-3.3" /> Editando
                   </div>
                </div>

                {/* GENERAL INFO */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-yellow-400">
                        <Info className="w-4 h-4" />
                        <h4 className="text-xs font-black uppercase tracking-widest">Información General</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">Nombre Display</label>
                        <input 
                            type="text" 
                            value={currentItemData['display-name'] || ''}
                            onChange={(e) => updateItemField('display-name', e.target.value)}
                            className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-yellow-400 outline-none transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">Material {activeView === 'xcrops' ? '(Semilla)' : ''}</label>
                        <input 
                            type="text" 
                            value={(activeView === 'xfoods' ? currentItemData.item?.material : currentItemData.seed?.material) || ''}
                            onChange={(e) => updateItemField(activeView === 'xfoods' ? 'item.material' : 'seed.material', e.target.value)}
                            className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-yellow-400 outline-none transition-colors"
                        />
                    </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">Descripción (Lore)</label>
                        <textarea 
                            rows={3}
                            value={Array.isArray(activeView === 'xfoods' ? currentItemData.lore : currentItemData.seed?.lore) ? (activeView === 'xfoods' ? currentItemData.lore : currentItemData.seed?.lore).join('\n') : ''}
                            onChange={(e) => updateItemField(activeView === 'xfoods' ? 'lore' : 'seed.lore', e.target.value)}
                            className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-yellow-400 outline-none transition-colors resize-none text-sm leading-relaxed"
                            placeholder="Una línea por cada reglón..."
                        />
                    </div>
                </div>

                {/* XFOODS SPECIFIC STATS */}
                {activeView === 'xfoods' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-yellow-400">
                            <TrendingUp className="w-4 h-4" />
                            <h4 className="text-xs font-black uppercase tracking-widest">Estadísticas de Consumo</h4>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Nutrición</label>
                                <input type="number" value={currentItemData.stats?.['food-level'] || 0} onChange={(e) => updateItemField('stats.food-level', parseInt(e.target.value))} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-2 text-white outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Saturación</label>
                                <input type="number" step="0.1" value={currentItemData.stats?.saturation || 0} onChange={(e) => updateItemField('stats.saturation', parseFloat(e.target.value))} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-2 text-white outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Bites</label>
                                <input type="number" value={currentItemData.stats?.bites || 1} onChange={(e) => updateItemField('stats.bites', parseInt(e.target.value))} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-2 text-white outline-none" />
                            </div>
                            <div className="space-y-2 flex flex-col justify-center items-center bg-[#0b0f19] rounded-xl border border-[#374151]">
                                <label className="text-[9px] font-black text-gray-500 uppercase mb-1">Consumible</label>
                                <input type="checkbox" checked={currentItemData.stats?.consumable !== false} onChange={(e) => updateItemField('stats.consumable', e.target.checked)} />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-yellow-400">
                            <Apple className="w-4 h-4" />
                            <h4 className="text-xs font-black uppercase tracking-widest">Información Nutricional</h4>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151] space-y-2">
                                <label className="text-[9px] font-bold text-gray-600 uppercase">Proteínas</label>
                                <input type="number" value={currentItemData.nutrition?.proteins || 0} onChange={(e) => updateItemField('nutrition.proteins', parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" />
                            </div>
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151] space-y-2">
                                <label className="text-[9px] font-bold text-gray-600 uppercase">Carbohidratos</label>
                                <input type="number" value={currentItemData.nutrition?.carbs || 0} onChange={(e) => updateItemField('nutrition.carbs', parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" />
                            </div>
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151] space-y-2">
                                <label className="text-[9px] font-bold text-gray-600 uppercase">Azúcares</label>
                                <input type="number" value={currentItemData.nutrition?.sugars || 0} onChange={(e) => updateItemField('nutrition.sugars', parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" />
                            </div>
                            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#374151] space-y-2">
                                <label className="text-[9px] font-bold text-gray-600 uppercase">Vitaminas</label>
                                <input type="number" value={currentItemData.nutrition?.vitamins || 0} onChange={(e) => updateItemField('nutrition.vitamins', parseInt(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none" />
                            </div>
                        </div>
                    </div>
                )}

                {/* XCROPS SPECIFIC STATS */}
                {activeView === 'xcrops' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-yellow-400">
                            <Zap className="w-4 h-4" />
                            <h4 className="text-xs font-black uppercase tracking-widest">Crecimiento y Cosecha</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">Título Holograma</label>
                                <input type="text" value={currentItemData.visuals?.['hologram-title'] || ''} onChange={(e) => updateItemField('visuals.hologram-title', e.target.value)} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">Tiempo Marchitamiento (seg)</label>
                                <input type="number" value={currentItemData.growth?.['wither-time'] || 2400} onChange={(e) => updateItemField('growth.wither-time', parseInt(e.target.value))} className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white outline-none" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6 bg-[#0b0f19] p-6 rounded-2xl border border-[#374151]">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Ítem de Cosecha (ID)</label>
                                <input type="text" value={currentItemData.harvest?.['xfoods-id'] || ''} onChange={(e) => updateItemField('harvest.xfoods-id', e.target.value)} className="w-full bg-[#111827] border border-[#374151] rounded-lg px-3 py-2 text-white text-xs outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Cantidad</label>
                                <input type="number" value={currentItemData.harvest?.amount || 1} onChange={(e) => updateItemField('harvest.amount', parseInt(e.target.value))} className="w-full bg-[#111827] border border-[#374151] rounded-lg px-3 py-2 text-white text-xs outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Mensaje Cosecha</label>
                                <input type="text" value={currentItemData.harvest?.message || ''} onChange={(e) => updateItemField('harvest.message', e.target.value)} className="w-full bg-[#111827] border border-[#374151] rounded-lg px-3 py-2 text-white text-xs outline-none" />
                            </div>
                        </div>
                    </div>
                )}

                {/* ItemsAdder Toggle */}
                <div className={cn("p-6 rounded-2xl border transition-all", isIAEnabled ? "bg-yellow-400/5 border-yellow-400/20" : "bg-white/2 border-white/5")}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Settings2 className={cn("w-5 h-5", isIAEnabled ? "text-yellow-400" : "text-gray-600")} />
                            <div>
                                <h4 className="text-sm font-bold text-white">Integración ItemsAdder</h4>
                                <p className="text-[11px] text-gray-500 uppercase font-medium">Texturas y Modelos Custom</p>
                            </div>
                        </div>
                        <label className="switch">
                            <input type="checkbox" checked={isIAEnabled} onChange={(e) => updateItemField('ia-toggle', e.target.checked)} />
                            <span className="slider"></span>
                        </label>
                    </div>

                    {isIAEnabled && (
                        <div className="mt-6 pt-6 border-t border-yellow-400/10 animate-in slide-in-from-top-2 duration-300">
                            <div className="border-2 border-dashed border-yellow-400/20 rounded-2xl p-10 text-center hover:border-yellow-400/40 hover:bg-yellow-400/5 transition-all group cursor-pointer">
                                <div className="bg-yellow-400/10 p-4 rounded-full w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <Upload className="w-8 h-8 text-yellow-400" />
                                </div>
                                <h4 className="text-white font-bold text-sm">Drop Zone</h4>
                                <p className="text-gray-500 text-xs mt-2 max-w-[200px] mx-auto leading-relaxed">
                                    Suelta tu .png o .json para vincularlo a este ítem.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
             </div>
           ) : (
             <div className="h-full flex items-center justify-center text-center opacity-50 grayscale scale-95 transition-all">
                <div className="space-y-4">
                   <Package className="w-20 h-20 mx-auto text-gray-700" />
                   <p className="text-gray-600 font-bold uppercase tracking-widest">Selecciona un elemento para editar</p>
                </div>
             </div>
           )}
        </main>

        {/* Code Preview */}
        <section className="col-span-3 bg-black border border-[#374151] rounded-2xl overflow-hidden flex flex-col shadow-2xl lg:sticky lg:top-0 h-fit max-h-[90vh]">
           <div className="bg-[#111827] px-4 py-3 border-b border-[#374151] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Binary className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Code Preview</span>
              </div>
              <div className="text-[9px] font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20 uppercase">YAML</div>
           </div>
           <div className="flex-1 p-6 overflow-auto font-mono text-[12px] text-blue-200 leading-relaxed scrollbar-hide">
              <pre className="whitespace-pre-wrap break-words">
                {selectedItem && currentItemData ? (
                  stringifyYaml(currentItemData)
                ) : "# Selecciona un ítem..."}
              </pre>
           </div>
           <div className="p-4 bg-[#111827] border-t border-[#374151]">
              <button 
                onClick={() => {
                  if (selectedItem && currentItemData) {
                    navigator.clipboard.writeText(stringifyYaml(currentItemData));
                    alert("YAML copiado al portapapeles");
                  }
                }}
                className="w-full bg-[#1f2937] hover:bg-[#374151] text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-[#374151]"
              >
                Copiar Configuración
              </button>
           </div>
        </section>
      </div>
    </div>
  );
}
