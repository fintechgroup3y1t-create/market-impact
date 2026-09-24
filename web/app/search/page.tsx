import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { lineVar } from "@/components/LineBadge";
import { dirClass } from "@/components/Metric";
import { StockSearch, type SearchEntry } from "@/components/StockSearch";
import { companies, getLine, getMetrics, storiesForTicker } from "@/lib/data";
import { fillTemplate } from "@/lib/format";

export const metadata: Metadata = { title: "ค้นหุ้น" };

// เดินผ่านทุกบริษัทเพื่อหาเหตุการณ์ที่เกี่ยวข้อง (storiesForTicker) ทำให้ prerender ตอน build ช้าเกิน 60 วิที่ Vercel กำหนด
// (ต้องคุย DB ข้ามภูมิภาคหลายรอบ) เปลี่ยนเป็นสร้างตอนมีคนเข้าดูจริงแทน
export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const metrics = await getMetrics();
  const entries: SearchEntry[] = await Promise.all(
    companies.map(async (c) => {
      const tpl = `{{${c.ticker}.ret_1d}}`;
      const stories = await storiesForTicker(c.ticker);
      return {
        ticker: c.ticker,
        name: c.name,
        covered: c.covered,
        ret: fillTemplate(tpl, metrics),
        dir: dirClass(tpl, metrics) as SearchEntry["dir"],
        sensitivities: c.sensitivities,
        stories: stories.map((s) => ({ ...s, color: lineVar(getLine(s.lineId)) })),
      };
    }),
  );
  return (
    <>
      <h1 className="mood" style={{ marginTop: 22, fontSize: 34 }}>
        หุ้นของคุณ
        <br />
        เกี่ยวกับเรื่องไหนบ้าง
      </h1>
      <StockSearch entries={entries} initial="DAL" />
      <Footer />
    </>
  );
}
