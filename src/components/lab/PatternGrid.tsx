import { useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { assertPattern, blankPattern, GRID_SIZE, toggleCell } from "./patterns";
import type { PatternCells } from "./patterns";

type PatternGridProps = {
  cells: PatternCells;
  label: string;
} & (
  | { readOnly: true; onChange?: never; onReset?: never; resetLabel?: never }
  | {
      readOnly?: false;
      onChange: (cells: PatternCells) => void;
      onReset?: () => void;
      resetLabel?: string;
    }
);

export function PatternGrid(props: PatternGridProps) {
  const { cells, label } = props;
  assertPattern(cells);
  const helpId = useId();
  const [focusIndex, setFocusIndex] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const activeCount = cells.filter((cell) => cell === 1).length;

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const row = Math.floor(index / GRID_SIZE);
    const column = index % GRID_SIZE;
    let next: number;
    switch (event.key) {
      case "ArrowRight":
        next = row * GRID_SIZE + Math.min(column + 1, 7);
        break;
      case "ArrowLeft":
        next = row * GRID_SIZE + Math.max(column - 1, 0);
        break;
      case "ArrowDown":
        next = Math.min(row + 1, 7) * GRID_SIZE + column;
        break;
      case "ArrowUp":
        next = Math.max(row - 1, 0) * GRID_SIZE + column;
        break;
      case "Home":
        next = event.ctrlKey ? 0 : row * GRID_SIZE;
        break;
      case "End":
        next = event.ctrlKey ? 63 : row * GRID_SIZE + 7;
        break;
      default:
        return;
    }
    event.preventDefault();
    setFocusIndex(next);
    buttons.current[next]?.focus();
  }

  return (
    <div className="[&_button]:touch-manipulation">
      <div className="relative pt-[19px] pl-[18px]">
        <div
          className="absolute inset-x-0 top-0 left-[18px] grid grid-cols-8 text-center font-mono text-xs text-slate-400"
          aria-hidden="true"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <div
          className="absolute top-[19px] bottom-0 left-0 grid w-3 grid-rows-8 items-center font-mono text-xs text-slate-400"
          aria-hidden="true"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        {props.readOnly ? (
          <div
            className="flex aspect-square flex-col gap-1 rounded-[7px] border border-slate-200 bg-slate-50 p-[7px] min-[520px]:max-[1100px]:gap-[3px] min-[520px]:max-[1100px]:p-[5px]"
            role="img"
            aria-label={`${label}: read-only 8 by 8 pattern, ${activeCount} active cells`}
          >
            {Array.from({ length: 8 }, (_, row) => (
              <div
                className="grid min-h-0 flex-1 grid-cols-8 gap-1 min-[520px]:max-[1100px]:gap-[3px]"
                key={row}
              >
                {cells.slice(row * 8, row * 8 + 8).map((cell, column) => (
                  <span
                    key={column}
                    className={`block size-full min-h-0 min-w-0 rounded-[3px] border p-0 ${cell === 1 ? "border-slate-800 bg-slate-800" : "border-slate-300 bg-slate-100"}`}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div
            className="flex aspect-square flex-col gap-1 rounded-[7px] border border-slate-200 bg-slate-50 p-[7px] min-[520px]:max-[1100px]:gap-[3px] min-[520px]:max-[1100px]:p-[5px]"
            role="grid"
            aria-label={label}
            aria-describedby={helpId}
            aria-rowcount={8}
            aria-colcount={8}
          >
            {Array.from({ length: 8 }, (_, row) => (
              <div
                className="grid min-h-0 flex-1 grid-cols-8 gap-1 min-[520px]:max-[1100px]:gap-[3px]"
                role="row"
                key={row}
              >
                {cells.slice(row * 8, row * 8 + 8).map((cell, column) => {
                  const index = row * 8 + column;
                  return (
                    <div
                      className="flex min-h-0 min-w-0"
                      role="gridcell"
                      key={column}
                    >
                      <button
                        type="button"
                        ref={(element) => {
                          buttons.current[index] = element;
                        }}
                        className={`block size-full min-h-0 min-w-0 rounded-[3px] border p-0 cursor-pointer hover:border-blue-600 hover:ring-1 hover:ring-blue-600 focus-visible:relative focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-blue-600 focus-visible:outline-offset-1! ${cell === 1 ? "border-slate-800 bg-slate-800" : "border-slate-300 bg-slate-100"}`}
                        aria-label={`Row ${row + 1}, column ${column + 1}`}
                        aria-pressed={cell === 1}
                        tabIndex={index === focusIndex ? 0 : -1}
                        onFocus={() => setFocusIndex(index)}
                        onKeyDown={(event) => navigate(event, index)}
                        onClick={() => props.onChange(toggleCell(cells, index))}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 flex min-h-[30px] items-center justify-between gap-2 text-sm text-slate-500 [&_strong]:font-medium [&_strong]:text-slate-700">
        <span>
          <strong>{activeCount}</strong> / 64 active
        </span>
        {!props.readOnly && (
          <button
            type="button"
            className="cursor-pointer touch-manipulation border-0 bg-transparent py-[5px] pl-1.5 text-sm text-slate-600 underline underline-offset-4 hover:text-slate-900 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-blue-600 focus-visible:outline-offset-4"
            onClick={() =>
              props.onReset ? props.onReset() : props.onChange(blankPattern())
            }
          >
            {props.resetLabel ?? "Reset pattern"}
          </button>
        )}
        {props.readOnly && <span className="text-slate-500">Read-only</span>}
      </div>
      {!props.readOnly && (
        <p
          className="mt-[5px] text-sm leading-[1.55] text-slate-500"
          id={helpId}
        >
          Click to flip a cell. Arrow keys to move; Space or Enter to flip.
        </p>
      )}
    </div>
  );
}

export function PatternThumbnail({ cells }: { cells: PatternCells }) {
  return (
    <span
      className="grid size-10 shrink-0 grid-cols-8 gap-px"
      aria-hidden="true"
    >
      {cells.map((cell, i) => (
        <span
          key={i}
          className={`block rounded-[1px] ${cell === 1 ? "bg-slate-700 group-aria-pressed:bg-blue-700" : "bg-slate-100"}`}
        />
      ))}
    </span>
  );
}
