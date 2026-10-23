import { describe, it, expect } from "vitest";
import { ApiError, formError } from "../../frontend/src/content-feedback";

describe("content save feedback", () => {
  it("retains safe request IDs in unexpected errors", () => {
    expect(formError(new ApiError("Try again.",500,"a12bc34de56fa789"))).toBe("Save failed: Try again. Request ID: a12bc34de56fa789");
    expect(new ApiError("Try again.",500,"/home/private/config.php").message).toBe("Try again.");
  });
  it("distinguishes API validation, denied access, conflicts and connectivity", () => {
    expect(formError(new ApiError("Name required",422))).toMatch(/^Validation:/);
    expect(formError(new ApiError("Ask an administrator",403))).toMatch(/^Permission denied:/);
    expect(formError(new ApiError("Refresh and retry",409))).toMatch(/^Save conflict:/);
    expect(formError(new ApiError("Check your connection",0))).toMatch(/^Save failed:/);
  });
  it("identifies schema fields rather than displaying a raw validation object", () => {
    expect(formError({issues:[{path:["tags"],message:"Too many values"}]})).toBe("Validation: Check tags: Too many values");
  });
  it("explains expired sessions without claiming the draft was saved", () => {
    expect(formError(new ApiError("Sign in required",401))).toContain("Your entered values are still here");
  });
});
