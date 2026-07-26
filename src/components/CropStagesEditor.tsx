"use client";

import { Trash2, Plus } from "lucide-react";
import { sanitizePath } from "@/lib/studio";
import Field from "@/components/Field";

interface StageRequirement {
  type?: 'NUTRIENT' | 'LIGHT';
  chance?: number;
  nbt?: string;
  light?: { min?: number; max?: number };
  'display-name'?: string;
  'action-bar'?: string;
}

interface GrowthStage {
  material?: string;
  'itemsadder-id'?: string;
  scale?: number;
  'y-offset'?: number;
  duration?: number;
  requirements?: Record<string, StageRequirement>;
}

interface CropStagesEditorProps {
  stages: Record<string, GrowthStage>;
  // El editor no conoce la forma completa del config del cultivo: recibe un mutador
  // que ya apunta a growth.stages (creándolo si hace falta) y solo pide operar sobre él.
  mutate: (fn: (stages: Record<string, GrowthStage>) => void) => void;
}

const inputCls = "w-full bg-black/20 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-yellow-400/50";

export default function CropStagesEditor({ stages, mutate }: CropStagesEditorProps) {
  const addStage = () => {
    mutate((s) => {
      const id = `stage${Object.keys(s).length}`;
      s[id] = { material: "FERN", scale: 1.0, 'y-offset': 0.1, duration: 60, requirements: {} };
    });
  };

  const removeStage = (id: string) => {
    mutate((s) => { delete s[id]; });
  };

  const setStageField = (id: string, field: keyof GrowthStage, value: unknown) => {
    mutate((s) => { (s[id] as Record<string, unknown>)[field] = value; });
  };

  const addRequirement = (stageId: string) => {
    const raw = prompt("ID del requisito (ej: water, light_check):");
    if (!raw) return;
    const rid = sanitizePath(raw);
    mutate((s) => {
      if (!s[stageId].requirements) s[stageId].requirements = {};
      if (s[stageId].requirements![rid]) { alert("Ya existe un requisito con ese ID en esta etapa."); return; }
      s[stageId].requirements![rid] = { type: 'NUTRIENT', chance: 1.0, nbt: 'WATER', 'display-name': 'Agua', 'action-bar': '&bHecho.' };
    });
  };

  const removeRequirement = (stageId: string, reqId: string) => {
    mutate((s) => { delete s[stageId].requirements?.[reqId]; });
  };

  const setRequirementField = (stageId: string, reqId: string, field: 'chance' | 'nbt' | 'display-name' | 'action-bar' | 'light.min' | 'light.max', value: unknown) => {
    mutate((s) => {
      const req = s[stageId].requirements![reqId];
      if (field === 'light.min' || field === 'light.max') {
        if (!req.light) req.light = { min: 0, max: 15 };
        if (field === 'light.min') req.light.min = value as number;
        else req.light.max = value as number;
      } else if (field === 'chance') {
        req.chance = value as number;
      } else if (field === 'nbt') {
        req.nbt = value as string;
      } else if (field === 'display-name') {
        req['display-name'] = value as string;
      } else {
        req['action-bar'] = value as string;
      }
    });
  };

  const setRequirementType = (stageId: string, reqId: string, type: 'NUTRIENT' | 'LIGHT') => {
    mutate((s) => {
      const req = s[stageId].requirements![reqId];
      req.type = type;
      if (type === 'LIGHT') {
        delete req.nbt;
        if (!req.light) req.light = { min: 8, max: 15 };
      } else {
        delete req.light;
        if (!req.nbt) req.nbt = 'WATER';
      }
    });
  };

  const stageEntries = Object.entries(stages || {});

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{stageEntries.length} etapa(s)</span>
        <button onClick={addStage} className="flex items-center gap-1 text-[10px] font-black uppercase bg-green-500/10 text-green-500 px-3 py-1.5 rounded-lg border border-green-500/20 hover:bg-green-500/20 transition-colors">
          <Plus className="w-3 h-3" /> Nueva Etapa
        </button>
      </div>

      <div className="space-y-4">
        {stageEntries.map(([sid, stage]) => (
          <div key={sid} className="bg-[#0b0f19] rounded-2xl border border-[#374151] overflow-hidden">
            <div className="bg-white/5 px-6 py-3 flex justify-between items-center border-b border-white/5">
              <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">{sid}</span>
              <button onClick={() => removeStage(sid)} className="text-gray-600 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <Field label="Material">
                  <input type="text" value={stage.material || ''} onChange={(e) => setStageField(sid, 'material', e.target.value)} className={inputCls} />
                </Field>
                <Field label="ItemsAdder ID">
                  <input type="text" value={stage['itemsadder-id'] || ''} onChange={(e) => setStageField(sid, 'itemsadder-id', e.target.value)} placeholder="opcional" className={inputCls} />
                </Field>
                <Field label="Escala">
                  <input type="number" step="0.1" value={stage.scale ?? 1.0} onChange={(e) => setStageField(sid, 'scale', parseFloat(e.target.value))} className={inputCls} />
                </Field>
                <Field label="Offset Y">
                  <input type="number" step="0.1" value={stage['y-offset'] ?? 0.1} onChange={(e) => setStageField(sid, 'y-offset', parseFloat(e.target.value))} className={inputCls} />
                </Field>
              </div>
              <div className="max-w-[180px]">
                <Field label="Duración (segundos)">
                  <input type="number" value={stage.duration ?? 60} onChange={(e) => setStageField(sid, 'duration', parseInt(e.target.value))} className={inputCls} />
                </Field>
              </div>

              <div className="pt-3 border-t border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Requisitos de esta etapa</span>
                  <button onClick={() => addRequirement(sid)} className="text-[9px] font-black text-blue-400 uppercase hover:text-blue-300 transition-colors">+ Requisito</button>
                </div>

                {Object.entries(stage.requirements || {}).map(([rid, req]) => (
                  <div key={rid} className="bg-black/20 rounded-xl border border-white/5 p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">{rid}</span>
                      <button onClick={() => removeRequirement(sid, rid)} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Tipo">
                        <select value={req.type || 'NUTRIENT'} onChange={(e) => setRequirementType(sid, rid, e.target.value as 'NUTRIENT' | 'LIGHT')} className={inputCls}>
                          <option value="NUTRIENT">NUTRIENT</option>
                          <option value="LIGHT">LIGHT</option>
                        </select>
                      </Field>
                      <Field label="Probabilidad (0-1)">
                        <input type="number" step="0.05" min={0} max={1} value={req.chance ?? 1} onChange={(e) => setRequirementField(sid, rid, 'chance', parseFloat(e.target.value))} className={inputCls} />
                      </Field>
                      {req.type === 'LIGHT' ? (
                        <div className="grid grid-cols-2 gap-2">
                          <Field label="Luz Min">
                            <input type="number" min={0} max={15} value={req.light?.min ?? 8} onChange={(e) => setRequirementField(sid, rid, 'light.min', parseInt(e.target.value))} className={inputCls} />
                          </Field>
                          <Field label="Luz Max">
                            <input type="number" min={0} max={15} value={req.light?.max ?? 15} onChange={(e) => setRequirementField(sid, rid, 'light.max', parseInt(e.target.value))} className={inputCls} />
                          </Field>
                        </div>
                      ) : (
                        <Field label="NBT Requerido">
                          <input type="text" value={req.nbt || ''} onChange={(e) => setRequirementField(sid, rid, 'nbt', e.target.value)} placeholder="WATER / organic / chemical" className={inputCls} />
                        </Field>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Nombre Mostrado">
                        <input type="text" value={req['display-name'] || ''} onChange={(e) => setRequirementField(sid, rid, 'display-name', e.target.value)} className={inputCls} />
                      </Field>
                      <Field label="Mensaje Action Bar">
                        <input type="text" value={req['action-bar'] || ''} onChange={(e) => setRequirementField(sid, rid, 'action-bar', e.target.value)} className={inputCls} />
                      </Field>
                    </div>
                  </div>
                ))}

                {Object.keys(stage.requirements || {}).length === 0 && (
                  <p className="text-[10px] text-gray-600 italic">Sin requisitos: la planta avanza sola con el tiempo en esta etapa.</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {stageEntries.length === 0 && (
          <p className="text-[10px] text-gray-600 italic">Sin etapas: la planta nunca crecerá. Añade al menos una.</p>
        )}
      </div>
    </div>
  );
}
