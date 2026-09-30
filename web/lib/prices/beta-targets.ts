// รายชื่อหุ้นที่หน้า "ทำไมถึงเป็นหุ้นตัวนี้" สัญญาไว้แล้วว่าจะโชว์ Beta ของปัจจัยไหน
// ต้องตรงกับ placeholder ที่ใช้จริงใน lib/sample/data.ts (beta_oil_2y / beta_rate_2y / beta_dxy_2y)
// อัปเดตรายการนี้ทุกครั้งที่เพิ่มหน้าหลักฐานใหม่ที่มี placeholder beta_*_2y

export type BetaFactor = "oil" | "rate" | "dxy";

export interface BetaProxy {
  /** ticker ที่ยิง Tiingo ดึงประวัติราคาย้อนหลัง (ETF ตัวแทน เหมือนที่ใช้ดึงราคาล่าสุดใน tiingo.ts) */
  fetchTicker: string;
  /** ETF ตัวนี้เคลื่อนไหว "ตรงข้าม" กับปัจจัยที่ป้ายบอกไหม
   * เช่น TLT (พันธบัตรระยะยาว) ราคาขึ้น = ดอกเบี้ยลง, GLD (ทองคำ) ราคาขึ้น = ดอลลาร์มักอ่อนค่า
   * ถ้าตรงข้าม ต้องกลับเครื่องหมาย Beta ก่อนบันทึก ไม่งั้นค่าที่โชว์จะสวนทางกับความหมายของป้าย */
  inverse: boolean;
  /** ต่อท้าย ticker เป็นชื่อ metric ใน market_metrics เช่น "beta_oil_2y" */
  metricSuffix: string;
}

export const BETA_PROXIES: Record<BetaFactor, BetaProxy> = {
  oil: { fetchTicker: "USO", inverse: false, metricSuffix: "beta_oil_2y" },
  rate: { fetchTicker: "TLT", inverse: true, metricSuffix: "beta_rate_2y" },
  dxy: { fetchTicker: "GLD", inverse: true, metricSuffix: "beta_dxy_2y" },
};

export const BETA_TARGETS: Record<string, BetaFactor> = {
  // สายน้ำมัน
  DAL: "oil", XOM: "oil", COP: "oil", LUV: "oil", FDX: "oil", DOW: "oil",
  UAL: "oil", UPS: "oil", CAT: "oil", CVX: "oil", TSLA: "oil", F: "oil", BA: "oil",
  // สายเงินเฟ้อ / ดอกเบี้ย
  NVDA: "rate", MSFT: "rate", GOOGL: "rate", AMD: "rate", AMZN: "rate", INTC: "rate",
  JPM: "rate", BAC: "rate", DHI: "rate", VZ: "rate", T: "rate", JNJ: "rate", NEE: "rate", WMT: "rate",
  // สายดอลลาร์
  NEM: "dxy", GOLD: "dxy", FCX: "dxy", PG: "dxy", KO: "dxy", AAPL: "dxy", MCD: "dxy", PFE: "dxy",
};
