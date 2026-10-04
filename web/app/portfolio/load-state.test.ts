import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPortfolioItems, FetchTimeoutError, loadReducer, type LoadState } from "./load-state";
import type { PortfolioItem } from "@/app/api/portfolio/route";

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

// ---------- fetchPortfolioItems: ครอบคลุมทุก path ของ request lifecycle โดยไม่ render component จริง ----------
// Mock ของ global.fetch ทุกตัวด้านล่างจำลอง "fetch ที่รับรู้ AbortSignal จริง" เพื่อให้เทสต์ timeout/abort
// สะท้อนพฤติกรรมจริงของเบราว์เซอร์ ไม่ใช่แค่จำลองผิวเผิน
function jsonResponse(body: unknown, ok: boolean, signal?: AbortSignal): Promise<Response> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    signal?.addEventListener("abort", () => reject(signal.reason));
    resolve({ ok, json: async () => body } as Response);
  });
}

function neverSettlingFetch(): typeof fetch {
  return ((_url: string, init?: RequestInit) =>
    new Promise((_resolve, reject) => {
      // fetch() จริงเช็ก signal.aborted ทันทีตอนเรียกด้วย (ไม่ใช่แค่รอ event ในอนาคต) —
      // ต้องจำลองให้ตรงกัน เพราะ signal ที่ส่งเข้ามาอาจ abort ไปแล้วตั้งแต่ก่อนเรียก fetch ก็ได้
      const signal = init?.signal;
      if (signal?.aborted) return reject(signal.reason);
      signal?.addEventListener("abort", () => reject(signal.reason));
    })) as typeof fetch;
}

const sampleItems: PortfolioItem[] = [
  { ticker: "DAL", name: "Delta", covered: true, stories: [] },
  { ticker: "NVDA", name: "NVIDIA", covered: true, stories: [] },
  { ticker: "GOLD", name: "Barrick Gold", covered: true, stories: [] },
];

describe("fetchPortfolioItems", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
  });

  it("1) API ตอบข้อมูลสำเร็จสำหรับ 3 ticker", async () => {
    global.fetch = ((_url: string, init?: RequestInit) =>
      jsonResponse({ ok: true, items: sampleItems }, true, init?.signal ?? undefined)) as typeof fetch;

    const result = await fetchPortfolioItems("DAL,GOLD,NVDA", new AbortController().signal);
    expect(result).toEqual(sampleItems);
  });

  it("2) API ตอบ non-2xx (หรือ ok:false) → reject ด้วยข้อความ error จาก response", async () => {
    global.fetch = ((_url: string, init?: RequestInit) =>
      jsonResponse({ ok: false, error: "ดึงข้อมูลพอร์ตไม่สำเร็จ ลองใหม่อีกครั้ง" }, false, init?.signal ?? undefined)) as typeof fetch;

    await expect(fetchPortfolioItems("DAL", new AbortController().signal)).rejects.toThrow(
      "ดึงข้อมูลพอร์ตไม่สำเร็จ ลองใหม่อีกครั้ง",
    );
  });

  it("3) fetch() เอง reject ตรง ๆ (เช่น network error) → ไหลผ่านไปตรง ๆ ไม่ถูกกลืน", async () => {
    global.fetch = (() => Promise.reject(new TypeError("Failed to fetch"))) as typeof fetch;

    await expect(fetchPortfolioItems("DAL", new AbortController().signal)).rejects.toThrow("Failed to fetch");
  });

  it("4) fetch ไม่ settle เลย (ไม่ resolve ไม่ reject) → timeout แล้ว reject ด้วย FetchTimeoutError ไม่ค้างตลอดไป", async () => {
    global.fetch = neverSettlingFetch();

    const promise = fetchPortfolioItems("DAL", new AbortController().signal, 20000);
    const assertion = expect(promise).rejects.toBeInstanceOf(FetchTimeoutError);
    await vi.advanceTimersByTimeAsync(20000);
    await assertion;
  });

  it("5) ยกเลิกเพราะเปลี่ยน ticker ระหว่างคำขอเก่ายังทำงานอยู่ → reject ด้วย reason ที่ไม่ใช่ FetchTimeoutError (ผู้เรียกแยกแยะได้ว่าไม่ใช่ error จริง)", async () => {
    global.fetch = neverSettlingFetch();
    const controller = new AbortController();

    const promise = fetchPortfolioItems("DAL,NVDA", controller.signal, 20000);
    const assertion = expect(promise).rejects.not.toBeInstanceOf(FetchTimeoutError);
    controller.abort(); // จำลอง effect cleanup ตอน tickerKey เปลี่ยน
    await assertion;
  });

  it("6) คำขอเก่าที่ถูกยกเลิกไปแล้ว ตอบช้ากว่าคำขอใหม่ ต้องไม่ resolve ด้วยข้อมูลเก่าทับคำขอใหม่", async () => {
    const oldController = new AbortController();
    const newController = new AbortController();

    // คำขอเก่า: ไม่ settle เอง จนกว่าจะถูก abort (เหมือนคำขอที่ค้างอยู่จริงบนเครือข่าย)
    global.fetch = neverSettlingFetch();
    const oldPromise = fetchPortfolioItems("DAL,NVDA,GOLD", oldController.signal, 20000);
    const oldAssertion = expect(oldPromise).rejects.not.toBeInstanceOf(FetchTimeoutError);
    oldController.abort(); // ตัวแทนของ effect cleanup เมื่อ tickerKey เปลี่ยน (ลบ ticker ออกไป)
    await oldAssertion; // คำขอเก่าต้องถูก reject จริง ไม่มีทาง resolve มาทับ state ใหม่ได้

    // คำขอใหม่: ตอบสำเร็จตามปกติ ไม่ถูกกระทบจากคำขอเก่าที่ถูกยกเลิกไปแล้ว
    global.fetch = ((_url: string, init?: RequestInit) =>
      jsonResponse({ ok: true, items: [sampleItems[0]] }, true, init?.signal ?? undefined)) as typeof fetch;
    const newResult = await fetchPortfolioItems("DAL", newController.signal, 20000);
    expect(newResult).toEqual([sampleItems[0]]);
  });
});

