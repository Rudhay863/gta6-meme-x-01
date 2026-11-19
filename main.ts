// gta6-meme-x-01 entrypoint (Node 22, standard library only).
//
// The entry is the X post itself: this program only hands the grader the
// address of that post, by copying POST.json from the repository root into
// the output directory. Before it writes anything it checks that address
// against the gate's post_url rule (an X post address on x.com or
// twitter.com, id digits only) and refuses loudly when the shape is
// wrong, so a bad POST.json can never reach the grader silently.
// It touches nothing else: no network, no wall clock, no files outside
// the repository, so two runs write identical bytes.
//
// Local check:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const repoDir = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

const postPath = join(repoDir, "POST.json");
let raw: string;
try {
  raw = readFileSync(postPath, "utf8");
} catch (err) {
  console.error(`could not read ${postPath}: ${(err as Error).message}`);
  process.exit(1);
}

// The file must be a JSON object with a string url field.
let parsed: unknown;
try {
  parsed = JSON.parse(raw);
} catch (err) {
  console.error(`POST.json is not valid JSON: ${(err as Error).message}`);
  process.exit(1);
}
if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
  console.error(
    'POST.json must be a JSON object, e.g. {"url": "https://x.com/<handle>/status/<id>"}',
  );
  process.exit(1);
}
const url = (parsed as Record<string, unknown>).url;
if (typeof url !== "string") {
  console.error('POST.json must have a string "url" field');
  process.exit(1);
}

// The gate refuses any url that is not an X post address:
// https://x.com/<handle>/status/<digits> (or twitter.com, with an
// optional www. / mobile. prefix, or /i/web/status/<digits>).
// A query string or fragment after the id is read past by the house,
// so only the host and path are checked here.
let postUrl: URL;
try {
  postUrl = new URL(url);
} catch {
  console.error(`POST.json url is not a valid URL: ${url}`);
  process.exit(1);
}
const host = postUrl.hostname.replace(/^(www|mobile)\./, "");
if (postUrl.protocol !== "https:" || (host !== "x.com" && host !== "twitter.com")) {
  console.error(`POST.json url must be an X post address on x.com or twitter.com: ${url}`);
  process.exit(1);
}
const statusPath =
  /^\/[A-Za-z0-9_]+\/status\/\d+$/.test(postUrl.pathname) ||
  /^\/i\/web\/status\/\d+$/.test(postUrl.pathname);
if (!statusPath) {
  console.error(
    `POST.json url must look like https://x.com/<handle>/status/<digits> (id digits only): ${url}`,
  );
  process.exit(1);
}

// Only now that the address is known-good, create the output
// directory (recursively) and hand the file to the grader.
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "POST.json"), raw);
