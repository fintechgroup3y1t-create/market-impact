// แปลงตัวเลขจาก market_metrics ให้เป็นข้อความ
// ข้อความทุกชิ้น (ทั้งที่ทีมงานเขียนและที่ AI ร่าง) ใส่ตัวเลขผ่าน placeholder เท่านั้น เช่น
//   "ราคา WTI เพิ่มขึ้น {{WTI.ret_1d|abs}}"  ->  "ราคา WTI เพิ่มขึ้น 4.2%"
// ตัวเลขจึงมาจาก backend เสมอ ไม่มีใครพิมพ์หรือแก้เองได้

import type { MarketMetrics, MetricValue } from "./types";

const MINUS = "−"; // เครื่องหมายลบแบบตัวพิมพ์ (−) ตามดีไซน์

export const MISSING = "[ไม่มีข้อมูล]";

function signed(n: number, digits: number): string {
  const s = Math.abs(n).toFixed(digits);
  if (n > 0) return `+${s}`;
  if (n < 0) return `${MINUS}${s}`;
  return s;
}

export function formatMetric(m: MetricValue, abs = false): string {
  const v = abs ? Math.abs(m.value) : m.value;
  switch (m.unit) {
    case "pct":
      return abs ? `${v.toFixed(1)}%` : `${signed(v, 1)}%`;
    case "bps":
      return abs ? `${v.toFixed(0)} bps` : `${signed(v, 0)} bps`;
    case "usd":
      return v.toFixed(2);
    case "number":
      return abs ? v.toFixed(2) : signed(v, 2);
  }
}

/** ทิศทางใช้เลือกสีเท่านั้น (เขียว/แดง) ไม่ได้บอกว่าดีหรือไม่ดี */
export function direction(m: MetricValue | undefined): "up" | "down" | "flat" {
  if (!m || m.value === 0) return "flat";
  return m.value > 0 ? "up" : "down";
}

const PLACEHOLDER = /\{\{([A-Z0-9_]+)\.([a-z0-9_]+)(\|abs)?\}\}/g;

export function lookup(metrics: MarketMetrics, key: string): MetricValue | undefined {
  const [entity, field] = key.split(".");
  return metrics[entity]?.[field];
}

export function fillTemplate(text: string, metrics: MarketMetrics): string {
  return text.replace(PLACEHOLDER, (_all, entity: string, field: string, abs?: string) => {
    const m = metrics[entity]?.[field];
    return m ? formatMetric(m, Boolean(abs)) : MISSING;
  });
}

/** หา placeholder ตัวแรกในข้อความ ใช้เลือกสีของตัวเลข */
export function firstMetric(text: string, metrics: MarketMetrics): MetricValue | undefined {
  const match = new RegExp(PLACEHOLDER.source).exec(text);
  return match ? metrics[match[1]]?.[match[2]] : undefined;
}

const TZ = "Asia/Bangkok";

/** "พฤหัสบดี 24 กันยายน" */
export function thaiDayMonth(iso: string): string {
  return new Intl.DateTimeFormat("th-TH", { weekday: "long", day: "numeric", month: "long", timeZone: TZ }).format(new Date(iso));
}

/** "21:00 น." */
export function thaiTime(iso: string): string {
  return new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ }).format(new Date(iso)) + " น.";
}

/** "24 ก.ย. 21:00 น." */
export function thaiDateTime(iso: string): string {
  const d = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", timeZone: TZ }).format(new Date(iso));
  return `${d} ${thaiTime(iso)}`;
}