// ---------- fallback ตอนไม่มี AbortSignal.any (เบราว์เซอร์เก่ากว่า Chrome 116/Firefox 124/Safari 17.4) ----------
// ปิด AbortSignal.any ชั่วคราวเพื่อบังคับให้ fetchPortfolioItems ใช้เส้นทาง fallback ที่เขียนเอง
// แล้วรันชุดสถานการณ์เดิม (timeout, ยกเลิกเพราะเปลี่ยน ticker) ซ้ำผ่านเส้นทางนี้โดยเฉพาะ
// เพื่อยืนยันว่าพฤติกรรมเหมือนเดิมทุกประการแม้ไม่มี native API
describe("fetchPortfolioItems (fallback เมื่อไม่มี AbortSignal.any)", () => {
  const originalFetch = global.fetch;
  const originalAbortSignalAny = AbortSignal.any;

  beforeEach(() => {
    vi.useFakeTimers();
    // @ts-expect-error -- จงใจลบออกชั่วคราวเพื่อจำลองเบราว์เซอร์ที่ไม่รองรับ
    AbortSignal.any = undefined;
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
    AbortSignal.any = originalAbortSignalAny;
  });

  it("timeout ยังทำงานถูกต้องผ่าน fallback (reject ด้วย FetchTimeoutError)", async () => {
    global.fetch = neverSettlingFetch();

    const promise = fetchPortfolioItems("DAL", new AbortController().signal, 20000);
    const assertion = expect(promise).rejects.toBeInstanceOf(FetchTimeoutError);
    await vi.advanceTimersByTimeAsync(20000);
    await assertion;
  });

  it("ยกเลิกเพราะ dependency เปลี่ยนยังทำงานถูกต้องผ่าน fallback (reject ด้วย reason เดิม ไม่ใช่ FetchTimeoutError)", async () => {
    global.fetch = neverSettlingFetch();
    const controller = new AbortController();

    const promise = fetchPortfolioItems("DAL", controller.signal, 20000);
    const assertion = expect(promise).rejects.not.toBeInstanceOf(FetchTimeoutError);
    controller.abort();
    await assertion;
  });

  it("โหลดสำเร็จปกติผ่าน fallback เหมือนเส้นทาง native ทุกประการ", async () => {
    global.fetch = ((_url: string, init?: RequestInit) =>
      jsonResponse({ ok: true, items: sampleItems }, true, init?.signal ?? undefined)) as typeof fetch;

    const result = await fetchPortfolioItems("DAL,GOLD,NVDA", new AbortController().signal);
    expect(result).toEqual(sampleItems);
  });

  it("signal ที่ abort ไปแล้วก่อนเรียกเลย (edge case) ต้อง reject ทันทีผ่าน fallback เช่นกัน", async () => {
    global.fetch = neverSettlingFetch();
    const controller = new AbortController();
    controller.abort(); // abort ไว้ล่วงหน้าก่อนเรียก fetchPortfolioItems เลย

    await expect(fetchPortfolioItems("DAL", controller.signal, 20000)).rejects.not.toBeInstanceOf(FetchTimeoutError);
  });
});
