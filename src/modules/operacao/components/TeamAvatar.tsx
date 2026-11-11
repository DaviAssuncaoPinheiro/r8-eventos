import { cn } from "@/ui";
import type { Team } from "@/services";
import { teamAvatarStyle } from "./helpers";

/** Iniciais da equipe na cor dela */
export function TeamAvatar({
  team,
  size = 40,
  className,
}: {
  team: Pick<Team, "initials" | "color">;
  size?: 32 | 40;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      style={teamAvatarStyle(team.color)}
      className={cn(
        "grid shrink-0 place-items-center rounded-pill font-semibold text-fg",
        size === 40 ? "size-10 text-body" : "size-8 text-caption",
        className,
      )}
    >
      {team.initials}
    </span>
  );
}
