"use client";

import { useMemo } from "react";
import { Trash2, Hammer } from "lucide-react";
import { cn } from "@/lib/utils";
import { CraftRecipeConfig, isCraftable } from "@/lib/studio";

interface CraftingGridEditorProps {
  recipe: CraftRecipeConfig | null | undefined;
  onChange: (recipe: CraftRecipeConfig | null) => void;
  /** Sugerencias del datalist compartido: nombres de Material tal cual, y refs "namespace:key" ya completos. */
  refOptions: string[];
  /** Qué produce esta receta, para el rótulo junto al grid (ej. "Clay Pot"). */
  resultLabel: string;
}

const GRID_SIZE = 3;
const SYMBOLS = "ABCDEFGHI";
const DATALIST_ID = "crafting-grid-ingredient-options";

/** Rellena el grid 3x3 (fila-mayor) a partir de shape/ingredients, anclado arriba-izquierda. */
function recipeToGrid(recipe: CraftRecipeConfig | null | undefined): (string | null)[] {
  const cells: (string | null)[] = Array(GRID_SIZE * GRID_SIZE).fill(null);
  if (!recipe) return cells;
  recipe.shape.forEach((line, r) => {
    if (r >= GRID_SIZE) return;
    [...line].forEach((symbol, c) => {
      if (c >= GRID_SIZE || symbol === ' ') return;
      cells[r * GRID_SIZE + c] = recipe.ingredients[symbol] ?? null;
    });
  });
  return cells;
}

/**
 * Recorta el grid al rectángulo con contenido y asigna un símbolo por ref distinto.
 * El recorte es lo que permite que una receta que solo usa, por ejemplo, las 4 casillas de
 * arriba-izquierda siga siendo válida en la mesa de crafteo 2x2 del inventario del jugador, no
 * solo en la mesa de crafteo — el motor de xLib compara por el rectángulo mínimo que ocupa el
 * patrón, igual que hace aquí.
 */
function gridToRecipe(cells: (string | null)[]): CraftRecipeConfig | null {
  let minR = GRID_SIZE, maxR = -1, minC = GRID_SIZE, maxC = -1;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (cells[r * GRID_SIZE + c]) {
        minR = Math.min(minR, r); maxR = Math.max(maxR, r);
        minC = Math.min(minC, c); maxC = Math.max(maxC, c);
      }
    }
  }
  if (maxR === -1) return null;

  const symbolFor = new Map<string, string>();
  const ingredients: Record<string, string> = {};
  const shape: string[] = [];
  let nextSymbol = 0;

  for (let r = minR; r <= maxR; r++) {
    let line = "";
    for (let c = minC; c <= maxC; c++) {
      const ref = cells[r * GRID_SIZE + c];
      if (!ref) { line += " "; continue; }
      let symbol = symbolFor.get(ref);
      if (!symbol) {
        symbol = SYMBOLS[nextSymbol++] ?? "?";
        symbolFor.set(ref, symbol);
        ingredients[symbol] = ref;
      }
      line += symbol;
    }
    shape.push(line);
  }
  return { shape, ingredients };
}

/** "clay_ball" o "CLAY_BALL" -> "vanilla:CLAY_BALL". Un ref que ya trae ":" se deja tal cual. */
function normalizeRef(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  return trimmed.includes(':') ? trimmed : `vanilla:${trimmed.toUpperCase()}`;
}

/** Para mostrar/editar en la celda: "vanilla:CLAY_BALL" -> "CLAY_BALL", el resto tal cual. */
function displayRef(ref: string): string {
  return ref.startsWith('vanilla:') ? ref.slice('vanilla:'.length) : ref;
}

export default function CraftingGridEditor({ recipe, onChange, refOptions, resultLabel }: CraftingGridEditorProps) {
  const craftable = isCraftable(recipe);
  const grid = useMemo(() => recipeToGrid(recipe), [recipe]);
  const shapePreview = useMemo(() => gridToRecipe(grid)?.shape ?? [], [grid]);

  const setCell = (index: number, value: string | null) => {
    const next = [...grid];
    next[index] = value;
    onChange(gridToRecipe(next));
  };

  const toggleCraftable = (value: boolean) => {
    onChange(value ? recipe ?? null : null);
  };

  return (
    <div className="space-y-4">
      <datalist id={DATALIST_ID}>
        {refOptions.map((o) => <option key={o} value={o} />)}
      </datalist>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-3 cursor-pointer w-fit">
          <div className="relative">
            <input type="checkbox" checked={craftable} onChange={(e) => toggleCraftable(e.target.checked)} className="sr-only" />
            <div className={cn("w-8 h-4 rounded-full transition-colors", craftable ? "bg-green-500" : "bg-gray-700")}></div>
            <div className={cn("absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform", craftable ? "translate-x-4" : "")}></div>
          </div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Se puede craftear</span>
        </label>
        {craftable && (
          <button onClick={() => onChange(null)} className="flex items-center gap-1 text-[10px] font-black uppercase text-gray-500 hover:text-red-400 transition-colors">
            <Trash2 className="w-3 h-3" /> Vaciar mesa
          </button>
        )}
      </div>

      {!craftable ? (
        <p className="text-[11px] text-gray-500 italic">
          Sin receta: solo se consigue por comando de administrador. Activa el interruptor para dibujar una receta de mesa de crafteo.
        </p>
      ) : (
        <>
          <div className="flex items-start gap-6 flex-wrap">
            <div className="grid grid-cols-3 gap-1.5 bg-black/30 p-3 rounded-2xl border border-white/5 w-fit shrink-0">
              {grid.map((ingredientRef, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-16 h-16 rounded-lg border flex items-center justify-center relative group/cell transition-colors",
                    ingredientRef ? "border-orange-500/40 bg-orange-500/5" : "border-dashed border-white/10 bg-white/[0.02]"
                  )}
                >
                  {ingredientRef && (
                    <button
                      onClick={() => setCell(i, null)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] leading-none flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity z-10"
                    >
                      ×
                    </button>
                  )}
                  <input
                    type="text"
                    list={DATALIST_ID}
                    value={ingredientRef ? displayRef(ingredientRef) : ''}
                    onChange={(e) => setCell(i, e.target.value ? normalizeRef(e.target.value) : null)}
                    placeholder="—"
                    spellCheck={false}
                    autoComplete="off"
                    title={ingredientRef || 'Casilla vacía'}
                    className="w-full h-full bg-transparent text-center text-[9px] font-bold text-white outline-none px-1 truncate placeholder:text-gray-700"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-1.5 pt-2 min-w-[7rem]">
              <Hammer className="w-5 h-5 text-orange-400" />
              <span className="text-[9px] text-gray-500 uppercase font-black text-center">produce</span>
              <span className="text-[11px] text-white font-bold text-center">{resultLabel}</span>
            </div>
          </div>

          {shapePreview.length > 0 && (
            <div className="flex gap-1 font-mono text-[10px] text-gray-500 bg-black/20 rounded-lg px-3 py-2 w-fit">
              {shapePreview.map((line, i) => (
                <span key={i}>{line.replace(/ /g, '·')}{i < shapePreview.length - 1 ? ' / ' : ''}</span>
              ))}
            </div>
          )}
        </>
      )}

      <p className="hint">
        Las casillas vacías deben quedar vacías en la mesa del jugador — el patrón se recorta solo,
        no hace falta rellenar las 9 casillas. Escribe un material vanilla (ej. CLAY_BALL) o un id
        completo (ej. xfoods:coffee_beans, xfoodscrops:pod:clay_pot) para usar un ítem custom.
      </p>
    </div>
  );
}
