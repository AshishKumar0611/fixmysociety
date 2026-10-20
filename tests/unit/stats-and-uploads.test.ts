import { describe, expect, it } from "vitest";
import { averageHours, buildTrend, emptyStatusCounts, summarize } from "@/server/services/stats";
import { sniffImageType, validateImageUpload } from "@/lib/uploads";
import { resolveRange } from "@/lib/date-range";

describe("metric calculations", () => {
  it("handles an empty dataset without dividing by zero", () => {
    expect(summarize(emptyStatusCounts())).toEqual({ total: 0, open: 0, inProgress: 0, resolved: 0, resolutionRate: null });
    expect(averageHours([])).toBeNull();
  });

  it("groups statuses consistently", () => {
    const s = summarize({ OPEN: 2, ASSIGNED: 1, IN_PROGRESS: 3, RESOLVED: 3, CLOSED: 1 });
    expect(s).toMatchObject({ total: 10, open: 3, inProgress: 3, resolved: 4 });
    expect(s.resolutionRate).toBeCloseTo(0.4);
  });

  it("averages real resolution durations and ignores unresolved items", () => {
    const t = new Date("2026-10-01T00:00:00Z");
    const h = (n: number) => new Date(t.getTime() + n * 3_600_000);
    expect(averageHours([{ createdAt: t, resolvedAt: h(10) }, { createdAt: t, resolvedAt: h(20) }, { createdAt: t, resolvedAt: null }])).toBe(15);
  });

  it("builds a continuous daily trend", () => {
    const from = new Date("2026-10-01T00:00:00+05:30");
    const to = new Date("2026-10-07T23:00:00+05:30");
    const { buckets, granularity } = buildTrend([new Date("2026-10-02T10:00:00+05:30"), new Date("2026-10-02T12:00:00+05:30")], [new Date("2026-10-05T09:00:00+05:30")], from, to);
    expect(granularity).toBe("day");
    expect(buckets).toHaveLength(7);
    expect(buckets[1]!.submitted).toBe(2);
    expect(buckets[4]!.resolved).toBe(1);
    expect(buckets.reduce((a, b) => a + b.submitted, 0)).toBe(2);
  });

  it("switches to weekly buckets for long ranges", () => {
    expect(buildTrend([], [], new Date("2026-07-01T00:00:00Z"), new Date("2026-10-01T00:00:00Z")).granularity).toBe("week");
  });

  it("resolves analytics date ranges safely", () => {
    const now = new Date("2026-10-20T12:00:00+05:30");
    expect(resolveRange({ range: "7" }, now).from.toISOString()).toBe(new Date("2026-10-14T00:00:00+05:30").toISOString());
    expect(resolveRange({ range: "bogus" }, now).key).toBe("30");
    expect(resolveRange({ range: "custom", from: "2026-10-10", to: "2026-10-01" }, now).key).toBe("30");
    expect(resolveRange({ range: "custom", from: "2026-10-01", to: "2026-10-10" }, now).key).toBe("custom");
  });
});

describe("image upload validation", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);

  it("detects real image signatures", () => {
    expect(sniffImageType(png)).toBe("image/png");
    expect(sniffImageType(jpeg)).toBe("image/jpeg");
    expect(sniffImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  });

  it("accepts a genuine PNG", async () => {
    const r = await validateImageUpload(new File([png], "leak.png", { type: "image/png" }));
    expect(r.ok && r.image?.mimeType).toBe("image/png");
  });

  it("rejects a disguised file and disallowed types", async () => {
    const fake = await validateImageUpload(new File(["<script>"], "photo.jpg", { type: "image/jpeg" }));
    expect(fake.ok).toBe(false);
    const svg = await validateImageUpload(new File(["<svg/>"], "x.svg", { type: "image/svg+xml" }));
    expect(svg.ok).toBe(false);
  });

  it("rejects files over 2 MB", async () => {
    const big = new Uint8Array(2 * 1024 * 1024 + 1);
    big.set(png);
    expect((await validateImageUpload(new File([big], "big.png", { type: "image/png" }))).ok).toBe(false);
  });

  it("treats an empty file input as no photo", async () => {
    expect(await validateImageUpload(new File([], "", { type: "application/octet-stream" }))).toEqual({ ok: true, image: null });
  });
});
