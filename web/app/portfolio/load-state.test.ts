import { describe, expect, it } from "vitest";
import { loadReducer, type LoadState } from "./load-state";

const idle: LoadState = { status: "idle", items: [], error: null };

describe("loadReducer", () => {
  it("start: ไปเป็น loading และเก็บ items เดิมไว้ (ไม่กะพริบว่างระหว่างโหลดรอบถัดไป)", () => {
    const prev: LoadState = { status: "done", items: [{ ticker: "DAL", name: "Delta", covered: true, stories: [] }], error: null };
    expect(loadReducer(prev, { type: "start" })).toEqual({ status: "loading", items: prev.items, error: null });
  });

  it("success: ไปเป็น done พร้อม items ใหม่ และล้าง error เดิม", () => {
    const afterError: LoadState = { status: "error", items: [], error: "โหลดไม่สำเร็จ" };
    const items = [{ ticker: "NVDA", name: "NVIDIA", covered: true, stories: [] }];
    expect(loadReducer(afterError, { type: "success", items })).toEqual({ status: "done", items, error: null });
  });

  it("error: ไปเป็น error พร้อมข้อความ และล้าง items ทิ้ง", () => {
    const prev: LoadState = { status: "loading", items: [{ ticker: "DAL", name: "Delta", covered: true, stories: [] }], error: null };
    expect(loadReducer(prev, { type: "error", message: "network down" })).toEqual({ status: "error", items: [], error: "network down" });
  });

  it("empty: ไปเป็น done พร้อม items ว่าง (กรณีไม่มีหุ้นในพอร์ตเลย)", () => {
    expect(loadReducer(idle, { type: "empty" })).toEqual({ status: "done", items: [], error: null });
  });

  it("ลำดับ start → success จำลองการโหลดสำเร็จทั้งวงจร", () => {
    const items = [{ ticker: "DAL", name: "Delta", covered: true, stories: [] }];
    const afterStart = loadReducer(idle, { type: "start" });
    const afterSuccess = loadReducer(afterStart, { type: "success", items });
    expect(afterStart.status).toBe("loading");
    expect(afterSuccess).toEqual({ status: "done", items, error: null });
  });

  it("ลำดับ start → error → start (กดลองใหม่) จำลองการ retry หลังยกเลิก/ล้มเหลว", () => {
    const afterStart1 = loadReducer(idle, { type: "start" });
    const afterError = loadReducer(afterStart1, { type: "error", message: "timeout" });
    const afterRetryStart = loadReducer(afterError, { type: "start" });
    expect(afterError.status).toBe("error");
    expect(afterRetryStart).toEqual({ status: "loading", items: [], error: null });
  });
});
