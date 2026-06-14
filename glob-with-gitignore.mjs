import { execSync } from "node:child_process";
import { glob, escapePath } from "tinyglobby";

/**
 * @param {string | readonly string[]} patterns
 * @param {Omit<import("tinyglobby").GlobOptions, "patterns">} options
 */
export default async function globWithGitignore(patterns, options = {}) {
  const { cwd = process.cwd(), ...restOptions } = options;

  try {
    const gitIgnored = execSync(
      "git ls-files --others --ignored --exclude-standard --directory",
      { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    )
      .split("\n")
      .filter(Boolean)
      .map((p) => escapePath(p));

    return glob(patterns, {
      ...restOptions,
      cwd,
      ignore: [...(restOptions.ignore || []), ...gitIgnored],
    });
  } catch {
    return glob(patterns, options);
  }
}
