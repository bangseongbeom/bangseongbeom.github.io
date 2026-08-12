import { spawnSync } from "node:child_process";
import { watch } from "node:fs/promises";
import { matchesGlob } from "node:path";

const source = process.env.SOURCE ?? ".";
const exclude = ["**/_*{,/**}", "**/.*{,/**}", "**/node_modules{,/**}"];
const watcher = watch(source, { recursive: true });
for await (const { filename } of watcher)
  if (filename && !exclude.some((pattern) => matchesGlob(filename, pattern)))
    spawnSync(process.execPath, ["--run", "build"], { stdio: "inherit" });
