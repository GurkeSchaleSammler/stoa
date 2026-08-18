import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export class SecretBox {
  constructor(private readonly key: Buffer) {
    if (key.length !== 32) throw new Error("SecretBox requires a 32-byte key.");
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".");
  }

  decrypt(payload: string): string {
    const parts = payload.split(".");
    if (parts.length !== 3) throw new Error("Invalid encrypted payload.");
    const [ivPart, tagPart, ciphertextPart] = parts;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      this.key,
      Buffer.from(ivPart as string, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagPart as string, "base64url"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextPart as string, "base64url")),
      decipher.final(),
    ]);
    return plaintext.toString("utf8");
  }
}
