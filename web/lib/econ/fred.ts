// ดึงข้อมูลเศรษฐกิจจาก FRED (Federal Reserve Economic Data) แผนฟรี
// เอกสาร: https://fred.stlouisfed.org/docs/api/fred/series_observations.html

export class FredError extends Error {}

export interface FredResult {
  latest: number;
  previous: number;
  latestDate: string;
  previousDate: string;
}

interface FredObservation {
  date: string;
  value: string; // "." = ไม่มีข้อมูลช่วงนั้น
}

/**
 * @param seriesId รหัสชุดข้อมูลของ FRED เช่น "CPIAUCSL"
 * @param units การแปลงค่าให้ FRED คำนวณให้ก่อนส่งมา: "pc1" = % เทียบปีก่อน, "chg" = ผลต่างจากงวดก่อน, ไม่ใส่ = ค่าดิบ
 */
async function fetchObservations(seriesId: string, units?: "pc1" | "chg"): Promise<FredResult> {
  const key = process.env.FRED_API_KEY;
  if (!key) throw new FredError("ไม่พบ FRED_API_KEY");
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: key,
    file_type: "json",
    sort_order: "desc",
    limit: "6", // ขอมาหลายจุด เผื่อจุดล่าสุดยังเป็น "." (ยังไม่ประกาศ)
  });
  if (units) params.set("units", units);

  const res = await fetch(`https://api.stlouisfed.org/fred/series/observations?${params}`, { cache: "no-store" });
  if (!res.ok) throw new FredError(`FRED ตอบกลับผิดพลาด (${res.status}) สำหรับ ${seriesId}`);
  const data = (await res.json()) as { observations?: FredObservation[] };
  const obs = (data.observations ?? []).filter((o) => o.value !== ".");
  if (obs.length < 2) throw new FredError(`ข้อมูลไม่พอสำหรับ ${seriesId}`);

  return {
    latest: parseFloat(obs[0].value),
    previous: parseFloat(obs[1].value),
    latestDate: obs[0].date,
    previousDate: obs[1].date,
  };
}

/** เงินเฟ้อสหรัฐฯ (CPI) เทียบปีก่อน หน่วย % */
export const getCpiYoy = () => fetchObservations("CPIAUCSL", "pc1");

/** อัตราดอกเบี้ย Fed Funds เฉลี่ยรายเดือน (effective rate) หน่วย % */
export const getFedFundsRate = () => fetchObservations("FEDFUNDS");

/** การเปลี่ยนแปลงการจ้างงานนอกภาคเกษตรจากเดือนก่อน หน่วยพันตำแหน่ง */
export const getNonfarmPayrollChange = () => fetchObservations("PAYEMS", "chg");
