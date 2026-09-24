"use client";

// ระดับความละเอียด: เร็ว (15 วิ) / เข้าใจ (1 นาที, ค่าเริ่มต้น) / เจาะลึก (5 นาที)

import { createContext, useContext, useState } from "react";

export type Level = "quick" | "understand" | "deep";

const LevelContext = createContext<Level>("understand");

const LEVELS: { id: Level; name: string; time: string }[] = [
  { id: "quick", name: "เร็ว", time: "15 วินาที" },
  { id: "understand", name: "เข้าใจ", time: "1 นาที" },
  { id: "deep", name: "เจาะลึก", time: "5 นาที" },
];

export function DepthProvider({ children }: { children: React.ReactNode }) {
  const [level, setLevel] = useState<Level>("understand");
  return (
    <LevelContext.Provider value={level}>
      <div className="seg" role="group" aria-label="เลือกระดับความละเอียด">
        {LEVELS.map((l) => (
          <button key={l.id} type="button" className="lv" aria-pressed={level === l.id} onClick={() => setLevel(l.id)}>
            <b>{l.name}</b>
            <span>{l.time}</span>
          </button>
        ))}
      </div>
      {children}
    </LevelContext.Provider>
  );
}

/** แสดงเนื้อหาเฉพาะระดับที่กำหนด */
export function Show({ at, children }: { at: Level[]; children: React.ReactNode }) {
  const level = useContext(LevelContext);
  return at.includes(level) ? <>{children}</> : null;
}
