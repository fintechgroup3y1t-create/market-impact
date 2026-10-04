import { describe, expect, it } from "vitest";
import { MAX_TICKERS, parseStoredTickers, toggleTicker } from "./WatchlistProvider";

describe("parseStoredTickers", () => {
  it("returns empty array when nothing stored", () => {
    expect(parseStoredTickers(null)).toEqual([]);
  });

  it("parses a valid JSON array of strings", () => {
    expect(parseStoredTickers('["AAPL","DAL"]')).toEqual(["AAPL", "DAL"]);
  });

  it("returns empty array for corrupted JSON instead of throwing", () => {
    expect(parseStoredTickers("{not valid json")).toEqual([]);
  });

  it("drops non-string entries and ignores a non-array value", () => {
    expect(parseStoredTickers('["AAPL", 5, null, "DAL"]')).toEqual(["AAPL", "DAL"]);
    expect(parseStoredTickers('{"a":1}')).toEqual([]);
  });
});

describe("toggleTicker", () => {
  it("adds a ticker that isn't in the list yet, normalized to uppercase", () => {
    expect(toggleTicker([], "aapl")).toEqual(["AAPL"]);
    expect(toggleTicker(["DAL"], "xom")).toEqual(["DAL", "XOM"]);
  });

  it("removes a ticker already in the list (toggle off)", () => {
    expect(toggleTicker(["DAL", "XOM"], "DAL")).toEqual(["XOM"]);
    expect(toggleTicker(["DAL", "XOM"], "dal")).toEqual(["XOM"]); // เทียบแบบไม่สนตัวพิมพ์
  });

  it("does not add past the max cap, and leaves the list unchanged", () => {
    const full = Array.from({ length: 3 }, (_, i) => `T${i}`);
    expect(toggleTicker(full, "NEW", 3)).toEqual(full);
  });

  it("removing still works even when the list is already at the cap", () => {
    const full = ["A", "B", "C"];
    expect(toggleTicker(full, "B", 3)).toEqual(["A", "C"]);
  });

  it("default max matches the exported MAX_TICKERS constant", () => {
    const full = Array.from({ length: MAX_TICKERS }, (_, i) => `T${i}`);
    expect(toggleTicker(full, "NEW")).toEqual(full);
    expect(toggleTicker(full, "NEW", MAX_TICKERS + 1)).toContain("NEW");
  });
});
