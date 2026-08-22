"use client";

import { Trash2 } from "lucide-react";
import CommandActionRow from "@/components/CommandActionRow";
import AutocompleteInput from "@/components/AutocompleteInput";
import Field from "@/components/Field";

/** Espejo 1:1 del YAML que lee org.aifusp.dev.xLib.actions.ItemActionsLoader — sin capa de traducción, se serializa tal cual. */
export interface RawActionStep {
  action?: string;
  commands?: string[];
  increment?: { key: string; amount?: number };
  decrement?: { key: string; amount?: number };
  toggle?: { key: string; default?: boolean };
  set?: { key: string; value: number | boolean };
  condition?: { key: string; equals?: boolean; default?: boolean };
}

export type ItemActionsConfig = Record<string, RawActionStep[]>;

type StepKind = "action" | "commands" | "increment" | "decrement" | "toggle" | "set" | "condition";

const TRIGGERS: { key: string; label: string }[] = [
  { key: "right-click-air", label: "Click derecho al aire" },
  { key: "right-click-block", label: "Click derecho a un bloque" },
  { key: "left-click-air", label: "Click izquierdo al aire" },
  { key: "left-click-block", label: "Click izquierdo a un bloque" },
  { key: "shift-right-click-air", label: "Shift + click derecho al aire" },
  { key: "shift-right-click-block", label: "Shift + click derecho a un bloque" },
  { key: "shift-left-click-air", label: "Shift + click izquierdo al aire" },
  { key: "shift-left-click-block", label: "Shift + click izquierdo a un bloque" },
  { key: "right-click-entity", label: "Click derecho a una entidad" },
  { key: "shift-right-click-entity", label: "Shift + click derecho a una entidad" },
  { key: "left-click-entity", label: "Golpear una entidad" },
  { key: "shift-left-click-entity", label: "Shift + golpear una entidad" },
];

const STEP_KINDS: { kind: StepKind; label: string }[] = [
  { kind: "commands", label: "Comandos" },
  { kind: "action", label: "Acción Java" },
  { kind: "increment", label: "Sumar" },
  { kind: "decrement", label: "Restar" },
  { kind: "toggle", label: "Alternar (on/off)" },
  { kind: "set", label: "Fijar valor" },
  { kind: "condition", label: "Condición" },
];

function stepKind(step: RawActionStep): StepKind {
  if (step.commands) return "commands";
  if (step.increment) return "increment";
  if (step.decrement) return "decrement";
  if (step.toggle) return "toggle";
  if (step.set) return "set";
  if (step.condition) return "condition";
  return "action";
}

function emptyStep(kind: StepKind): RawActionStep {
  switch (kind) {
    case "commands": return { commands: [""] };
    case "increment": return { increment: { key: "", amount: 1 } };
    case "decrement": return { decrement: { key: "", amount: 1 } };
    case "toggle": return { toggle: { key: "", default: false } };
    case "set": return { set: { key: "", value: 0 } };
    case "condition": return { condition: { key: "", equals: true, default: false } };
    default: return { action: "" };
  }
}

const inputCls = "w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-yellow-400/50";
const selectCls = "bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white uppercase outline-none cursor-pointer";

interface ItemActionsEditorProps {
  actions: ItemActionsConfig;
  mutate: (fn: (actions: ItemActionsConfig) => void) => void;
  /** Sugerencias de ids de acción Java ya registrados por algún plugin (ver ItemActions.register en Java). */
  actionRefOptions?: string[];
}

