// main.ts — entrypoint for post-x-promote-make-your-own-bounty-01.
//
// The entry is one post on X. This program does exactly what the
// competition's rules ask of it: it reads POST.json from the repository
// root, checks that it names an X post address, and copies it to the
// output directory the grader reads (/output, or MAKEFUN_OUTPUT_DIR).
// It takes no network, no environment secrets, and no arguments.

import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repoDir = process.env.MAKEFUN_BOT_DIR ?? ".";
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// An X post address: https://x.com/<handle>/status/<digits> (or the
// same on twitter.com, with optional www./mobile. prefix, or the
// /i/web/status/<digits> form). A query or fragment after it is ignored.
const POST_URL =
  /^https:\/\/(www\.|mobile\.)?(x\.com|twitter\.com)\/([A-Za-z0-9_]{1,15}|i\/web)\/status\/(\d+)([?#].*)?$/;

function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

const postPath = join(repoDir, "POST.json");
let raw: string;
try {
  raw = readFileSync(postPath, "utf8");
} catch {
  fail(`cannot read ${postPath}`);
}

// The gate refuses a POST.json over 16384 bytes.
if (Buffer.byteLength(raw, "utf8") > 16384) {
  fail("POST.json is over the 16384-byte limit");
}

let post: unknown;
try {
  post = JSON.parse(raw!);
} catch {
  fail("POST.json is not valid JSON");
}

if (typeof post !== "object" || post === null || Array.isArray(post)) {
  fail("POST.json must be a JSON object");
}
const url = (post as { url?: unknown }).url;
if (typeof url !== "string" || !POST_URL.test(url)) {
  fail("POST.json url must be an X post address like https://x.com/<handle>/status/<id>");
}

mkdirSync(outputDir, { recursive: true });
copyFileSync(postPath, join(outputDir, "POST.json"));
console.log(`main.ts: copied POST.json for ${url} to ${outputDir}`);
