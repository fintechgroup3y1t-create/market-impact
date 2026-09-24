"use client";

// เส้นทางผลกระทบแนวตั้ง สลับเส้นทางได้

import Link from "next/link";
import type { CSSProperties } from "react";
import { useState } from "react";
import { EXPOSURE_LONG } from "@/lib/labels";
import type { ImpactChain } from "@/lib/types";

export function ChainRoutes({ chains, lineColor, stockHref }: { chains: ImpactChain[]; lineColor: string; stockHref: Record<string, string | null> }) {
  const [id, setId] = useState(chains[0]?.id);
  const chain = chains.find((c) => c.id === id);
  if (!chain) return null;
  const href = stockHref[chain.ticker];

  return (
    <>
      <div className="routes" role="group" aria-label="เลือกเส้นทาง">
        {chains.map((c) => (
          <button key={c.id} type="button" className="chip" style={{ "--lc": `var(--${c.exposure})` } as CSSProperties} aria-pressed={c.id === id} onClick={() => setId(c.id)}>
            <i />
            {c.label}
          </button>
        ))}
      </div>
      <div className="chain" style={{ "--lc": lineColor } as CSSProperties}>
        {chain.steps.map((s, i) => (
          <div key={s.layer + s.name} className="stn">
            <div className="rail">
              <span className={i === 0 ? "c t" : "c"} />
              <span className={`s ${s.strength}`} />
            </div>
            <div className="txt">
              <div className="ly">{s.layer}</div>
              <div className="nm">{s.name}</div>
              <p className="ds">{s.desc}</p>
              <div className="cf">
                {s.confidence}
                {s.strength === "dashed" && <span className="sr-only">, เส้นประ มีปัจจัยที่อาจทำให้ผลต่างไป</span>}
              </div>
            </div>
          </div>
        ))}
        <div className="stn">
          <div className="rail">
            <span className="c" style={{ borderColor: `var(--${chain.exposure})` }} />
          </div>
          <div className="txt">
            <div className="ly">หุ้น</div>
            {href ? (
              <>
                <Link className={`stkchip ${chain.exposure}`} href={href}>
                  <b>{chain.ticker}</b>
                  <span>{EXPOSURE_LONG[chain.exposure]}</span>
                </Link>
                <p className="small" style={{ marginTop: 8 }}>
                  <Link href={href}>ดูหลักฐานว่าทำไมถึงเป็นหุ้นตัวนี้</Link>
                </p>
              </>
            ) : (
              <span className={`stkchip ${chain.exposure}`}>
                <b>{chain.ticker}</b>
                <span>{EXPOSURE_LONG[chain.exposure]}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
