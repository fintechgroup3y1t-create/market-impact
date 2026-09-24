import { direction, fillTemplate, firstMetric } from "@/lib/format";
import { metrics } from "@/lib/data";

/** ข้อความที่มี placeholder ตัวเลข เช่น "{{DAL.ret_1d}}" */
export function T({ text }: { text: string }) {
  return <>{fillTemplate(text, metrics)}</>;
}

/** คลาสสีตามทิศทางของตัวเลขตัวแรกในข้อความ */
export function dirClass(text: string): string | undefined {
  const d = direction(firstMetric(text, metrics));
  return d === "up" ? "up" : d === "down" ? "down" : undefined;
}

/** ▲ / ▼ นำหน้าตัวเลข ตามดีไซน์แถบภาพรวมตลาด */
export function Arrowed({ text }: { text: string }) {
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
