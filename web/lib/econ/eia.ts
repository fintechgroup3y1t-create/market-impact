// ดึงข้อมูลสต็อกน้ำมันดิบสหรัฐฯ รายสัปดาห์จาก EIA (Energy Information Administration) แผนฟรี
// เอกสาร: https://www.eia.gov/opendata/documentation.php

export class EiaError extends Error {}

export interface EiaResult {
  /** หน่วยล้านบาร์เรล (แปลงจาก "พันบาร์เรล" ที่ EIA ส่งมาให้แล้ว) */
  latest: number;
  previous: number;
  latestDate: string;
  previousDate: string;
}

interface EiaRow {
  period: string;
  value: string | number;
}

/** สต็อกน้ำมันดิบคงเหลือสหรัฐฯ ทั้งประเทศ (ไม่รวม Strategic Petroleum Reserve) รายสัปดาห์ */
export async function getCrudeStocks(): Promise<EiaResult> {
  const key = process.env.EIA_API_KEY;
  if (!key) throw new EiaError("ไม่พบ EIA_API_KEY");
  const params = new URLSearchParams({
    api_key: key,
    frequency: "weekly",
    "data[0]": "value",
    "facets[series][]": "WCESTUS1",
    "sort[0][column]": "period",
    "sort[0][direction]": "desc",
    length: "2",
  });
  const res = await fetch(`https://api.eia.gov/v2/petroleum/stoc/wstk/data/?${params}`, { cache: "no-store" });
  if (!res.ok) throw new EiaError(`EIA ตอบกลับผิดพลาด (${res.status})`);
  const data = (await res.json()) as { response?: { data?: EiaRow[] } };
  const rows = data.response?.data ?? [];
  if (rows.length < 2) throw new EiaError("ข้อมูลไม่พอจาก EIA");

  return {
    latest: Number(rows[0].value) / 1000, // พันบาร์เรล -> ล้านบาร์เรล
    previous: Number(rows[1].value) / 1000,
    latestDate: rows[0].period,
    previousDate: rows[1].period,
  };
}
