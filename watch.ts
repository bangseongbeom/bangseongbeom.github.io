import { spawnSync } from "node:child_process";
import { glob, watch } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const srcRoot = process.env.SRC_ROOT ?? ".";
const filenames = await Array.fromAsync(
  glob(join(srcRoot, "**"), {
    exclude: ["**/_*", "**/.*", "**/node_modules"],
  }),
);
const watcher = watch(dirname(fileURLToPath(import.meta.url)), {
  recursive: true,
});
for await (const { filename } of watcher)
  if (filename && filenames.includes(filename))
    spawnSync(process.execPath, ["--run", "build"], { stdio: "inherit" });
