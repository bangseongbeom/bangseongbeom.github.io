import { escape } from "@std/html/entities";
import fm from "front-matter";
import hljs from "highlight.js";
import { marked } from "marked";
import markedFootnote from "marked-footnote";
import { markedHighlight } from "marked-highlight";
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

/** @typedef {{ title?: string, date?: Date, redirectFrom?: string | string[] }} Attributes */

const SRC_ROOT = process.env.SRC_ROOT ?? ".";
const DEST_ROOT = process.env.DEST_ROOT ?? "_site";

marked.use(markedFootnote({ description: "각주", refMarkers: true }));
marked.use(
  markedHighlight({
    emptyLangClass: "hljs",
    langPrefix: "hljs language-",
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  })
);

/** @type {{ loc: string, lastmod: string }[]} */
const sitemapURLs = [];

const atomEntries = [];

const dirents = await fs.readdir(SRC_ROOT, {
  withFileTypes: true,
  recursive: true,
});
await Promise.all(
  dirents
    .filter((dirent) => dirent.isFile())
    .filter(
      (dirent) =>
        !dirent.parentPath
          .split(path.sep)
          .some(
            (seg) =>
              (seg != "." && seg.startsWith(".")) ||
              seg.startsWith("_") ||
              seg == "node_modules"
          )
    )
    .filter(
      (dirent) => !(dirent.name.startsWith(".") || dirent.name.startsWith("_"))
    )
    .map(async ({ parentPath, name }) => {
      const extname = path.extname(name);
      if (extname == ".md") {
        // Read file.
        const src = path.join(parentPath, name);
        const input = await fs.readFile(src, { encoding: "utf8" });
        /** @type {{ attributes: Attributes, body: string }} */
        const { attributes, body } = fm(input);
        const htmlBody = marked.parse(body);

        // Write to file.
        const relativeParentPath = path.relative(SRC_ROOT, parentPath);
        const dest = path.join(
          DEST_ROOT,
          relativeParentPath,
          `${path.parse(name).name}.html`
        );
        const output = /* html */ `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <title>${escape(attributes.title ?? "")}</title>
  </head>
  <body>
    <main>
      <h1>${escape(attributes.title ?? "")}</h1>
      <p><time datetime="${escape(
        attributes.date?.toISOString() ?? ""
      )}">${escape(attributes.date?.toISOString() ?? "")}</time></p>
      ${htmlBody}
    </main>
  </body>
</html>
`;
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.writeFile(dest, output);

        // Add to sitemap.
        const urlPath = url.pathToFileURL(
          path.resolve("/", path.relative(DEST_ROOT, dest))
        );
        sitemapURLs.push({
          loc: urlPath,
          lastmod: attributes.date?.toISOString(),
        });

        // Write to redirect file.
        if (attributes.redirectFrom) {
          for (const redirectFrom of Array.isArray(attributes.redirectFrom)
            ? attributes.redirectFrom
            : [attributes.redirectFrom]) {
            const destRedirectFrom = path.isAbsolute(redirectFrom)
              ? path.join(DEST_ROOT, redirectFrom)
              : path.join(dest, "..", redirectFrom);
            const urlPath = url.pathToFileURL(
              path.resolve("/", path.relative(DEST_ROOT, dest))
            ).pathname;
            const output = /* html */ `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${escape(attributes?.title ?? "")}</title>
    <link rel="canonical" href="${escape(urlPath)}">
    <meta http-equiv="refresh" content="0; url=${escape(urlPath)}">
    <meta name="robots" content="noindex">  
  </head>
</html>
`;
            await fs.mkdir(path.dirname(destRedirectFrom), {
              recursive: true,
            });
            await fs.writeFile(destRedirectFrom, output);
          }
        }
      } else if ([".jpg", ".jpeg", ".png", ".gif", ".ico"].includes(extname)) {
        // Copy file.
        const src = path.join(parentPath, name);
        const relativeParentPath = path.relative(SRC_ROOT, parentPath);
        const dest = path.join(DEST_ROOT, relativeParentPath, name);
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.copyFile(src, dest);
      }
    })
);

// Write sitemap.
const sitemapDest = path.join(DEST_ROOT, "sitemap.xml");
const sitemapOutput = /* xml */ `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapURLs
  .map(
    ({ loc, lastmod }) => /* xml */ `<url>
  <loc>${escape(loc)}</loc>
  <lastmod>${escape(lastmod)}</lastmod>
</url>`
  )
  .join("\n")}
</urlset>
`;
await fs.writeFile(sitemapDest, sitemapOutput);

// Write robots.txt.
await fs.writeFile(
  path.join(path.dirname(sitemapDest), "robots.txt"),
  `Sitemap: https://www.bangseongbeom.com/${
    url.pathToFileURL(path.resolve("/", path.relative(DEST_ROOT, sitemapDest)))
      .pathname
  }`
);
