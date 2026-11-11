import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/ui";

const ddmm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

const arrow =
  "ds-touch ds-touch-sq grid size-9 place-items-center rounded-pill text-fg-2 transition-colors duration-150 ease-[var(--ease-ui)] hover:bg-hover hover:text-fg active:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring";

/** Seletor de dia em pílula: anterior, Hoje com a data, próximo */
export function DayPicker({
  day,
  today,
  onChange,
}: {
  day: string;
  today: string;
  onChange: (day: string) => void;
}) {
  const isToday = day === today;
  return (
    <div
      role="group"
      aria-label="Dia"
      className="inline-flex h-11 items-center gap-0.5 rounded-pill bg-raised p-1 ring-1 ring-inset ring-edge"
    >
      <button
        type="button"
        aria-label="Dia anterior"
        onClick={() => onChange(shift(day, -1))}
        className={arrow}
      >
        <ChevronLeft size={18} strokeWidth={2} aria-hidden />
      </button>
      <button
        type="button"
        aria-label={
          isToday
            ? `Hoje, ${ddmm(day)}`
            : `Voltar para hoje. Dia mostrado: ${ddmm(day)}`
        }
        aria-pressed={isToday}
        onClick={() => onChange(today)}
        className={cn(
          "ds-touch inline-flex h-9 items-center gap-2 rounded-pill px-4 text-body font-semibold transition-colors duration-150 ease-[var(--ease-ui)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
          isToday ? "bg-accent-soft text-accent-ink" : "text-fg hover:bg-hover",
        )}
      >
        Hoje
        <span className={cn("tnum", isToday ? "text-accent-ink" : "text-fg-2")}>
          {ddmm(day)}
        </span>
      </button>
      <button
        type="button"
        aria-label="Próximo dia"
        onClick={() => onChange(shift(day, 1))}
        className={arrow}
      >
        <ChevronRight size={18} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}

function shift(day: string, n: number) {
  const [y, m, d] = day.split("-").map(Number);
  const x = new Date(y, m - 1, d + n);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}
