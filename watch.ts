import { spawnSync } from "node:child_process";
import { watch } from "node:fs/promises";
import { matchesGlob, relative } from "node:path";

const source = process.env.SOURCE ?? ".";
const destination = process.env.DESTINATION ?? "_site";
const exclude = [
  "**/_*{,/**}",
  "**/.*{,/**}",
  "**/node_modules{,/**}",
  `${relative(source, destination)}{,/**}`,
];
const watcher = watch(source, { recursive: true });
for await (const { filename } of watcher)
  if (filename && !exclude.some((pattern) => matchesGlob(filename, pattern))) {
    console.log(`Change detected in '${filename}'`);
    spawnSync(process.execPath, ["--run", "build"], { stdio: "inherit" });
  }
