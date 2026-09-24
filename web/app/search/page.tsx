import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { lineVar } from "@/components/LineBadge";
import { dirClass } from "@/components/Metric";
import { StockSearch, type SearchEntry } from "@/components/StockSearch";
import { companies, getLine, metrics, storiesForTicker } from "@/lib/data";
import { fillTemplate } from "@/lib/format";

export const metadata: Metadata = { title: "ค้นหุ้น" };

export default function SearchPage() {
  const entries: SearchEntry[] = companies.map((c) => {
    const tpl = `{{${c.ticker}.ret_1d}}`;
    return {
      ticker: c.ticker,
      name: c.name,
      covered: c.covered,
      ret: fillTemplate(tpl, metrics),
      dir: dirClass(tpl) as SearchEntry["dir"],
      sensitivities: c.sensitivities,
      stories: storiesForTicker(c.ticker).map((s) => ({ ...s, color: lineVar(getLine(s.lineId)) })),
    };
  });
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
