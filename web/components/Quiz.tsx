"use client";

import { useState } from "react";
import type { Quiz as QuizData } from "@/lib/types";
import { useGame } from "./GameProvider";

/** ทายก่อนอ่าน (เฉพาะหน้าแรก) */
export function Quiz({ quiz }: { quiz: QuizData }) {
  const { answerQuiz } = useGame();
  const [chosen, setChosen] = useState<number | null>(null);
  const answered = chosen !== null;
  const correct = answered && quiz.options[chosen].correct;

  function choose(i: number) {
    if (answered) return;
    setChosen(i);
    answerQuiz(quiz.options[i].correct);
  }

  return (
    <section className="quiz" aria-labelledby="zh">
      <span className="kick">ทายก่อนอ่าน</span>
      <h2 id="zh">{quiz.question}</h2>
      <div className="opts">
        {quiz.options.map((o, i) => {
          const cls = ["opt", answered && o.correct ? "right" : "", chosen === i && !o.correct ? "wrong" : ""].filter(Boolean).join(" ");
          return (
            <button key={o.text} type="button" className={cls} disabled={answered} onClick={() => choose(i)}>
              <i />
              {o.text}
            </button>
          );
        })}
      </div>
      <div className={answered ? "fb on" : "fb"} aria-live="polite">
        {answered && (
          <>
            <b>{correct ? "ถูกต้อง" : "เกือบแล้ว"}</b>
            {quiz.explanation}
            <span className="small" style={{ display: "block", marginTop: 6 }}>
              {quiz.evidenceNote}
            </span>
          </>
        )}
      </div>
    </section>
  );
}
