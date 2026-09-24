import Link from "next/link";
import type { Line } from "@/lib/types";
import { LineBadge } from "./LineBadge";

export function BackBar({ href, label, line }: { href: string; label: string; line?: Line }) {
  return (
    <div className="bar2">
      <Link className="back" href={href} aria-label={label}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
      </Link>
      {line && <LineBadge line={line} />}
    </div>
  );
}
