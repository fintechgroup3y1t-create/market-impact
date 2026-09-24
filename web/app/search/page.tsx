import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { lineVar } from "@/components/LineBadge";
import { dirClass } from "@/components/Metric";
import { StockSearch, type SearchEntry } from "@/components/StockSearch";
import { companies, getLine, getMetrics, storiesForTicker } from "@/lib/data";
import { fillTemplate } from "@/lib/format";

export const metadata: Metadata = { title: "ค้นหุ้น" };

// ราคาที่แสดงมาจากฐานข้อมูล อัปเดตทุกคืนผ่าน cron ให้หน้านี้สร้างใหม่เป็นระยะโดยไม่ต้อง deploy ใหม่
export const revalidate = 1800;

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
