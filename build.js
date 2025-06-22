import { escape } from "@std/html/entities";
import fm from "front-matter";
import hljs from "highlight.js";
import { marked } from "marked";
import markedFootnote from "marked-footnote";
import { markedHighlight } from "marked-highlight";
import child_process from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";
import { promisify } from "node:util";

// https://nodejs.org/api/child_process.html#child_processexecfilefile-args-options-callback
const execFile = promisify(child_process.execFile);

const SRC_ROOT = process.env.SRC_ROOT ?? ".";
const DEST_ROOT = process.env.DEST_ROOT ?? "_site";

const currentTime = new Date();

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

/** @type {{ loc: string, lastmod?: string }[]} */
const sitemapURLs = [];

/** @type {{ content: string, id: string, link: string, published?: string, summary?: string; title: string, updated?: string }[]} */
let atomEntries = [];

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
        /** @typedef {{ title?: string, date?: Date, redirectFrom?: string | string[] }} Attributes */
        /** @type {{ attributes: Attributes, body: string }} */
        const { attributes, body } = fm(input);
        const content = marked.parse(body);
        const description = marked.parse(body.trim().split("\n")[0]);

        // Write to file.
        const relativeParentPath = path.relative(SRC_ROOT, parentPath);
        const dest = path.join(
          DEST_ROOT,
          relativeParentPath,
          `${path.parse(name).name}.html`
        );
        const absoluteURL =
          "https://www.bangseongbeom.com" +
          url.pathToFileURL(path.resolve("/", path.relative(DEST_ROOT, dest)))
            .pathname;
        const dateModified = (
          await execFile("git", [
            "log",
            "--max-count=1",
            "--pretty=tformat:%cI",
            "--",
            src,
          ])
        ).stdout.trim();
        const output = /* html */ `<!DOCTYPE html>
<html lang="ko" prefix="og: https://ogp.me/ns#">
  <head>
    <meta charset="utf-8">
    <title>${escape(attributes.title ?? "")}</title>
    <meta name="author" content="방성범 (Bang Seongbeom)">
    <meta name="description" content="${escape(description)}">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta property="og:title" content="${escape(attributes.title ?? "")}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${escape(absoluteURL)}">
    <meta property="og:image" content="">
    <meta property="og:description" content="${escape(description)}">
    <script type="application/ld+json">
      ${escape(
        JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "BlogPosting",
          author: { "@type": "Person", name: "방성범 (Bang Seongbeom)" },
          dateModified:
            dateModified == "" ? currentTime.toISOString() : dateModified,
          datePublished: attributes.date?.toISOString() ?? "",
          headline: attributes.title,
          image: "",
        })
      )}
    </script>
  </head>
  <body>
    <main>
      <h1>${escape(attributes.title ?? "")}</h1>
      <p><time datetime="${escape(
        attributes.date?.toISOString() ?? ""
      )}">${escape(attributes.date?.toISOString() ?? "")}</time></p>
      ${content}
    </main>
  </body>
</html>
`;
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.writeFile(dest, output);

        // Add to sitemap.
        sitemapURLs.push({
          loc: absoluteURL,
          lastmod: attributes.date?.toISOString(),
        });

        // Add to Atom feed.
        if (attributes.date) {
          atomEntries.push({
            content,
            id: absoluteURL,
            link: absoluteURL,
            published: attributes.date.toISOString(),
            summary: description,
            title: attributes.title ?? "",
            updated:
              dateModified == "" ? currentTime.toISOString() : dateModified,
          });
          atomEntries = atomEntries
            .toSorted((a, b) => new Date(b.published) - new Date(a.published))
            .slice(0, 10);
        }

        // Write to redirect file.
        if (attributes.redirectFrom) {
          for (const redirectFrom of Array.isArray(attributes.redirectFrom)
            ? attributes.redirectFrom
            : [attributes.redirectFrom]) {
            const destRedirectFrom = path.isAbsolute(redirectFrom)
              ? path.join(DEST_ROOT, redirectFrom)
              : path.join(dest, "..", redirectFrom);
            const output = /* html */ `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${escape(attributes?.title ?? "")}</title>
    <meta http-equiv="refresh" content="0; url=${escape(absoluteURL)}">
    <meta name="robots" content="noindex">
    <link rel="canonical" href="${escape(absoluteURL)}">
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
  ${lastmod ? /* xml */ `<lastmod>${escape(lastmod)}</lastmod>` : ""}
</url>
`
  )
  .join("")}
</urlset>
`;
await fs.writeFile(sitemapDest, sitemapOutput);

// Write robots.txt.
const sitemap =
  "https://www.bangseongbeom.com" +
  url.pathToFileURL(path.resolve("/", path.relative(DEST_ROOT, sitemapDest)))
    .pathname;
await fs.writeFile(
  path.join(path.dirname(sitemapDest), "robots.txt"),
  `Sitemap: ${sitemap}`
);

// Write Atom feed.
const updated = (
  await execFile("git", ["log", "--max-count=1", "--pretty=tformat:%cI"])
).stdout.trim();
const atomDest = path.join(DEST_ROOT, "feed.xml");
const atomOutput = /* xml */ `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:base="https://www.bangseongbeom.com/" xml:lang="ko">
  <author>
    <name>방성범 (Bang Seongbeom)</name>
    <uri>https://www.bangseongbeom.com/</uri>
    <email>bangseongbeom@gmail.com</email>
  </author>
  <id>https://www.bangseongbeom.com/</id>
  <link href="https://www.bangseongbeom.com/" type="text/html"/>
  <link href="https://www.bangseongbeom.com/feed.xml" rel="self" type="application/atom+xml"/>
  <subtitle>개발자 방성범의 기술 블로그</subtitle>
  <title>방성범 블로그</title>
  <updated>${escape(updated)}</updated>
  ${atomEntries
    .map(
      (entry) => /* xml */ `<entry>
    <content type="html">${escape(entry.content)}</content>
    <id>${escape(entry.id)}</id>
    <link href="${escape(entry.link)}" type="text/html"/>
    <published>${escape(entry.published ?? "")}</published>
    <summary type="html">${escape(entry.summary)}</summary>
    <title>${escape(entry.title)}</title>
    <updated>${escape(entry.updated ?? "")}</updated>
  </entry>
`
    )
    .join("")}
</feed>
`;
await fs.writeFile(atomDest, atomOutput);
