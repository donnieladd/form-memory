import { createHash, randomBytes } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

const root = process.cwd();
const envPath = path.join(root, ".env.local");

function loadEnv() {
  if (!existsSync(envPath)) return {};
  const lines = readFileSync(envPath, "utf8").split("\n");
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return env;
}

function saveEnvKey(key) {
  const env = loadEnv();
  env.FORM_MEMORY_API_KEY = key;
  const body = Object.entries(env)
    .map(([name, value]) => `${name}=${value}`)
    .join("\n");
  writeFileSync(envPath, `${body}\n`, "utf8");
}

const key = `fm_live_${randomBytes(24).toString("hex")}`;
const prefix = key.slice(0, 12);
const hash = createHash("sha256").update(key).digest("hex");

console.log("Form Memory API key generated.\n");
console.log(`Key (store securely — shown once):\n  ${key}\n`);
console.log(`Prefix: ${prefix}`);
console.log(`SHA-256: ${hash.slice(0, 16)}...\n`);
console.log("Set in Supabase Edge Function secrets:");
console.log(`  supabase secrets set FORM_MEMORY_API_KEY=${key}\n`);
console.log("Set in local .env.local for apps:");
saveEnvKey(key);
console.log(`  Wrote FORM_MEMORY_API_KEY to ${envPath}`);
