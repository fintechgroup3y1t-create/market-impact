import type { CSSProperties } from "react";
import type { Line } from "@/lib/types";

export const lineVar = (line?: Line) => (line ? `var(--${line.color})` : undefined);

export function LineBadge({ line }: { line: Line }) {
  return (
    <span className="linebadge" style={{ "--lc": lineVar(line) } as CSSProperties}>
      <i />
      {line.name}
    </span>
  );
}
