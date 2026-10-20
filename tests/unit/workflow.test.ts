import { describe, expect, it } from "vitest";
import { canTransition, isFeedbackEligible, nextStatuses, requiresResolutionNote } from "@/lib/workflow";

describe("complaint workflow", () => {
  it("allows the normal forward path", () => {
    expect(canTransition("OPEN", "ASSIGNED")).toBe(true);
    expect(canTransition("ASSIGNED", "IN_PROGRESS")).toBe(true);
    expect(canTransition("IN_PROGRESS", "RESOLVED")).toBe(true);
    expect(canTransition("RESOLVED", "CLOSED")).toBe(true);
  });

  it("allows reopening a resolved complaint", () => {
    expect(canTransition("RESOLVED", "IN_PROGRESS")).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(canTransition("OPEN", "CLOSED")).toBe(false);
    expect(canTransition("CLOSED", "OPEN")).toBe(false);
    expect(canTransition("IN_PROGRESS", "OPEN")).toBe(false);
    expect(nextStatuses("CLOSED")).toEqual([]);
  });

  it("requires a resolution note only for RESOLVED", () => {
    expect(requiresResolutionNote("RESOLVED")).toBe(true);
    expect(requiresResolutionNote("IN_PROGRESS")).toBe(false);
  });

  it("only allows feedback after resolution", () => {
    expect(isFeedbackEligible("RESOLVED")).toBe(true);
    expect(isFeedbackEligible("CLOSED")).toBe(true);
    expect(isFeedbackEligible("OPEN")).toBe(false);
    expect(isFeedbackEligible("IN_PROGRESS")).toBe(false);
  });
});
