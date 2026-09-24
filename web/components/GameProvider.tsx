"use client";

// ภารกิจและ XP ของหน้าแรก
// ชิ้นที่ 6: เก็บใน localStorage ของเบราว์เซอร์ผู้ใช้ (ยังไม่มีระบบสมาชิก ตาม CLAUDE.md)
// - XP สะสมข้ามวัน, ภารกิจ 3 สถานี ("เส้นทางเรียนรู้วันนี้") รีเซ็ตทุกวันใหม่
// - นับวันอ่านต่อเนื่อง (streak) จากวันที่เข้าเว็บจริง ไม่ใช่ค่าคงที่
// - XP ให้เฉพาะการเรียนรู้และการเปิดดูหลักฐาน ห้ามผูกกับการซื้อขาย

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
const STORAGE_KEY = "mi_game_v1";
const EMPTY_DONE: Record<QuestId, boolean> = { lines: false, quiz: false, evidence: false };

// เลเวลอิงจาก XP สะสมทั้งหมด (ไม่รีเซ็ตรายวัน)
const LEVELS = [
  { name: "นักอ่านมือใหม่", min: 0 },
  { name: "นักสังเกตตลาด", min: 100 },
  { name: "นักวิเคราะห์ฝึกหัด", min: 250 },
  { name: "นักลงทุนที่เข้าใจเหตุผล", min: 500 },
  { name: "ผู้เชี่ยวชาญ Impact Chain", min: 1000 },
];

function levelInfo(xp: number) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].min) idx = i;
  const next = LEVELS[idx + 1];
  return { level: idx + 1, levelName: LEVELS[idx].name, xpGoal: next ? next.min : xp };
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateMinusOne(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d - 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

interface SavedState {
  xp: number;
  lastActiveDate: string;
  streakDays: number;
  todayDate: string;
  seenLines: string[];
  done: Record<QuestId, boolean>;
}

function freshState(today: string): SavedState {
  return { xp: 0, lastActiveDate: today, streakDays: 1, todayDate: today, seenLines: [], done: { ...EMPTY_DONE } };
}

/** อ่านค่าจาก localStorage ตอนเปิดเว็บ ถ้าข้ามวันใหม่: รีเซ็ตภารกิจวันนี้แต่เก็บ XP สะสมไว้ และอัปเดตวันอ่านต่อเนื่อง */
function loadState(): SavedState {
  const today = todayStr();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState(today);
    const saved = JSON.parse(raw) as SavedState;
    if (saved.todayDate === today) return saved;
    const streakDays = saved.lastActiveDate === dateMinusOne(today) ? saved.streakDays + 1 : 1;
    return { xp: saved.xp, lastActiveDate: today, streakDays, todayDate: today, seenLines: [], done: { ...EMPTY_DONE } };
  } catch {
    return freshState(today);
  }
}

function saveState(s: SavedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // localStorage ใช้ไม่ได้ (เช่น โหมดส่วนตัว) ไม่ให้หน้าเว็บพัง แค่ไม่บันทึกความคืบหน้า
  }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  // ค่าเริ่มต้นตอน render ฝั่งเซิร์ฟเวอร์/ก่อนโหลด localStorage ต้องเหมือนกันเป๊ะเพื่อไม่ให้ hydration ไม่ตรงกัน
  const [xp, setXp] = useState(0);
  const [streakDays, setStreakDays] = useState(1);
  const [seenLines, setSeenLines] = useState<string[]>([]);
  const [done, setDone] = useState<Record<QuestId, boolean>>({ ...EMPTY_DONE });
  const [toast, setToast] = useState<{ n: number; msg: string } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const doneRef = useRef(done);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastActiveDateRef = useRef(todayStr());

  useEffect(() => {
    const saved = loadState();
    setXp(saved.xp);
    setStreakDays(saved.streakDays);
    setSeenLines(saved.seenLines);
    setDone(saved.done);
    doneRef.current = saved.done;
    lastActiveDateRef.current = saved.lastActiveDate;
    setHydrated(true);
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (!hydrated) return; // อย่าเขียนทับค่าเดิมก่อนโหลดจาก localStorage เสร็จ
    saveState({ xp, lastActiveDate: lastActiveDateRef.current, streakDays, todayDate: todayStr(), seenLines, done });
  }, [hydrated, xp, streakDays, seenLines, done]);

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

  const { level, levelName, xpGoal } = levelInfo(xp);

  return (
    <GameContext.Provider
      value={{
        xp,
        xpGoal,
        level,
        levelName,
        streakDays,
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
