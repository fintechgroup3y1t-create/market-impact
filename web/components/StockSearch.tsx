"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useId, useState } from "react";
import { EXPOSURE_SHORT } from "@/lib/labels";
import type { Exposure } from "@/lib/types";

export interface SearchEntry {
  ticker: string;
  name: string;
  covered: boolean;
  ret: string; // เติมตัวเลขจาก backend แล้ว
  dir: "up" | "down" | undefined;
  sensitivities: string[];
  stories: { title: string; sub: string; exposure: Exposure; color?: string; href?: string }[];
}

export function StockSearch({ entries, initial }: { entries: SearchEntry[]; initial: string }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(initial);
  const [isExample, setIsExample] = useState(true);
  const inputId = useId();
  const v = q.trim().toLowerCase();
  const matches = v ? entries.filter((e) => e.ticker.toLowerCase().startsWith(v) || e.name.toLowerCase().includes(v)) : [];
  const s = entries.find((e) => e.ticker === selected);

  function choose(t: string) {
    setSelected(t);
    setIsExample(false);
    setQ("");
  }

  return (
    <>
      <div className="field">
        <label htmlFor={inputId}>ชื่อหุ้นหรือบริษัท</label>
        <input id={inputId} type="search" autoComplete="off" placeholder="เช่น DAL หรือ Apple" value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && matches[0]) choose(matches[0].ticker); }} />
      </div>
      {v && (
        <div className="sugg">
          {matches.length ? (
            matches.map((m) => (
              <button key={m.ticker} type="button" onClick={() => choose(m.ticker)}>
                <b>{m.ticker}</b>
                <span className="muted">{m.name}</span>
                {m.covered ? <span className="pill pos">มีการวิเคราะห์</span> : <span className="pill mix">ราคาและข่าว</span>}
              </button>
            ))
          ) : (
            <div className="muted">ไม่พบ &quot;{q}&quot; ในรายการตัวอย่าง ลองพิมพ์ DAL หรือ XOM</div>
          )}
        </div>
      )}

      {s && (
        <section className="sec" aria-live="polite">
          {isExample && <p className="small">ตัวอย่างผลการค้นหา</p>}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 4 }}>
            <div className="tick" style={{ marginTop: 0, fontSize: 44 }}>{s.ticker}</div>
            <b className={`disp ${s.dir ?? ""}`} style={{ fontSize: 20 }}>{s.ret}</b>
          </div>
          <p>{s.name}</p>
          {s.covered ? (
            <>
              <p className="small" style={{ marginTop: 4 }}>อ่อนไหวต่อ {s.sensitivities.join(", ")}</p>
              <h2 style={{ marginTop: 24 }}>เรื่องที่เกี่ยวข้องช่วงนี้</h2>
              {s.stories.length ? (
                <div className="list">
                  {s.stories.map((st) => {
                    const inner = (
                      <>
                        <span className="bar" style={{ "--lc": st.color } as CSSProperties} />
                        <div style={{ flex: 1 }}>
                          <b>{st.title}</b>
                          <span className="small">{st.sub}</span>
                        </div>
                        <span className={`pill ${st.exposure}`}>{EXPOSURE_SHORT[st.exposure]}</span>
                      </>
                    );
                    return st.href ? (
                      <Link key={st.title} className="item" href={st.href}>{inner}</Link>
                    ) : (
                      <div key={st.title} className="item">{inner}</div>
                    );
                  })}
                </div>
              ) : (
                <p className="result-empty">ช่วงนี้ยังไม่มีเหตุการณ์ที่เกี่ยวข้องกับหุ้นตัวนี้</p>
              )}
            </>
          ) : (
            <p className="result-empty">หุ้นตัวนี้ยังไม่อยู่ในการวิเคราะห์ จึงแสดงได้เฉพาะราคาและข่าว (ข่าวจะเพิ่มในชิ้นที่ 5)</p>
          )}
          <p className="small" style={{ marginTop: 14 }}>หุ้นที่ยังไม่อยู่ในการวิเคราะห์จะแสดงราคาและข่าวได้ แต่จะยังไม่มีเส้นทางผลกระทบ</p>
        </section>
      )}
    </>
  );
}
