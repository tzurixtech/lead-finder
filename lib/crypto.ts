// lib/crypto.ts
// Cifra/decifra segredos (chaves de API dos usuários) com AES-256-GCM.
// A chave-mestra vem de ENCRYPTION_KEY (32 bytes em base64). SERVIDOR APENAS.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

export interface Encrypted {
  ciphertext: string;
  iv: string;
  tag: string;
}

function masterKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("Variável de ambiente ausente: ENCRYPTION_KEY");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY deve ter 32 bytes em base64 (ex.: openssl rand -base64 32).");
  }
  return key;
}

export function encryptSecret(plaintext: string): Encrypted {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, masterKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptSecret(data: Encrypted): string {
  const decipher = createDecipheriv(ALGORITHM, masterKey(), Buffer.from(data.iv, "base64"));
  decipher.setAuthTag(Buffer.from(data.tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(data.ciphertext, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
