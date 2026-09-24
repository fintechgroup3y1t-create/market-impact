"use client";

// ภารกิจและ XP ของหน้าแรก
// ชิ้นที่ 1: เก็บในหน่วยความจำเท่านั้น (รีเฟรชแล้วเริ่มใหม่) ตัวเลขเริ่มต้นเป็นค่าตัวอย่าง
// ชิ้นที่ 6: ย้ายไปเก็บใน localStorage ตาม CLAUDE.md
// XP ให้เฉพาะการเรียนรู้และการเปิดดูหลักฐาน ห้ามผูกกับการซื้อขาย

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type QuestId = "lines" | "quiz" | "evidence";

interface GameState {
  xp: number;
  xpGoal: number;
  level: number;
  levelName: string;
  streakDays: number;
  seenLines: string[];
  totalLines: number;
  done: Record<QuestId, boolean>;
  seeLine: (lineId: string) => void;
  answerQuiz: (correct: boolean) => void;
  openEvidence: () => void;
}

const GameContext = createContext<GameState | null>(null);

export function useGame(): GameState {
  const g = useContext(GameContext);
  if (!g) throw new Error("useGame ต้องอยู่ภายใน GameProvider");
  return g;
}

const TOTAL_LINES = 3;

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [xp, setXp] = useState(120);
  const [seenLines, setSeenLines] = useState<string[]>(["oil"]);
  const [done, setDone] = useState<Record<QuestId, boolean>>({ lines: false, quiz: false, evidence: false });
  const [toast, setToast] = useState<{ n: number; msg: string } | null>(null);
  const doneRef = useRef(done);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const gain = useCallback((n: number, msg: string) => {
    setXp((x) => x + n);
    setToast({ n, msg });
    timers.current.push(setTimeout(() => setToast(null), 1900));
  }, []);

  const complete = useCallback(
    (id: QuestId, n: number, msg: string) => {
      if (doneRef.current[id]) return;
      const next = { ...doneRef.current, [id]: true };
      doneRef.current = next;
      setDone(next);
      gain(n, msg);
      if (next.lines && next.quiz && next.evidence) {
        timers.current.push(setTimeout(() => gain(20, "ครบทุกสถานีวันนี้ ได้เหรียญ รู้ทันน้ำมัน"), 2000));
      }
    },
    [gain],
  );

  const seeLine = useCallback(
    (lineId: string) => {
      setSeenLines((prev) => {
        if (prev.includes(lineId)) return prev;
        const next = [...prev, lineId];
        if (next.length === TOTAL_LINES) queueMicrotask(() => complete("lines", 40, "สำรวจครบทุกสายแล้ว"));
        return next;
      });
    },
    [complete],
  );

  const answerQuiz = useCallback(
    (correct: boolean) => complete("quiz", correct ? 30 : 15, correct ? "ตอบถูก" : "ได้เรียนรู้เพิ่ม"),
    [complete],
  );
  const openEvidence = useCallback(() => complete("evidence", 10, "เปิดดูหลักฐานแล้ว"), [complete]);

  return (
    <GameContext.Provider
      value={{
        xp,
        xpGoal: 300,
        level: 3,
        levelName: "นักสังเกตตลาด",
        streakDays: 5,
        seenLines,
        totalLines: TOTAL_LINES,
        done,
        seeLine,
        answerQuiz,
        openEvidence,
      }}
    >
      {children}
      <div className={toast ? "toast on" : "toast"} role="status">
        {toast && (
          <>
            <b>+{toast.n} XP</b>
            {toast.msg}
          </>
        )}
      </div>
    </GameContext.Provider>
  );
}

/** วางไว้ในหน้าที่นับว่า "เปิดดูหลักฐาน" */
export function MarkEvidenceOpened() {
  const { openEvidence } = useGame();
  useEffect(() => openEvidence(), [openEvidence]);
  return null;
}
