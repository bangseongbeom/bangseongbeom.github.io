import { spawnSync } from "node:child_process";
import { glob, watch } from "node:fs/promises";

const source = process.env.SOURCE ?? ".";
const paths = await Array.fromAsync(
  glob("**", {
    cwd: source,
    exclude: ["**/_*", "**/.*", "**/node_modules"],
  }),
);
const watcher = watch(source, { recursive: true });
for await (const { filename } of watcher)
  if (filename && paths.includes(filename))
    spawnSync(process.execPath, ["--run", "build"], { stdio: "inherit" });
