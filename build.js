import {
  transformerMetaHighlight,
  transformerMetaWordHighlight,
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { escape } from "@std/html/entities";
import fm from "front-matter";
import { marked, Marked } from "marked";
import markedFootnote from "marked-footnote";
import markedPlaintify from "marked-plaintify";
import markedShiki from "marked-shiki";
import child_process from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";
import { promisify } from "node:util";
import { createHighlighter } from "shiki";

// https://nodejs.org/api/child_process.html#child_processexecfilefile-args-options-callback
const execFile = promisify(child_process.execFile);

const SRC_ROOT = process.env.SRC_ROOT ?? ".";
const DEST_ROOT = process.env.DEST_ROOT ?? "_site";

const currentTime = new Date();

marked.use(markedFootnote({ description: "각주", refMarkers: true }));
const highlighter = await createHighlighter({
  langs: ["c", "py", "sh", "http", "yaml", "html"],
  themes: ["github-light-default"],
});
marked.use(
  markedShiki({
    highlight(code, lang, props) {
      return highlighter.codeToHtml(code, {
        lang,
        theme: "github-light-default",
        meta: { __raw: props.join(" ") }, // required by `transformerMeta*`
        transformers: [
          transformerNotationDiff({
            matchAlgorithm: "v3",
          }),
          transformerNotationHighlight({
            matchAlgorithm: "v3",
          }),
          transformerNotationWordHighlight({
            matchAlgorithm: "v3",
          }),
          transformerNotationFocus({
            matchAlgorithm: "v3",
          }),
          transformerNotationErrorLevel({
            matchAlgorithm: "v3",
          }),
          transformerMetaHighlight(),
          transformerMetaWordHighlight(),
        ],
      });
    },
  }),
);

marked.use({
  renderer: {
    codespan(code) {
      return /* HTML */ `<code class="hljs">${escape(code.text)}</code>`;
    },
  },
});

/** @type {{ loc: string, lastmod?: string }[]} */
const sitemapURLs = [];

/** @type {{ title: string, link: string, description?: string, pubDate: Date, guid: string, content: string }[]} */
let rssItems = [];

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
              seg == "node_modules",
          ),
    )
    .filter(
      (dirent) => !(dirent.name.startsWith(".") || dirent.name.startsWith("_")),
    )
    .map(async ({ parentPath, name }) => {
      const extname = path.extname(name);
      if (extname == ".md") {
        // Read file.
        const src = path.join(parentPath, name);
        const input = await fs.readFile(src, { encoding: "utf8" });
        /** @typedef {{ title?: string, date?: Date, redirectFrom?: string | string[] }} Attributes */
        /** @type {{ attributes: Attributes, body: string }} */
        // @ts-ignore
        const { attributes, body } = fm(input);
        const content = await marked.parse(body);
        const description = (
          await new Marked().use(markedPlaintify()).parse(body)
        ).split("\n")[0];

        // Write to file.
        const relativeParentPath = path.relative(SRC_ROOT, parentPath);
        const dest = path.join(
          DEST_ROOT,
          relativeParentPath,
          name == "README.md" ? "index.html" : `${path.parse(name).name}.html`,
        );
        const canonicalPath = url.pathToFileURL(
          path.resolve(
            "/",
            relativeParentPath,
            path.parse(dest).name == "index" ? "/" : path.parse(name).name,
          ),
        ).pathname;
        const canonicalURL = "https://www.bangseongbeom.com" + canonicalPath;
        const dateModified = (
          await execFile("git", [
            "log",
            "--max-count=1",
            "--pretty=tformat:%cI",
            "--",
            src,
          ])
        ).stdout.trim();
        const output = /* HTML */ `<!DOCTYPE html>
          <html lang="ko" prefix="og: https://ogp.me/ns#">
            <head>
              <meta charset="utf-8" />
              <title>${escape(attributes.title ?? "")}</title>
              <meta name="author" content="방성범 (Bang Seongbeom)" />
              <meta name="description" content="${escape(description)}" />
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1"
              />
              <meta
                property="og:title"
                content="${escape(attributes.title ?? "")}"
              />
              <meta property="og:type" content="article" />
              <meta property="og:url" content="${escape(canonicalURL)}" />
              <meta property="og:image" content="" />
              <meta
                property="og:description"
                content="${escape(description)}"
              />
              <link rel="canonical" href="${escape(canonicalURL)}" />
              <script type="application/ld+json">
                ${escape(
                  JSON.stringify({
                    "@context": "https://schema.org/",
                    "@type": "BlogPosting",
                    author: {
                      "@type": "Person",
                      name: "방성범 (Bang Seongbeom)",
                    },
                    dateModified:
                      dateModified == ""
                        ? currentTime.toISOString()
                        : dateModified,
                    datePublished: attributes.date?.toISOString() ?? "",
                    headline: attributes.title,
                    image: "",
                  }),
                )}
              </script>
              <style>
                body {
                  max-width: 40em;
                  margin: 8px auto;
                  line-height: 1.5;
                }
              </style>
              <style>
                code {
                  font-family: Consolas, "Courier New", monospace;
                }
              </style>
            </head>
            <body>
              <h1>${escape(attributes.title ?? "")}</h1>
              <dl>
                <dt>저자:</dt>
                <dd>방성범 (Bang Seongbeom)</dd>
                <dt>작성일:</dt>
                <dd>
                  <time
                    datetime="${escape(attributes.date?.toISOString() ?? "")}"
                    >${escape(attributes.date?.toISOString() ?? "")}</time
                  >
                </dd>
              </dl>
              ${content}
            </body>
          </html> `;
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.writeFile(dest, output);

        // Add to sitemap.
        sitemapURLs.push({
          loc: canonicalURL,
          lastmod: attributes.date?.toISOString(),
        });

        // Add to RSS feed.
        if (attributes.date) {
          rssItems.push({
            title: attributes.title ?? "",
            link: canonicalURL,
            description,
            pubDate: attributes.date,
            guid: canonicalURL,
            content,
          });
          rssItems = rssItems
            .toSorted((a, b) => Number(b.pubDate) - Number(a.pubDate))
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
            const output = /* HTML */ `<!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8" />
                  <title>${escape(attributes?.title ?? "")}</title>
                  <meta
                    http-equiv="refresh"
                    content="0; URL=${escape(canonicalPath)}"
                  />
                  <meta name="robots" content="noindex" />
                  <link rel="canonical" href="${escape(canonicalURL)}" />
                </head>
                <body>
                  <a href="${escape(canonicalPath)}"
                    >${escape(canonicalPath)}</a
                  >
                </body>
              </html> `;
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
    }),
);

// Write sitemap.
const sitemapDest = path.join(DEST_ROOT, "sitemap.xml");
const sitemapOutput = /* XML */ `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapURLs
  .map(
    ({ loc, lastmod }) => /* XML */ `<url>
  <loc>${escape(loc)}</loc>
  ${lastmod ? /* XML */ `<lastmod>${escape(lastmod)}</lastmod>` : ""}
</url>
`,
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
  `Sitemap: ${sitemap}`,
);

// Write RSS feed.
const lastBuildDate = (
  await execFile("git", ["log", "--max-count=1", "--pretty=tformat:%cI"])
).stdout.trim();
const rssDest = path.join(DEST_ROOT, "feed.xml");
const rssOutput = /* XML */ `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" version="2.0">
  <channel>
    <title>방성범 블로그</title>
    <link>https://www.bangseongbeom.com/</link>
    <description>개발자 방성범의 기술 블로그</description>
    <language>ko</language>
    <lastBuildDate>${escape(
      new Date(lastBuildDate).toUTCString(),
    )}</lastBuildDate>
    <docs>https://www.rssboard.org/rss-specification</docs>
    <managingEditor>bangseongbeom@gmail.com (방성범 (Bang Seongbeom))</managingEditor>
    <webMaster>bangseongbeom@gmail.com (방성범 (Bang Seongbeom))</webMaster>
    <atom:link href="https://www.bangseongbeom.com/feed.xml" rel="self" type="application/rss+xml"/>
    ${rssItems
      .map(
        (item) => /* XML */ `<item>
      <title>${escape(item.title)}</title>
         <link>${escape(item.link)}</link>
      <description>${escape(item.description)}</description>
      <pubDate>${escape(item.pubDate?.toUTCString() ?? "")}</pubDate>
      <guid>${escape(item.guid)}</guid>
      <content:encoded>${escape(item.content)}</content:encoded>
    </item>
    `,
      )
      .join("")}
  </channel>
</rss>
`;
await fs.writeFile(rssDest, rssOutput);