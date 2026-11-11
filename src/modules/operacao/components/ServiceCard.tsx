import * as React from "react";
import { Check, EllipsisVertical } from "lucide-react";
import { Badge, Menu, cn, type MenuEntry } from "@/ui";
import { SERVICE_ICON, SERVICE_STATUS } from "@/app/status";
import { formatTime } from "@/lib/format";
import type { ServiceView, Team } from "@/services";
import { canMove, serviceTitle } from "./helpers";

const dotCls: Record<string, string> = {
  neutral: "bg-fg-3",
  accent: "bg-accent",
  ok: "bg-ok",
  info: "bg-info",
  danger: "bg-danger",
  idle: "ring-[1.5px] ring-inset ring-idle",
  warn: "bg-warn",
};

export interface ServiceCardProps {
  service: ServiceView;
  teams: Team[];
  dragging?: boolean;
  onOpen: (id: string) => void;
  onMoveTo: (id: string, teamId: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
}

/** Cartão compacto da agenda: horário, tipo, cliente e ponto de status. Arrasta quando ainda pode mudar de lugar. */
export const ServiceCard = React.memo(function ServiceCard({
  service: s,
  teams,
  dragging,
  onOpen,
  onMoveTo,
  onDragStart,
  onDragEnd,
}: ServiceCardProps) {
  const Icon = SERVICE_ICON[s.type];
  const st = SERVICE_STATUS[s.status];
  const movable = canMove(s.status);
  const done = s.status === "concluido";
  const items: MenuEntry[] = [
    { label: "Mover para…", disabled: true },
    { type: "separator" },
    ...teams
      .filter((t) => t.id !== s.teamId)
      .map((t) => ({ label: t.name, onSelect: () => onMoveTo(s.id, t.id) })),
  ];
  return (
    <li
      data-card-id={s.id}
      draggable={movable}
      onDragStart={(e) => {
        if (!movable) return;
        e.stopPropagation();
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", s.id);
        // a imagem do arrasto é tirada logo depois deste evento: a sombra já precisa estar no cartão
        e.currentTarget.classList.add("shadow-drag");
        requestAnimationFrame(() => onDragStart?.(s.id));
      }}
      onDragEnd={(e) => {
        e.currentTarget.classList.remove("shadow-drag");
        onDragEnd?.();
      }}
      className={cn(
        "group/svc relative rounded-control bg-sunken transition-[background-color,opacity,box-shadow] duration-150 ease-[var(--ease-ui)] hover:bg-hover",
        movable && "cursor-grab active:cursor-grabbing",
        dragging && "opacity-40 shadow-drag",
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpen(s.id);
        }}
        className="block w-full min-w-0 cursor-[inherit] rounded-control p-3 pr-11 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "tnum text-title-sub",
              done
                ? "text-fg-2"
                : s.status === "atrasado"
                  ? "text-danger-ink"
                  : "text-fg",
            )}
          >
            {formatTime(s.start)}
          </span>
          {s.extra ? <Badge tone="warn">Extra</Badge> : null}
        </span>
        <span className="mt-1.5 flex items-center gap-2">
          <span
            aria-hidden
            className="grid size-7 shrink-0 place-items-center rounded-tip bg-raised text-fg-2"
          >
            {done ? (
              <Check size={16} strokeWidth={2.5} className="text-ok-ink" />
            ) : (
              <Icon size={16} strokeWidth={2} />
            )}
          </span>
          <span className="min-w-0 truncate text-body font-semibold">
            {serviceTitle(s)}
          </span>
        </span>
        <span className="mt-1 block truncate text-body text-fg-2">
          {s.clientName}
        </span>
        <span className="sr-only">{st.label}</span>
      </button>
      <span
        title={st.label}
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-[19px] flex items-center",
          movable ? "right-[46px]" : "right-4",
        )}
      >
        <span
          className={cn(
            "size-2 rounded-pill",
            dotCls[st.tone],
            s.status === "em_andamento" && "ring-4 ring-accent/25",
          )}
        />
      </span>
      {movable ? (
        <div className="absolute top-1 right-1">
          <Menu
            align="end"
            items={items}
            trigger={
              <button
                type="button"
                aria-label={`Mover para… (${serviceTitle(s)}, ${formatTime(s.start)})`}
                onClick={(e) => e.stopPropagation()}
                className="ds-touch ds-touch-sq grid size-8 place-items-center rounded-pill text-fg-3 transition-colors duration-150 hover:bg-raised hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring data-[state=open]:bg-raised data-[state=open]:text-fg"
              >
                <EllipsisVertical size={18} strokeWidth={2} aria-hidden />
              </button>
            }
          />
        </div>
      ) : null}
    </li>
  );
});
