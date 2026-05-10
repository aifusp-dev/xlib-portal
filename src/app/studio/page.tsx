"use client";

import { useState } from "react";
import { 
  Upload, 
  FileJson, 
  ImageIcon, 
  FileCode, 
  Download, 
  Plus, 
  Trash2, 
  Package 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateZIP, stringifyYaml } from "@/lib/studio";

export default function StudioPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("xfoods");
  const [iaEnabled, setIaEnabled] = useState(false);
  
  // Base State for a new item
  const [foodData, setFoodData] = useState({
    id: "hamburguesa_custom",
    name: "&6Hamburguesa Especial",
    mat: "BREAD",
    bites: 1,
    lore: "Una hamburguesa deliciosa.\nCreada en xLib Studio.",
    consumable: true
  });

  const generateXFoodsYaml = () => {
    const yamlObj = {
      "display-name": foodData.name,
      "lore": foodData.lore.split("\n").map(l => l.trim()),
      "item": {
        "material": foodData.mat,
        "custom-model-data": 0,
        ...(iaEnabled ? { "itemsadder-id": `xLib:${foodData.id}` } : {})
      },
      "stats": {
        "food-level": 4,
        "saturation": 2.0,
        "bites": foodData.bites,
        "consumable": foodData.consumable
      }
    };
    return stringifyYaml(yamlObj);
  };

  const handleDownload = async () => {
    // Implement ZIP generation logic with jszip
    alert("Función de descarga masiva en desarrollo. Copia el código por ahora.");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Pro</h1>
          <p className="text-gray-400 mt-1">Configuración unificada y exportación inteligente.</p>
        </div>
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 bg-accent text-white px-6 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-accent/20"
        >
          <Package className="w-4 h-4" /> Exportar Ecosistema (.zip)
        </button>
      </header>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Form Area */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#111827] border border-[#374151] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#374151] bg-[#1f2937]/30 flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase tracking-widest text-yellow-400">Constructor de Ítem</h3>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-gray-500 font-bold uppercase">ItemsAdder</span>
                <label className="switch">
                  <input type="checkbox" checked={iaEnabled} onChange={(e) => setIaEnabled(e.target.checked)} />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase px-1">ID Único</label>
                  <input 
                    type="text" 
                    value={foodData.id}
                    onChange={(e) => setFoodData({...foodData, id: e.target.value})}
                    className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-yellow-400 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase px-1">Nombre Visual</label>
                  <input 
                    type="text" 
                    value={foodData.name}
                    onChange={(e) => setFoodData({...foodData, name: e.target.value})}
                    className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-yellow-400 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase px-1">Material</label>
                  <input 
                    type="text" 
                    value={foodData.mat}
                    onChange={(e) => setFoodData({...foodData, mat: e.target.value})}
                    className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-yellow-400 outline-none transition-colors text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase px-1">Bites</label>
                  <input 
                    type="number" 
                    value={foodData.bites}
                    onChange={(e) => setFoodData({...foodData, bites: parseInt(e.target.value)})}
                    className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-yellow-400 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2 flex flex-col justify-center items-center bg-[#0b0f19] rounded-xl border border-[#374151]">
                   <label className="text-[10px] font-bold text-gray-500 uppercase mb-1">Consumible</label>
                   <input type="checkbox" checked={foodData.consumable} onChange={(e) => setFoodData({...foodData, consumable: e.target.checked})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase px-1">Descripción (Lore)</label>
                <textarea 
                  rows={4}
                  value={foodData.lore}
                  onChange={(e) => setFoodData({...foodData, lore: e.target.value})}
                  className="w-full bg-[#0b0f19] border border-[#374151] rounded-xl px-4 py-3 text-white focus:border-yellow-400 outline-none transition-colors resize-none text-sm leading-relaxed"
                />
              </div>

              {iaEnabled && (
                <div className="pt-4 animate-in slide-in-from-top-4 duration-300">
                  <div className="border-2 border-dashed border-[#374151] rounded-2xl p-10 text-center hover:border-yellow-400/50 transition-all group cursor-pointer">
                    <div className="bg-yellow-400/10 p-4 rounded-full w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-yellow-400" />
                    </div>
                    <h4 className="text-white font-bold">ItemsAdder Drop Zone</h4>
                    <p className="text-gray-400 text-xs mt-2 max-w-[200px] mx-auto leading-relaxed">
                      Arrastra las texturas (.png) o modelos (.json) para generar las rutas automáticamente.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-8">
          <div className="bg-[#000] border border-[#374151] rounded-2xl overflow-hidden flex flex-col h-[600px] shadow-2xl">
            <div className="bg-[#111827] px-4 py-2 border-b border-[#374151] flex gap-2">
              <button 
                onClick={() => setActiveTab("xfoods")}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                  activeTab === "xfoods" ? "bg-accent text-white" : "text-gray-500 hover:text-white"
                )}
              >
                xFoods Config
              </button>
              <button 
                disabled={!iaEnabled}
                onClick={() => setActiveTab("ia")}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-30",
                  activeTab === "ia" ? "bg-accent text-white" : "text-gray-500 hover:text-white"
                )}
              >
                ItemsAdder YAML
              </button>
            </div>
            <div className="flex-1 p-6 overflow-auto font-mono text-[13px] leading-relaxed text-blue-300">
              <pre>
                {activeTab === "xfoods" ? generateXFoodsYaml() : "# Activa IA para ver el código..."}
              </pre>
            </div>
            <div className="p-4 bg-[#111827] border-t border-[#374151]">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(generateXFoodsYaml());
                  alert("Código copiado");
                }}
                className="w-full bg-[#1f2937] hover:bg-[#374151] text-white py-2.5 rounded-xl text-xs font-bold transition-all border border-[#374151]"
              >
                Copiar al Portapapeles
              </button>
            </div>
          </div>

          <div className="bg-yellow-400/5 border border-yellow-400/20 p-6 rounded-2xl">
            <div className="flex gap-4 items-start">
              <Package className="w-5 h-5 text-yellow-400 shrink-0 mt-1" />
              <div>
                <h4 className="text-sm font-bold text-white">Ecosistema xLib v2</h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Todas las configuraciones generadas aquí son compatibles con el namespace <b>xLib</b> y están optimizadas para servidores Paper 1.21+.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