export default function ItemActionsEditor({ actions, mutate, actionRefOptions = [] }: ItemActionsEditorProps) {
  const activeTriggers = Object.keys(actions || {});
  const availableTriggers = TRIGGERS.filter((t) => !activeTriggers.includes(t.key));

  const addTrigger = (key: string) => {
    mutate((a) => { a[key] = [emptyStep("commands")]; });
  };
  const removeTrigger = (key: string) => {
    mutate((a) => { delete a[key]; });
  };
  const addStep = (triggerKey: string, kind: StepKind) => {
    mutate((a) => { a[triggerKey] = [...(a[triggerKey] || []), emptyStep(kind)]; });
  };
  const removeStep = (triggerKey: string, index: number) => {
    mutate((a) => { a[triggerKey] = (a[triggerKey] || []).filter((_, i) => i !== index); });
  };
  const setStep = (triggerKey: string, index: number, step: RawActionStep) => {
    mutate((a) => {
      const list = [...(a[triggerKey] || [])];
      list[index] = step;
      a[triggerKey] = list;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{activeTriggers.length} trigger(s)</span>
        {availableTriggers.length > 0 && (
          <select
            value=""
            onChange={(e) => { if (e.target.value) addTrigger(e.target.value); }}
            className="bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase outline-none cursor-pointer"
          >
            <option value="" className="bg-surface-1 text-white">+ Trigger</option>
            {availableTriggers.map((t) => (
              <option key={t.key} value={t.key} className="bg-surface-1 text-white">{t.label}</option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-4">
        {activeTriggers.map((triggerKey) => {
          const label = TRIGGERS.find((t) => t.key === triggerKey)?.label || triggerKey;
          const steps = actions[triggerKey] || [];
          return (
            <div key={triggerKey} className="bg-[#0b0f19] rounded-2xl border border-[#374151] overflow-hidden">
              <div className="bg-white/5 px-6 py-3 flex justify-between items-center border-b border-white/5">
                <span className="text-[11px] font-black text-orange-400 uppercase tracking-widest">{label}</span>
                <button onClick={() => removeTrigger(triggerKey)} className="text-gray-600 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                {steps.map((step, i) => (
                  <StepEditor
                    key={i}
                    step={step}
                    actionRefOptions={actionRefOptions}
                    onChange={(s) => setStep(triggerKey, i, s)}
                    onChangeKind={(k) => setStep(triggerKey, i, emptyStep(k))}
                    onRemove={() => removeStep(triggerKey, i)}
                  />
                ))}
                <div className="flex gap-2 flex-wrap pt-1">
                  {STEP_KINDS.map((sk) => (
                    <button
                      key={sk.kind}
                      onClick={() => addStep(triggerKey, sk.kind)}
                      className="text-[9px] font-black text-blue-400 uppercase hover:text-blue-300 transition-colors bg-blue-500/10 px-2 py-1 rounded"
                    >
                      + {sk.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {activeTriggers.length === 0 && (
          <p className="text-[10px] text-gray-600 italic">Sin acciones: este ítem no hace nada al usarlo todavía.</p>
        )}
      </div>
    </div>
  );
}

function StepEditor({
  step, onChange, onChangeKind, onRemove, actionRefOptions,
}: {
  step: RawActionStep;
  onChange: (s: RawActionStep) => void;
  onChangeKind: (k: StepKind) => void;
  onRemove: () => void;
  actionRefOptions: string[];
}) {
  const kind = stepKind(step);

  return (
    <div className="bg-black/20 rounded-xl border border-white/5 p-3 space-y-2">
      <div className="flex justify-between items-center">
        <select value={kind} onChange={(e) => onChangeKind(e.target.value as StepKind)} className={selectCls}>
          {STEP_KINDS.map((sk) => <option key={sk.kind} value={sk.kind} className="bg-surface-1 text-white">{sk.label}</option>)}
        </select>
        <button onClick={onRemove} className="text-gray-600 hover:text-red-500 transition-colors shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {kind === "action" && (
        <AutocompleteInput
          value={step.action || ""}
          onChange={(v) => onChange({ action: v })}
          options={actionRefOptions}
          placeholder="xfoodscrops:lucky_roll"
          className={inputCls}
        />
      )}

      {kind === "commands" && (
        <div className="space-y-2">
          {(step.commands || []).map((c, i) => (
            <CommandActionRow
              key={i}
              value={c}
              onChange={(raw) => {
                const list = [...(step.commands || [])];
                list[i] = raw;
                onChange({ commands: list });
              }}
              onRemove={() => {
                const list = (step.commands || []).filter((_, idx) => idx !== i);
                onChange({ commands: list.length ? list : [""] });
              }}
            />
          ))}
          <button
            onClick={() => onChange({ commands: [...(step.commands || []), ""] })}
            className="text-[9px] font-black text-blue-400 uppercase hover:text-blue-300 transition-colors"
          >
            + Comando
          </button>
        </div>
      )}

      {(kind === "increment" || kind === "decrement") && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Clave de estado">
            <input
              type="text"
              value={step[kind]?.key || ""}
              onChange={(e) => onChange({ [kind]: { ...step[kind], key: e.target.value } })}
              placeholder="counter"
              className={inputCls}
            />
          </Field>
          <Field label="Cantidad">
            <input
              type="number"
              min={1}
              value={step[kind]?.amount ?? 1}
              onChange={(e) => onChange({ [kind]: { ...step[kind], amount: parseInt(e.target.value) || 1 } })}
              className={inputCls}
            />
          </Field>
        </div>
      )}

      {kind === "toggle" && (
        <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
          <Field label="Clave de estado">
            <input
              type="text"
              value={step.toggle?.key || ""}
              onChange={(e) => onChange({ toggle: { ...step.toggle, key: e.target.value } })}
              placeholder="enabled"
              className={inputCls}
            />
          </Field>
          <label className="flex items-center gap-2 pb-2 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={step.toggle?.default ?? false}
              onChange={(e) => onChange({ toggle: { ...step.toggle, key: step.toggle?.key || "", default: e.target.checked } })}
            />
            <span className="text-[9px] text-gray-500 uppercase font-bold">Empieza encendido</span>
          </label>
        </div>
      )}

      {kind === "set" && <SetStepFields step={step} onChange={onChange} />}

      {kind === "condition" && (
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-end">
          <Field label="Clave de estado">
            <input
              type="text"
              value={step.condition?.key || ""}
              onChange={(e) => onChange({ condition: { ...step.condition, key: e.target.value } })}
              placeholder="enabled"
              className={inputCls}
            />
          </Field>
          <label className="flex items-center gap-2 pb-2 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={step.condition?.equals ?? true}
              onChange={(e) => onChange({ condition: { ...step.condition, key: step.condition?.key || "", equals: e.target.checked } })}
            />
            <span className="text-[9px] text-gray-500 uppercase font-bold">Debe estar en true</span>
          </label>
          <label className="flex items-center gap-2 pb-2 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={step.condition?.default ?? false}
              onChange={(e) => onChange({ condition: { ...step.condition, key: step.condition?.key || "", default: e.target.checked } })}
            />
            <span className="text-[9px] text-gray-500 uppercase font-bold">Default si no existe</span>
          </label>
        </div>
      )}

      <p className="text-[9px] text-gray-600 italic">
        {kind === "condition" && "Si no se cumple, corta el resto de pasos de este trigger (no hace nada más, pero el click sigue quedando \"gestionado\")."}
        {kind === "action" && "Id de una acción ya registrada en Java por algún plugin (ver ItemActions.register)."}
      </p>
    </div>
  );
}

function SetStepFields({ step, onChange }: { step: RawActionStep; onChange: (s: RawActionStep) => void }) {
  const isBool = typeof step.set?.value === "boolean";

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
      <Field label="Clave de estado">
        <input
          type="text"
          value={step.set?.key || ""}
          onChange={(e) => onChange({ set: { key: e.target.value, value: step.set?.value ?? 0 } })}
          placeholder="counter"
          className={inputCls}
        />
      </Field>
      <label className="flex items-center gap-2 pb-2 cursor-pointer whitespace-nowrap">
        <input
          type="checkbox"
          checked={isBool}
          onChange={(e) => onChange({ set: { key: step.set?.key || "", value: e.target.checked ? false : 0 } })}
        />
        <span className="text-[9px] text-gray-500 uppercase font-bold">Booleano</span>
      </label>
      {isBool ? (
        <select
          value={String(step.set?.value)}
          onChange={(e) => onChange({ set: { key: step.set?.key || "", value: e.target.value === "true" } })}
          className={inputCls}
        >
          <option value="true" className="bg-surface-1 text-white">true</option>
          <option value="false" className="bg-surface-1 text-white">false</option>
        </select>
      ) : (
        <input
          type="number"
          value={typeof step.set?.value === "number" ? step.set.value : 0}
          onChange={(e) => onChange({ set: { key: step.set?.key || "", value: parseInt(e.target.value) || 0 } })}
          className={inputCls}
        />
      )}
    </div>
  );
}
