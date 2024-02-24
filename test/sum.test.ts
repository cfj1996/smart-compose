import { describe, expect, it } from "vitest";
import { smartCompose } from "../src/smart-compose";

describe("add", () => {
  it("should sum of 2 and 3 equals to 5", () => {
    expect(smartCompose(2, 3)).toEqual(5);
  });
});
