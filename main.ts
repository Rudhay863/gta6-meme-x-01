// gta6-meme-x-01 entrypoint (Node 22, standard library only).
//
// The entry is the X post itself: this program only hands the grader the
// address of that post, by copying POST.json from the repository root into
// the output directory. It touches nothing else: no network, no wall clock,
// no files outside the repository, so two runs write identical bytes.
//
// The POST.json in this repository currently holds a placeholder address
// ("https://x.com/<handle>/status/<id>"). It is replaced with the real
// post address after the meme is posted on X, before the entry is submitted.
//
// Local check:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const repoDir = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(outDir, { recursive: true });

const postPath = join(repoDir, "POST.json");
let post: string;
try {
  post = readFileSync(postPath, "utf8");
} catch (err) {
  console.error(`could not read ${postPath}: ${(err as Error).message}`);
  process.exit(1);
}

// Refuse to hand the grader a file that is not valid JSON.
JSON.parse(post);

writeFileSync(join(outDir, "POST.json"), post);
