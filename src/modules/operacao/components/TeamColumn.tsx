import * as React from "react";
import { cn } from "@/ui";
import type { ServiceView, Team } from "@/services";
import { TeamAvatar } from "./TeamAvatar";
import { ServiceCard } from "./ServiceCard";
import { visibleOf } from "./helpers";

export interface TeamColumnProps {
  team: Team;
  teams: Team[];
  /** todos os serviços da equipe no dia, na ordem da rota (inclui cancelados, que não aparecem) */
  route: ServiceView[];
  selected: boolean;
  dragId: string | null;
  /** onde o cartão arrastado vai cair */
  dropIndex: number | null;
  className?: string;
  /** esconde o cabeçalho (celular: as pílulas já mostram a equipe) */
  bare?: boolean;
  onSelect: (teamId: string) => void;
  onOpen: (id: string) => void;
  onMoveTo: (id: string, teamId: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: (teamId: string, index: number) => void;
  onDragLeave: (teamId: string) => void;
  onDrop: (teamId: string, index: number) => void;
}

/** Uma coluna da agenda: a equipe, o progresso do dia dela e os serviços em ordem */
export function TeamColumn({
  team,
  teams,
  route,
  selected,
  dragId,
  dropIndex,
  className,
  bare,
  onSelect,
  onOpen,
  onMoveTo,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: TeamColumnProps) {
  const list = visibleOf(route);
  const done = list.filter((s) => s.status === "concluido").length;
  const ref = React.useRef<HTMLUListElement>(null);
  const over = dropIndex !== null;

  /** posição de soltura: quantos cartões (sem o arrastado) estão acima do ponteiro */
  const indexAt = (clientY: number) => {
    const els = Array.from(
      ref.current?.querySelectorAll<HTMLElement>("[data-card-id]") ?? [],
    ).filter((el) => el.dataset.cardId !== dragId);
    let i = 0;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (clientY > r.top + r.height / 2) i++;
    }
    return i;
  };

  const slot = (
    <li key="slot" aria-hidden className="h-1.5 rounded-pill bg-accent" />
  );
  const rows: React.ReactNode[] = [];
  let k = 0;
  for (const s of list) {
    // o cartão arrastado fica na posição de origem, apagado, até soltar
    const isDragged = s.id === dragId;
    if (!isDragged) {
      if (over && dropIndex === k) rows.push(slot);
      k++;
    }
    rows.push(
      <ServiceCard
        key={s.id}
        service={s}
        teams={teams}
        dragging={isDragged}
        onOpen={onOpen}
        onMoveTo={onMoveTo}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />,
    );
  }
  if (over && dropIndex >= k) rows.push(slot);

  return (
    <section
      aria-label={team.name}
      data-team-id={team.id}
      onClick={() => onSelect(team.id)}
      onDragOver={(e) => {
        if (!dragId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const i = indexAt(e.clientY);
        if (dropIndex !== i) onDragOver(team.id, i);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null))
          onDragLeave(team.id);
      }}
      onDrop={(e) => {
        if (!dragId) return;
        e.preventDefault();
        onDrop(team.id, indexAt(e.clientY));
      }}
      className={cn(
        "flex min-w-0 flex-col rounded-card bg-raised p-3 transition-[box-shadow,background-color] duration-150 ease-[var(--ease-ui)]",
        selected && !over && "ring-2 ring-accent ring-inset",
        over && "bg-accent-soft ring-2 ring-accent ring-inset",
        className,
      )}
    >
      {bare ? null : (
        <button
          type="button"
          aria-pressed={selected}
          aria-label={`${team.name}, ${done} de ${list.length} concluídos. Destacar no mapa`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(team.id);
          }}
          className="mb-3 flex w-full items-center gap-3 rounded-control p-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <TeamAvatar team={team} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-title-card">{team.name}</span>
            <span className="mt-0.5 inline-flex rounded-tip bg-sunken px-1.5 text-caption font-semibold text-fg-2 tnum">
              {team.plate}
            </span>
          </span>
          <span className="tnum text-title-sub text-fg-2">
            <span className="text-fg">{done}</span>/{list.length}
          </span>
        </button>
      )}
      <ul
        ref={ref}
        className="m-0 flex min-h-[72px] flex-1 list-none flex-col gap-2 p-0"
      >
        {rows}
        {list.length === 0 && !over ? (
          <li
            aria-hidden
            className="ds-hatch min-h-[72px] flex-1 rounded-control bg-sunken"
          />
        ) : null}
      </ul>
    </section>
  );
}
