import { direction, fillTemplate, firstMetric } from "@/lib/format";
import type { MarketMetrics } from "@/lib/types";

/** ข้อความที่มี placeholder ตัวเลข เช่น "{{DAL.ret_1d}}" — ต้องส่ง metrics มาจากหน้าที่เรียก (ดู lib/data.ts: getMetrics) */
export function T({ text, metrics }: { text: string; metrics: MarketMetrics }) {
  return <>{fillTemplate(text, metrics)}</>;
}

/** คลาสสีตามทิศทางของตัวเลขตัวแรกในข้อความ */
export function dirClass(text: string, metrics: MarketMetrics): string | undefined {
  const d = direction(firstMetric(text, metrics));
  return d === "up" ? "up" : d === "down" ? "down" : undefined;
}

/** ▲ / ▼ นำหน้าตัวเลข ตามดีไซน์แถบภาพรวมตลาด */
export function Arrowed({ text, metrics }: { text: string; metrics: MarketMetrics }) {
  const d = direction(firstMetric(text, metrics));
  const arrow = d === "up" ? "▲ " : d === "down" ? "▼ " : "";
  const filled = fillTemplate(text, metrics).replace(/^[+−]/, "");
  return (
    <>
      {arrow}
      {filled}
    </>
  );
}
