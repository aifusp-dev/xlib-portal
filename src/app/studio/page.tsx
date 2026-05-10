"use client";

import { useState, useRef } from "react";
import { 
  Upload, 
  FileCode, 
  Download, 
  Plus, 
  FolderSearch,
  CheckCircle2,
  AlertCircle,
  Package,
  ChefHat,
  Sprout,
  Binary
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseUploadedFiles, generateZIP, EcosystemState, stringifyYaml } from "@/lib/studio";

export default function StudioPage() {
  const [projectState, setProjectState] = useState<EcosystemState | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [activeView, setActiveTab] = useState("xfoods");
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

  const handleExport = async () => {
    if (!projectState) return;
    const blob = await generateZIP(projectState);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `xLib_Studio_Project.zip`;
    link.click();
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
            Sube tu carpeta <code className="bg-[#1f2937] px-2 py-1 rounded text-yellow-400">plugins/</code> para empezar a gestionar todo tu ecosistema.
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
              <p className="text-white font-bold text-xl">Seleccionar Carpeta</p>
              <p className="text-gray-500 mt-2">Compatible con xFoods, xCrops e ItemsAdder</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-8 text-[11px] font-bold text-gray-600 uppercase tracking-widest pt-10">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Auto-Parsea YAML</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Gestiona Texturas</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Exporta ZIP</div>
        </div>
      </div>
    );
  }

  const itemsList = activeView === 'xfoods' ? Object.keys(projectState.foods) : Object.keys(projectState.crops);

  return (
    <div className="h-full flex flex-col space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center bg-[#111827] p-6 rounded-2xl border border-[#374151]">
        <div className="flex items-center gap-6">
          <div className="bg-yellow-400 p-2 rounded-lg text-black font-black text-xs">PRO</div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Ecosistema Activo</h2>
            <div className="flex gap-4 mt-1">
               <span className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1.5"><ChefHat className="w-3 h-3"/> {Object.keys(projectState.foods).length} Comidas</span>
               <span className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1.5"><Sprout className="w-3 h-3"/> {Object.keys(projectState.crops).length} Cultivos</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setProjectState(null)}
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
                onClick={() => setActiveTab('xfoods')}
                className={cn("flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all", activeView === 'xfoods' ? "bg-accent text-white" : "text-gray-500 hover:text-gray-300")}
              >xFoods</button>
              <button 
                onClick={() => setActiveTab('xcrops')}
                className={cn("flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all", activeView === 'xcrops' ? "bg-accent text-white" : "text-gray-500 hover:text-gray-300")}
              >xCrops</button>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-yellow-400 hover:bg-white/10 transition-all mb-4">
                 <Plus className="w-4 h-4" /> Crear Nuevo
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
        <main className="col-span-6 bg-[#111827] border border-[#374151] rounded-2xl overflow-y-auto p-8 shadow-2xl">
           {selectedItem ? (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-start border-b border-[#374151] pb-6">
                   <div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">{selectedItem}</h3>
                      <p className="text-gray-500 text-sm mt-1">Editando configuración YAML</p>
                   </div>
                   <div className="bg-yellow-400/10 border border-yellow-400/20 px-3 py-1.5 rounded-lg text-[10px] font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2">
                      <FileCode className="w-3.3 h-3.3" /> Configurada
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">Nombre Display</label>
                      <input 
                        type="text" 
                        value={activeView === 'xfoods' ? projectState.foods[selectedItem]['display-name'] : projectState.crops[selectedItem]['display-name']}
                        className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-yellow-400 outline-none transition-colors"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">Material</label>
                      <input 
                        type="text" 
                        value={activeView === 'xfoods' ? projectState.foods[selectedItem].item?.material : projectState.crops[selectedItem].seed?.material}
                        className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-yellow-400 outline-none transition-colors"
                      />
                   </div>
                </div>

                {/* Simplified visual editor */}
                <div className="bg-[#0b0f19] border border-[#374151] p-10 rounded-2xl text-center space-y-4">
                    <div className="bg-white/5 p-4 rounded-full w-fit mx-auto">
                       <Upload className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-400 text-sm italic">Arrastra una nueva textura o modelo para actualizar ItemsAdder</p>
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
        <section className="col-span-3 bg-black border border-[#374151] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
           <div className="bg-[#111827] px-4 py-3 border-b border-[#374151] flex items-center gap-2">
              <Binary className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Code Preview</span>
           </div>
           <div className="flex-1 p-6 overflow-auto font-mono text-[12px] text-blue-200 leading-relaxed">
              <pre>
                {selectedItem ? (
                  activeView === 'xfoods' ? stringifyYaml(projectState.foods[selectedItem]) : stringifyYaml(projectState.crops[selectedItem])
                ) : "# Selecciona un ítem..."}
              </pre>
           </div>
        </section>
      </div>
    </div>
  );
}
