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
import * as cheerio from "cheerio";
import matter from "gray-matter";
import { marked } from "marked";
import markedAlert from "marked-alert";
import markedFootnote from "marked-footnote";
import { gfmHeadingId } from "marked-gfm-heading-id";
import markedShiki from "marked-shiki";
import child_process from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";
import { promisify } from "node:util";
import { createHighlighter } from "shiki";

const TITLE = "방성범 블로그";
const DESCRIPTION = "개발자 방성범의 기술 블로그";
const BASE = "https://www.bangseongbeom.com/";
const AUTHOR = "방성범 (Bang Seongbeom)";
const EMAIL = "bangseongbeom@gmail.com";

const SRC_ROOT = process.env.SRC_ROOT ?? ".";
const DEST_ROOT = process.env.DEST_ROOT ?? "_site";

const BUILD_DATE = new Date().toISOString();

marked.use(gfmHeadingId());
marked.use(markedAlert());
marked.use(markedFootnote({ description: "각주", refMarkers: true }));
let highlighter = await createHighlighter({
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

/** @type {{ loc: string, lastmod?: string }[]} */
let sitemapURLs = [];

/** @type {{ title: string, link: string, description?: string, pubDate: Date, guid: string, content: string }[]} */
let rssItems = [];

let dirents = await fs.readdir(SRC_ROOT, {
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
      let extname = path.extname(name);
      if (extname == ".md") {
        let src = path.join(parentPath, name);
        let dest = path.join(
          DEST_ROOT,
          path.relative(SRC_ROOT, parentPath),
          name == "README.md" ? "index.html" : `${path.parse(name).name}.html`,
        );
        let canonical = new URL(
          url
            .pathToFileURL(
              path.join(
                path.sep,
                path.relative(SRC_ROOT, parentPath),
                name == "README.md" ? path.sep : path.parse(name).name,
              ),
            )
            .pathname.substring(1),
          BASE,
        ).toString();

        // read file
        let input = await fs.readFile(src, { encoding: "utf8" });
        /** @typedef {{ title?: string, description?: string; date?: Date, redirectFrom?: string | string[] }} Attributes */
        /** @type {{ data: Attributes, content: string }} */
        let file = matter(input);
        let content = await marked.parse(file.content);
        let $ = cheerio.load(content, null, false);

        // resolve relative links
        $("a").each(() => {
          let href = $(this).prop("href");
          if (!href) return;

          let absoluteHRef = new URL(href, canonical);
          if (absoluteHRef.origin == new URL(BASE).origin) {
            if (absoluteHRef.pathname.endsWith("/README.md")) {
              absoluteHRef.pathname = absoluteHRef.pathname.slice(
                0,
                -"README.md".length,
              );
              href = absoluteHRef.toString();
            } else if (absoluteHRef.pathname.endsWith(".md")) {
              absoluteHRef.pathname = absoluteHRef.pathname.slice(
                0,
                -".md".length,
              );
              href = absoluteHRef.toString();
            }
          }

          $(this).prop("href", href);
        });

        // extract title from first h1 if it exists
        let title = file.data.title ?? $("h1").prop("innerText");
        if (!title) throw new Error("title is not found");

        let description = file.data.description;

        // extract date from <time id="date"> if it exists
        let date =
          file.data.date ??
          ($("time#date").prop("dateTime")
            ? new Date($("time#date").prop("dateTime"))
            : null);

        // write to file
        let execFile = promisify(child_process.execFile);
        let dateModified = (
          await execFile("git", [
            "log",
            "--max-count=1",
            "--pretty=tformat:%cI",
            "--",
            src,
          ])
        ).stdout.trim();
        content = $.html();
        let output = /* HTML */ `<!DOCTYPE html>
          <html lang="ko" prefix="og: https://ogp.me/ns#">
            <head>
              <meta charset="utf-8" />
              <title>${escape(title)}</title>
              <meta name="author" content="${escape(AUTHOR)}" />
              ${description
                ? /* HTML */ `<meta
                    name="description"
                    content="${escape(description)}"
                  />`
                : ""}
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1"
              />
              <meta property="og:title" content="${escape(title)}" />
              <meta property="og:type" content="article" />
              <meta property="og:url" content="${escape(canonical)}" />
              <meta property="og:image" content="FIXME" />
              ${description
                ? /* HTML */ `<meta
                    property="og:description"
                    content="${escape(description)}"
                  />`
                : ""}
              <link rel="canonical" href="${escape(canonical)}" />
              <link
                rel="alternate"
                type="application/rss+xml"
                href="/feed.xml"
              />
              <script type="application/ld+json">
                ${escape(
                  JSON.stringify({
                    "@context": "https://schema.org/",
                    "@type": "BlogPosting",
                    author: {
                      "@type": "Person",
                      name: AUTHOR,
                    },
                    dateModified:
                      dateModified == "" ? BUILD_DATE : dateModified,
                    datePublished: date?.toISOString() ?? "",
                    headline: title,
                    image: ["FIXME"],
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
              ${content}
            </body>
          </html> `;
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.writeFile(dest, output);

        // add to sitemap
        sitemapURLs.push({
          loc: canonical,
          lastmod: date?.toISOString(),
        });

        // add to RSS feed
        if (date) {
          rssItems.push({
            title,
            link: canonical,
            pubDate: date,
            guid: canonical,
            content,
          });
          rssItems = rssItems
            .toSorted((a, b) => Number(b.pubDate) - Number(a.pubDate))
            .slice(0, 10);
        }

        // write to redirect file
        if (file.data.redirectFrom) {
          for (let redirectFrom of Array.isArray(file.data.redirectFrom)
            ? file.data.redirectFrom
            : [file.data.redirectFrom]) {
            let destRedirectFrom = path.isAbsolute(redirectFrom)
              ? path.join(DEST_ROOT, redirectFrom)
              : path.join(dest, "..", redirectFrom);
            let output = /* HTML */ `<!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8" />
                  <title>${escape(title)}</title>
                  <meta
                    http-equiv="refresh"
                    content="0; URL=${escape(canonical)}"
                  />
                  <meta name="robots" content="noindex" />
                  <link rel="canonical" href="${escape(canonical)}" />
                </head>
                <body>
                  <a href="${escape(canonical)}">${escape(canonical)}</a>
                </body>
              </html> `;
            await fs.mkdir(path.dirname(destRedirectFrom), {
              recursive: true,
            });
            await fs.writeFile(destRedirectFrom, output);
          }
        }
      } else if ([".jpg", ".jpeg", ".png", ".gif", ".ico"].includes(extname)) {
        // copy file
        let src = path.join(parentPath, name);
        let dest = path.join(
          DEST_ROOT,
          path.relative(SRC_ROOT, parentPath),
          name,
        );
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.copyFile(src, dest);
      }
    }),
);

// write sitemap
let sitemapPath = "sitemap.xml";
let sitemapDest = path.join(DEST_ROOT, sitemapPath);
let sitemapData = /* XML */ `<?xml version="1.0" encoding="UTF-8"?>
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
await fs.writeFile(sitemapDest, sitemapData);

// write robots.txt
let robotsPath = "robots.txt";
let robotsDest = path.join(DEST_ROOT, robotsPath);
let robotsData = `Sitemap: ${new URL("sitemap.xml", BASE)}`;
await fs.writeFile(robotsDest, robotsData);

// write RSS feed
let execFile = promisify(child_process.execFile);
let lastBuildDate = (
  await execFile("git", ["log", "--max-count=1", "--pretty=tformat:%cI"])
).stdout.trim();
let rssPath = "feed.xml";
let rssDest = path.join(DEST_ROOT, rssPath);
let rssData = /* XML */ `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" version="2.0">
  <channel>
    <title>${escape(TITLE)}</title>
    <link>${escape(BASE)}</link>
    <description>${escape(DESCRIPTION)}</description>
    <language>ko</language>
    <lastBuildDate>${escape(new Date(lastBuildDate).toUTCString())}</lastBuildDate>
    <docs>https://www.rssboard.org/rss-specification</docs>
    <managingEditor>${escape(EMAIL)} (${escape(AUTHOR)})</managingEditor>
    <webMaster>${escape(EMAIL)} (${escape(AUTHOR)})</webMaster>
    <atom:link href="${escape(new URL("feed.xml", BASE).toString())}" rel="self" type="application/rss+xml" />
    ${rssItems
      .map(
        (item) => /* XML */ `<item>
      <title>${escape(item.title)}</title>
         <link>${escape(item.link)}</link>
      <description>${escape(item.description ?? item.content)}</description>
      <pubDate>${escape(item.pubDate?.toUTCString() ?? "")}</pubDate>
      <guid>${escape(item.guid)}</guid>
      ${item.description ? /* XML */ `<content:encoded>${escape(item.content)}</content:encoded>` : ""}
    </item>
    `,
      )
      .join("")}
  </channel>
</rss>
`;
await fs.writeFile(rssDest, rssData);
