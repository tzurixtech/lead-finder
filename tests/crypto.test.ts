import { beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

describe("segredos cifrados", () => {
  it("decifra de volta o texto original", async () => {
    const { encryptSecret, decryptSecret } = await import("@/lib/crypto");
    const secret = "sk-ant-exemplo-123456";
    const encrypted = encryptSecret(secret);
    expect(encrypted.ciphertext).not.toContain(secret);
    expect(decryptSecret(encrypted)).toBe(secret);
  });

  it("gera IV diferente a cada cifragem", async () => {
    const { encryptSecret } = await import("@/lib/crypto");
    const first = encryptSecret("mesma-chave");
    const second = encryptSecret("mesma-chave");
    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  it("falha ao decifrar quando o texto cifrado é adulterado", async () => {
    const { encryptSecret, decryptSecret } = await import("@/lib/crypto");
    const encrypted = encryptSecret("chave-secreta");
    const tampered = { ...encrypted, ciphertext: Buffer.from("outra-coisa").toString("base64") };
    expect(() => decryptSecret(tampered)).toThrow();
  });
});
