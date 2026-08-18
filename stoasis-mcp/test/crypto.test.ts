import { describe, expect, it } from "vitest";
import { hashSecret, SecretBox } from "../src/crypto.js";

describe("SecretBox", () => {
  it("encrypts and authenticates a Stoasis session cookie", () => {
    const box = new SecretBox(Buffer.alloc(32, 7));
    const encrypted = box.encrypt("stoasis_session=secret-session");

    expect(encrypted).not.toContain("secret-session");
    expect(box.decrypt(encrypted)).toBe("stoasis_session=secret-session");
    expect(() => box.decrypt(`${encrypted.slice(0, -1)}x`)).toThrow();
  });

  it("hashes bearer material deterministically without storing it", () => {
    expect(hashSecret("token")).toBe(hashSecret("token"));
    expect(hashSecret("token")).not.toBe("token");
  });
});
