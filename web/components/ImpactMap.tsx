"use client";

// แผนที่ผลกระทบวันนี้
// รอบ 1: SVG แผนที่รถไฟฟ้าทั้งหมด (ชิ้นที่ 1)
// รอบ 2: แถบสรุปบรรทัดเดียวเลื่อนซ้าย-ขวา (แบบ C จาก 3 แบบที่เสนอ) — เจ้าของแจ้งว่า "ดูยาก" (ข้อความถูกตัดขอบจอ
// ไม่มีสัญญาณว่าเลื่อนได้ และไม่มีป้ายกำกับว่าแต่ละกล่องหมายถึงชั้นอะไร)
// รอบ 3 (ตอนนี้): เปลี่ยนเป็นลำดับขั้นแนวตั้งมีป้ายกำกับชัดเจนทุกชั้น (เหตุการณ์/เศรษฐกิจ/อุตสาหกรรม/หุ้น)
// reuse CSS class เดียวกับเส้นทางผลกระทบเต็มรูปแบบในหน้า "ทำไมถึงเป็นหุ้นตัวนี้" (.stn/.rail/.ly/.nm จาก ChainRoutes.tsx)
// ให้หน้าตาสอดคล้องกันทั้งเว็บ ไม่ต้องสร้าง CSS ใหม่
// โหนดของแต่ละสายยังวาดไว้ตายตัวเหมือนเดิม (ยังไม่ได้สร้างจาก impact_chains อัตโนมัติ เป็นข้อจำกัดเดิมที่ยังไม่แก้ในรอบนี้)

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { EXPOSURE_SHORT } from "@/lib/labels";
import type { Exposure, Line, MapSign } from "@/lib/types";
import { useGame } from "./GameProvider";

type Css = CSSProperties & Record<`--${string}`, string>;

const LAYER_LABELS = ["เหตุการณ์", "ผลต่อเศรษฐกิจ", "อุตสาหกรรม"];

const CHAINS: Record<string, { nodes: string[]; stocks: { ticker: string; exposure: Exposure }[] }> = {
  oil: { nodes: ["น้ำมันพุ่ง", "ต้นทุนพลังงานสูง", "พลังงาน / สายการบิน"], stocks: [{ ticker: "XOM", exposure: "pos" }, { ticker: "DAL", exposure: "neg" }] },
  inflation: { nodes: ["เฟดขึ้นดอกเบี้ย", "อัตราคิดลดสูงขึ้น", "หุ้นเทค"], stocks: [{ ticker: "NVDA", exposure: "mix" }] },
  dollar: { nodes: ["ดอลลาร์แข็งค่า", "ราคาทองคำถูกกดดัน", "เหมืองทอง"], stocks: [{ ticker: "NEM", exposure: "neg" }] },
  ai: { nodes: ["บิ๊กเทคทุ่มงบลงทุน AI", "ความต้องการชิป/ไฟฟ้าพุ่งสูง", "เซมิคอนดักเตอร์ / สาธารณูปโภคไฟฟ้า"], stocks: [{ ticker: "NVDA", exposure: "pos" }, { ticker: "NEE", exposure: "pos" }] },
};

export function ImpactMap({ lines, signs }: { lines: Line[]; signs: MapSign[] }) {
  const { seeLine } = useGame();
  const [picked, setPicked] = useState(lines[0].id);
  const pickedLine = lines.find((l) => l.id === picked)!;
  const sign = signs.find((s) => s.lineId === picked);
  const chain = CHAINS[picked];

  // สายที่เลือกไว้ตั้งต้น (lines[0]) ก็ถือว่า "สำรวจแล้ว" เหมือนกัน ไม่ต้องรอให้ผู้ใช้แตะซ้ำ
  useEffect(() => {
    seeLine(lines[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pick(id: string) {
    setPicked(id);
    seeLine(id);
  }

  return (
    <section className="mapcard" aria-labelledby="maph">
      <h2 id="maph">ผลกระทบวันนี้</h2>
      <p className="hint">แต่ละสีคือหนึ่งเรื่องในตลาด แตะเพื่อดูว่าเรื่องนั้นไหลไปกระทบใคร</p>
      <div className="chips" role="group" aria-label="เลือกเรื่อง">
        {lines.map((l) => (
          <button key={l.id} type="button" className="chip" style={{ "--lc": `var(--${l.color})` } as Css} aria-pressed={picked === l.id} onClick={() => pick(l.id)}>
            <i />
            {l.short}
          </button>
        ))}
      </div>

      <div className="chain" style={{ "--lc": `var(--${pickedLine.color})` } as Css} role="group" aria-label={`สายโซ่ผลกระทบของ ${pickedLine.name}`}>
        {chain.nodes.map((node, i) => (
          <div key={node} className="stn">
            <div className="rail">
              <span className={i === 0 ? "c t" : "c"} />
              {i < chain.nodes.length - 1 && <span className="s" />}
            </div>
            <div className="txt">
              <div className="ly">{LAYER_LABELS[i]}</div>
              <div className="nm">{node}</div>
            </div>
          </div>
        ))}
        <div className="stn">
          <div className="rail">
            <span className="c" />
          </div>
          <div className="txt">
            <div className="ly">หุ้น</div>
            <div className="nm" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
              {chain.stocks.map((s) => (
                <span key={s.ticker} className={`stkchip ${s.exposure}`}>
                  <b>{s.ticker}</b>
                  <span>{EXPOSURE_SHORT[s.exposure]}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="legend" aria-label="คำอธิบายสัญลักษณ์">
        <span><i style={{ borderColor: "var(--pos)" }} />บวก = Positive Exposure</span>
        <span><i style={{ borderColor: "var(--neg)" }} />ลบ = Negative Exposure</span>
        <span><i style={{ borderColor: "var(--mix)", borderStyle: "dashed" }} />ผสม = Mixed Exposure</span>
      </div>

      {sign && (
        <div className="sign" style={{ "--lc": `var(--${pickedLine.color})` } as Css} aria-live="polite">
          <div className="band">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="#fff" /><circle cx="8" cy="8" r="2.5" fill="currentColor" /></svg>
            {pickedLine.name}
          </div>
          <div className="body">
            <h3>{sign.title}</h3>
            <p style={{ fontSize: 14 }}>{sign.body}</p>
            <div className="eff">
              {sign.effects.map((e) => (
                <div key={e.text}>
                  <span className={`pill ${e.exposure}`}>{EXPOSURE_SHORT[e.exposure]}</span>
                  <span>{e.text}</span>
                </div>
              ))}
            </div>
            {sign.cta && (
              <Link className="cta" href={sign.cta.href}>
                {sign.cta.label}
              </Link>
            )}
            <span className="small">{sign.meta}</span>
          </div>
        </div>
      )}
    </section>
  );
}
