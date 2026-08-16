"use client";

import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  /** Si true, avisa cuando el valor escrito no está en la lista (p.ej. un Material inventado). */
  strict?: boolean;
  /** Texto de ayuda bajo el campo. */
  hint?: string;
}

const MAX_RESULTADOS = 40;

export default function AutocompleteInput({
  value, onChange, options, placeholder, className, strict, hint,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = (value || "").toLowerCase();
    if (!q) return options.slice(0, MAX_RESULTADOS);

    // Los que empiezan por lo escrito van primero: buscando "BREAD" interesa BREAD antes
    // que BRICK_STAIRS, aunque ambos contengan la subcadena.
    const empiezan: string[] = [];
    const contienen: string[] = [];
    for (const o of options) {
      const lo = o.toLowerCase();
      if (lo.startsWith(q)) empiezan.push(o);
      else if (lo.includes(q)) contienen.push(o);
      if (empiezan.length >= MAX_RESULTADOS) break;
    }
    return [...empiezan, ...contienen].slice(0, MAX_RESULTADOS);
  }, [value, options]);

  // Un valor vacío no es un error; uno escrito que no existe en la lista, sí.
  const invalido = strict && !!value && !options.includes(value);

  const elegir = (opt: string) => { onChange(opt); setIsOpen(false); setCursor(0); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filtered.length === 0) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = e.key === "ArrowDown"
        ? Math.min(cursor + 1, filtered.length - 1)
        : Math.max(cursor - 1, 0);
      setCursor(next);
      listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      elegir(filtered[cursor]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setIsOpen(true); setCursor(0); }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        onKeyDown={onKeyDown}
        className={cn(className, invalido && "border-danger/60")}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
      />

      {isOpen && filtered.length > 0 && (
        <div ref={listRef}
             className="absolute z-50 w-full mt-1 panel shadow-2xl max-h-56 overflow-y-auto py-1">
          {filtered.map((opt, i) => (
            <div
              key={opt}
              onMouseDown={(e) => { e.preventDefault(); elegir(opt); }}
              onMouseEnter={() => setCursor(i)}
              className={cn(
                "px-3 py-1.5 text-[12px] cursor-pointer truncate",
                i === cursor ? "bg-surface-3 text-ink" : "text-ink-2"
              )}
            >
              {opt}
            </div>
          ))}
          {options.length > filtered.length && (
            <div className="px-3 py-1.5 text-[10px] text-ink-3 border-t border-line mt-1">
              Mostrando {filtered.length} de {options.length}. Sigue escribiendo para afinar.
            </div>
          )}
        </div>
      )}

      {invalido && <p className="hint text-danger">No existe en 1.21.4. Revisa el nombre.</p>}
      {!invalido && hint && <p className="hint">{hint}</p>}
    </div>
  );
}
