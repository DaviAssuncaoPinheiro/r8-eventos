import * as React from "react";
import type { ServiceStatus, ServiceView, Team } from "@/services";

const MAX_STEPS = 3;
const EVERY_MS = 25000;

export interface LiveStep {
  service: ServiceView;
  team: Team;
  to: Extract<ServiceStatus, "a_caminho" | "em_andamento">;
}

/** Escolhe quem avança: a próxima parada de cada equipe que não está atendendo agora, em rodízio */
export function pickStep(
  services: ServiceView[],
  teams: Team[],
  turn: number,
): LiveStep | undefined {
  const cands: LiveStep[] = [];
  for (const team of teams) {
    const route = services
      .filter(
        (s) =>
          s.teamId === team.id &&
          s.status !== "cancelado" &&
          s.status !== "concluido",
      )
      .sort((a, b) => a.order - b.order);
    if (!route.length || route.some((s) => s.status === "em_andamento"))
      continue;
    const next = route.find((s) => s.status === "a_caminho") ?? route[0];
    if (next.status === "a_caminho")
      cands.push({ service: next, team, to: "em_andamento" });
    else cands.push({ service: next, team, to: "a_caminho" });
  }
  return cands.length ? cands[turn % cands.length] : undefined;
}

/**
 * Tempo real simulado: a cada ~25 s, com a tela visível e em "Hoje", um serviço avança um passo.
 * No máximo 3 avanços por visita e nunca conclui sozinho.
 */
export function useLiveSim({
  enabled,
  services,
  teams,
  advance,
}: {
  enabled: boolean;
  services: ServiceView[] | undefined;
  teams: Team[] | undefined;
  advance: (step: LiveStep) => void;
}) {
  const ref = React.useRef({ services, teams, advance });
  ref.current = { services, teams, advance };
  const steps = React.useRef(0);
  React.useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible" || steps.current >= MAX_STEPS)
        return;
      const { services: sv, teams: tm, advance: go } = ref.current;
      if (!sv || !tm) return;
      const step = pickStep(sv, tm, steps.current);
      if (!step) return;
      steps.current++;
      go(step);
    }, EVERY_MS);
    return () => window.clearInterval(id);
  }, [enabled]);
  return steps;
}
