"use client";

// แผนที่ผลกระทบวันนี้ (แผนที่รถไฟฟ้า)
// ชิ้นที่ 1: รูปทรงเส้นวาดไว้ตายตัวตามดีไซน์ ส่วนข้อความในป้ายด้านล่างมาจากข้อมูล
// ภายหลังต้องสร้างรูปทรงจาก impact_chains อัตโนมัติ

import Link from "next/link";
import type { CSSProperties, KeyboardEvent } from "react";
import { useState } from "react";
import { EXPOSURE_SHORT } from "@/lib/labels";
import type { Line, LineColor, MapSign } from "@/lib/types";
import { useGame } from "./GameProvider";

type Css = CSSProperties & Record<`--${string}`, string>;

export function ImpactMap({ lines, signs }: { lines: Line[]; signs: MapSign[] }) {
  const { seeLine } = useGame();
  const [picked, setPicked] = useState(lines[0].id);
  const pickedLine = lines.find((l) => l.id === picked)!;
  const sign = signs.find((s) => s.lineId === picked);
  const byColor = (c: LineColor) => lines.find((l) => l.color === c)!;

  function pick(id: string) {
    setPicked(id);
    seeLine(id);
  }
  const lineProps = (c: LineColor, delay: string) => {
    const l = byColor(c);
    return {
      className: "line",
      "data-line": c,
      style: { "--lc": `var(--${c})`, "--d": delay } as Css,
      tabIndex: 0,
      role: "button",
      "aria-label": l.name,
      "aria-pressed": picked === l.id,
      onClick: () => pick(l.id),
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pick(l.id);
        }
      },
    };
  };

  return (
    <section className="mapcard" aria-labelledby="maph">
      <h2 id="maph">แผนที่ผลกระทบวันนี้</h2>
      <p className="hint">แต่ละสีคือหนึ่งเรื่องในตลาด แตะเพื่อดูว่าเรื่องนั้นไหลไปกระทบใคร</p>
      <div className="chips" role="group" aria-label="เลือกเรื่อง">
        {lines.map((l) => (
          <button key={l.id} type="button" className="chip" style={{ "--lc": `var(--${l.color})` } as Css} aria-pressed={picked === l.id} onClick={() => pick(l.id)}>
            <i />
            {l.short}
          </button>
        ))}
      </div>

      <svg className={`map pick-${pickedLine.color}`} viewBox="0 0 350 412" role="group" aria-label="แผนที่เส้นทางผลกระทบจากเหตุการณ์ไปสู่หุ้น">
        <line className="guide" x1="62" y1="44" x2="350" y2="44" /><line className="guide" x1="62" y1="144" x2="350" y2="144" />
        <line className="guide" x1="62" y1="264" x2="350" y2="264" /><line className="guide" x1="62" y1="364" x2="350" y2="364" />
        <text className="rowlab" x="0" y="48">เหตุการณ์</text><text className="rowlab" x="0" y="148">เศรษฐกิจ</text>
        <text className="rowlab" x="0" y="268">อุตสาหกรรม</text><text className="rowlab" x="0" y="368">หุ้น</text>

        <g {...lineProps("a", ".1s")}>
          <path className="hit" d="M96 44V364M96 196L164 264V364" />
          <path className="trk" pathLength={1} d="M96 44V364" />
          <path className="trk" pathLength={1} d="M96 144V196L164 264V364" />
          <g className="pop">
            <circle className="term" cx="96" cy="44" r="11" /><circle className="dot" cx="96" cy="44" r="4" />
            <text className="lab" x="96" y="74" textAnchor="middle">น้ำมันพุ่ง</text>
            <circle className="st" cx="96" cy="144" r="8" />
            <text className="lab" x="96" y="170" textAnchor="middle"><tspan x="96">ต้นทุน</tspan><tspan x="96" dy="14">พลังงานสูง</tspan></text>
            <circle className="st" cx="96" cy="264" r="8" />
            <text className="lab" x="96" y="292" textAnchor="middle">พลังงาน</text>
            <circle className="st" cx="164" cy="264" r="8" />
            <text className="lab" x="164" y="292" textAnchor="middle">สายการบิน</text>
            <rect className="stk pos" x="71" y="351" width="50" height="26" rx="13" /><text className="tk" x="96" y="369" textAnchor="middle">XOM</text>
            <text className="ex pos" x="96" y="396" textAnchor="middle">{EXPOSURE_SHORT.pos}</text>
            <rect className="stk neg" x="139" y="351" width="50" height="26" rx="13" /><text className="tk" x="164" y="369" textAnchor="middle">DAL</text>
            <text className="ex neg" x="164" y="396" textAnchor="middle">{EXPOSURE_SHORT.neg}</text>
          </g>
        </g>

        <g {...lineProps("b", ".35s")}>
          <path className="hit" d="M240 44V364" />
          <path className="trk" pathLength={1} d="M240 44V364" />
          <g className="pop">
            <circle className="term" cx="240" cy="44" r="11" /><circle className="dot" cx="240" cy="44" r="4" />
            <text className="lab" x="240" y="74" textAnchor="middle"><tspan x="240">รอตัวเลข</tspan><tspan x="240" dy="14">เงินเฟ้อ</tspan></text>
            <circle className="st" cx="240" cy="144" r="8" />
            <text className="lab" x="240" y="170" textAnchor="middle"><tspan x="240">ทิศทาง</tspan><tspan x="240" dy="14">ดอกเบี้ย</tspan></text>
            <circle className="st" cx="240" cy="264" r="8" />
            <text className="lab" x="240" y="292" textAnchor="middle">หุ้นเทค</text>
            <rect className="stk mix" x="213" y="351" width="54" height="26" rx="13" /><text className="tk" x="240" y="369" textAnchor="middle">NVDA</text>
            <text className="ex mix" x="240" y="396" textAnchor="middle">{EXPOSURE_SHORT.mix}</text>
          </g>
        </g>

        <g {...lineProps("c", ".6s")}>
          <path className="hit" d="M312 44V364" />
          <path className="trk" pathLength={1} d="M312 44V364" />
          <g className="pop">
            <circle className="term" cx="312" cy="44" r="11" /><circle className="dot" cx="312" cy="44" r="4" />
            <text className="lab" x="312" y="74" textAnchor="middle"><tspan x="312">ดอลลาร์</tspan><tspan x="312" dy="14">อ่อนค่า</tspan></text>
            <circle className="st" cx="312" cy="144" r="8" />
            <text className="lab" x="312" y="170" textAnchor="middle"><tspan x="312">ราคา</tspan><tspan x="312" dy="14">โภคภัณฑ์</tspan></text>
            <circle className="st" cx="312" cy="264" r="8" />
            <text className="lab" x="312" y="292" textAnchor="middle">เหมืองทอง</text>
            <rect className="stk pos" x="287" y="351" width="50" height="26" rx="13" /><text className="tk" x="312" y="369" textAnchor="middle">NEM</text>
            <text className="ex pos" x="312" y="396" textAnchor="middle">{EXPOSURE_SHORT.pos}</text>
          </g>
        </g>
      </svg>

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
