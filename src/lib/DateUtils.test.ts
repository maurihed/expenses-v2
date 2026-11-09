import { describe, expect, it } from "vitest";
import { getMonthName } from "./DateUtils";

describe("getMonthName", () => {
  it("nombra diciembre correctamente", () => {
    expect(getMonthName(11)).toBe("Diciembre");
  });
});
