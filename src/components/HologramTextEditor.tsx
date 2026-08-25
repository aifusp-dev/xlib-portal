"use client";

import { useRef, useState } from "react";
import { Bold, Italic, Underline, Strikethrough, Sparkles, Eraser } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseFormattedText } from "@/lib/hologramText";

interface HologramTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

const toolBtnCls = "flex items-center justify-center w-7 h-7 rounded-md text-gray-300 hover:bg-white/10 hover:text-white transition-colors";
const swatchCls = "w-6 h-6 rounded cursor-pointer bg-transparent border border-white/20 p-0";

/**
 * Editor de texto de hologramas: en vez de tener que memorizar códigos "&" o tags de
 * MiniMessage a mano, una barra de herramientas envuelve la selección actual (o todo el texto,
 * si no hay selección) con la etiqueta correspondiente — color, negrita/cursiva/subrayado/tachado,
 * degradado o arcoíris — y debajo hay una vista previa en vivo (ver {@link parseFormattedText}).
 * <p>
 * El valor sigue siendo un string plano (líneas separadas por "\n", igual que antes): esto es un
 * envoltorio sobre un {@code textarea} normal, no cambia el formato que guarda el Studio ni lo
 * que lee {@code HologramTemplateLoader.java} — sigue siendo MiniMessage/legacy tal cual.
 */
export default function HologramTextEditor({ value, onChange, rows = 4, placeholder }: HologramTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const [color, setColor] = useState("#55ffff");
  const [gradientA, setGradientA] = useState("#ff5555");
  const [gradientB, setGradientB] = useState("#5555ff");

  const trackSelection = () => {
    const el = textareaRef.current;
    if (!el) return;
    selectionRef.current = { start: el.selectionStart, end: el.selectionEnd };
  };

  const wrapSelection = (open: string, close: string) => {
    const el = textareaRef.current;
    const { start, end } = selectionRef.current;
    const hasSelection = end > start;
    const from = hasSelection ? start : 0;
    const to = hasSelection ? end : value.length;

    const next = value.slice(0, from) + open + value.slice(from, to) + close + value.slice(to);
    onChange(next);

    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const newFrom = from + open.length;
      const newTo = newFrom + (to - from);
      el.setSelectionRange(newFrom, newTo);
      selectionRef.current = { start: newFrom, end: newTo };
    });
  };

  const clearFormatting = () => {
    const { start, end } = selectionRef.current;
    const hasSelection = end > start;
    const from = hasSelection ? start : 0;
    const to = hasSelection ? end : value.length;
    const cleaned = value.slice(from, to)
      .replace(/<\/?[a-z0-9_#:]+>/gi, "")
      .replace(/&[0-9a-fklmnor]/gi, "");
    onChange(value.slice(0, from) + cleaned + value.slice(to));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 bg-black/30 border border-white/10 rounded-lg p-2">
        <div className="flex items-center gap-1">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className={swatchCls} title="Elegir color" />
          <button onClick={() => wrapSelection(`<${color}>`, "</color>")} className={cn(toolBtnCls, "w-auto px-2 text-[10px] font-black uppercase")} title="Aplicar color a la selección">
            Color
          </button>
        </div>

        <div className="w-px h-5 bg-white/10" />

        <div className="flex items-center gap-0.5">
          <button onClick={() => wrapSelection("<bold>", "</bold>")} className={toolBtnCls} title="Negrita"><Bold className="w-3.5 h-3.5" /></button>
          <button onClick={() => wrapSelection("<italic>", "</italic>")} className={toolBtnCls} title="Cursiva"><Italic className="w-3.5 h-3.5" /></button>
          <button onClick={() => wrapSelection("<underlined>", "</underlined>")} className={toolBtnCls} title="Subrayado"><Underline className="w-3.5 h-3.5" /></button>
          <button onClick={() => wrapSelection("<strikethrough>", "</strikethrough>")} className={toolBtnCls} title="Tachado"><Strikethrough className="w-3.5 h-3.5" /></button>
        </div>

        <div className="w-px h-5 bg-white/10" />

        <div className="flex items-center gap-1">
          <input type="color" value={gradientA} onChange={(e) => setGradientA(e.target.value)} className={swatchCls} title="Color inicial del degradado" />
          <input type="color" value={gradientB} onChange={(e) => setGradientB(e.target.value)} className={swatchCls} title="Color final del degradado" />
          <button onClick={() => wrapSelection(`<gradient:${gradientA}:${gradientB}>`, "</gradient>")} className={cn(toolBtnCls, "w-auto px-2 text-[10px] font-black uppercase")} title="Aplicar degradado a la selección">
            Degradado
          </button>
        </div>

        <button onClick={() => wrapSelection("<rainbow>", "</rainbow>")} className={toolBtnCls} title="Arcoíris"><Sparkles className="w-3.5 h-3.5" /></button>

        <button onClick={clearFormatting} className={cn(toolBtnCls, "ml-auto text-red-400/80 hover:text-red-400")} title="Quitar formato de la selección">
          <Eraser className="w-3.5 h-3.5" />
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={trackSelection}
        onClick={trackSelection}
        onKeyUp={trackSelection}
        rows={rows}
        placeholder={placeholder}
        className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-yellow-400/50"
      />

      <TextPreview text={value} />
    </div>
  );
}

function TextPreview({ text }: { text: string }) {
  const segments = parseFormattedText(text);
  return (
    <div className="bg-[#1e1e1e] border border-white/5 rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words leading-relaxed">
      {segments.length === 0 && <span className="text-gray-600 italic text-xs">Vista previa</span>}
      {segments.map((seg, i) => (
        <span
          key={i}
          style={{
            color: seg.color ?? "#FFFFFF",
            fontWeight: seg.bold ? 700 : 400,
            fontStyle: seg.italic ? "italic" : "normal",
            textDecoration: [seg.underlined && "underline", seg.strikethrough && "line-through"].filter(Boolean).join(" ") || "none",
          }}
        >
          {seg.text}
        </span>
      ))}
    </div>
  );
}
