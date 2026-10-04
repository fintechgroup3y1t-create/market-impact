import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAndSaveNewsBounded } from "./marketaux";

// สร้าง db จำลองที่ตอบ chain เดียวกับที่ saveArticlesToDb() เรียกจริง: select().from().where() และ
// insert().values().returning() — ไม่ต่อ DB จริง (sandbox นี้เข้า Supabase จริงไม่ได้อยู่แล้ว) แค่จำลองลำดับ
// การเรียกให้ตรงพอให้ทดสอบ logic ของ fetchAndSaveNewsBounded เอง (ไม่ได้ทดสอบ saveArticlesToDb/fetchLatestNews
// ซ้ำ — สองฟังก์ชันนั้นถูกเรียกใช้ตรง ๆ ไม่ได้เขียนใหม่)
function fakeDb(selectResults: unknown[][], nextInsertId = () => 1) {
  let selectCall = 0;
  return {
    select: () => ({ from: () => ({ where: () => Promise.resolve(selectResults[selectCall++] ?? []) }) }),
    insert: () => ({ values: () => ({ returning: () => Promise.resolve([{ id: nextInsertId() }]) }) }),
  } as never;
}

function jsonResponse(body: unknown, signal?: AbortSignal): Promise<Response> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    signal?.addEventListener("abort", () => reject(signal.reason));
    resolve({ ok: true, json: async () => body } as Response);
  });
}

function neverSettlingFetch(): typeof fetch {
  return ((_url: string, init?: RequestInit) =>
    new Promise((_resolve, reject) => {
      const signal = init?.signal;
      if (signal?.aborted) return reject(signal.reason);
      signal?.addEventListener("abort", () => reject(signal.reason));
    })) as typeof fetch;
}

const article1 = {
  uuid: "1",
  title: "ข่าวที่หนึ่ง",
  url: "https://example.com/1",
  source: "example.com",
  published_at: "2026-10-04T10:00:00Z",
  entities: [],
};
const article2 = {
  uuid: "2",
  title: "ข่าวที่สอง",
  url: "https://example.com/2",
  source: "example.com",
  published_at: "2026-10-04T11:00:00Z",
  entities: [],
};

describe("fetchAndSaveNewsBounded", () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.MARKETAUX_API_KEY;

  beforeEach(() => {
    process.env.MARKETAUX_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
    process.env.MARKETAUX_API_KEY = originalKey;
  });

  it("1) ดึงข่าวสำเร็จและไม่เคยมีมาก่อนเลย → บันทึกครบ ไม่มีรายการถูกข้าม", async () => {
    global.fetch = (() => jsonResponse({ data: [article1, article2] })) as typeof fetch;
    // เรียก select 2 ครั้ง (sources ที่มีอยู่, documents ที่มีอยู่) ทั้งคู่ว่างเปล่า = ยังไม่มีอะไรซ้ำ
    const db = fakeDb([[], []]);

    const result = await fetchAndSaveNewsBounded(db as never, 5000);
    expect(result).toEqual({ ok: true, fetched: 2, inserted: 2, skipped: 0, error: null });
  });

  it("2) url ที่มีอยู่แล้วใน DB ต้องไม่ถูกบันทึกซ้ำ (นับเป็น skipped ไม่ใช่ inserted)", async () => {
    global.fetch = (() => jsonResponse({ data: [article1, article2] })) as typeof fetch;
    // select sources: ยังไม่มี source นี้ -> ยังต้อง insert source ใหม่ 1 ตัว
    // select documents: url ของ article1 มีอยู่แล้ว (id 99) -> ไม่ insert ซ้ำ, เหลือ article2 ที่ต้อง insert จริง
    const db = fakeDb([[], [{ id: 99, url: article1.url }]]);

    const result = await fetchAndSaveNewsBounded(db as never, 5000);
    expect(result.ok).toBe(true);
    expect(result.fetched).toBe(2);
    expect(result.inserted).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it("3) Marketaux ตอบผิดพลาด (เช่น โควตาหมด/เน็ตเวิร์กพัง) → ok:false พร้อมข้อความ error ไม่ throw ออกไป", async () => {
    global.fetch = (() => Promise.reject(new TypeError("Failed to fetch"))) as typeof fetch;
    const db = fakeDb([[], []]);

    const result = await fetchAndSaveNewsBounded(db as never, 5000);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Failed to fetch");
    expect(result.fetched).toBe(0);
  });

  it("4) Marketaux ไม่ตอบภายในเวลาที่กำหนด → ยกเลิกเอง ไม่ค้างตลอดไป และไม่ throw ออกไป", async () => {
    vi.useFakeTimers();
    global.fetch = neverSettlingFetch();
    const db = fakeDb([[], []]);

    const promise = fetchAndSaveNewsBounded(db as never, 5000);
    const assertion = expect(promise).resolves.toMatchObject({ ok: false, fetched: 0 });
    await vi.advanceTimersByTimeAsync(5000);
    await assertion;
  });

  it("5) ยังไม่ได้ตั้งค่า MARKETAUX_API_KEY → ok:false ชัดเจน ไม่ throw (ไม่ต่างจากพฤติกรรมเดิมของปุ่มในหน้าแอดมิน)", async () => {
    delete process.env.MARKETAUX_API_KEY;
    global.fetch = (() => jsonResponse({ data: [] })) as typeof fetch;
    const db = fakeDb([[], []]);

    const result = await fetchAndSaveNewsBounded(db as never, 5000);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("MARKETAUX_API_KEY");
  });
});
