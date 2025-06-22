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
import { globby } from "globby";
import matter from "gray-matter";
import { HTMLRewriter } from "html-rewriter-wasm";
import { marked } from "marked";
import markedAlert from "marked-alert";
import markedFootnote from "marked-footnote";
import { gfmHeadingId } from "marked-gfm-heading-id";
import markedShiki from "marked-shiki";
import { fail } from "node:assert";
import child_process from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  parse,
  relative,
  sep,
} from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { createHighlighter } from "shiki";

const execFile = promisify(child_process.execFile);

const TITLE = "방성범 블로그";
const DESCRIPTION = "개발자 방성범의 기술 블로그";
const AUTHOR = "방성범 (Bang Seongbeom)";
const EMAIL = "bangseongbeom@gmail.com";
const BASE = "https://www.bangseongbeom.com/";

const SRC_ROOT = process.env.SRC_ROOT ?? ".";
const DEST_ROOT = process.env.DEST_ROOT ?? "_site";

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

/** @type {{ title: string, description?: string, datePublished?: Date, dateModified?: Date }[]} */
let articles = [];

/** @type {{ loc: string, lastmod?: Date }[]} */
let sitemapURLs = [];

/** @type {{ title: string, link: string, description?: string, pubDate?: Date, guid: string, content: string }[]} */
let rssItems = [];

await Promise.all(
  (await globby(join(SRC_ROOT, "**"), { gitignore: true })).map(async (src) => {
    if (extname(src) == ".md") {
      let dest = join(
        DEST_ROOT,
        dirname(relative(SRC_ROOT, src)),
        basename(src) == "README.md"
          ? "index.html"
          : `${parse(basename(src)).name}.html`,
      );
      let canonical = new URL(
        pathToFileURL(
          join(
            sep,
            dirname(relative(SRC_ROOT, src)),
            basename(src) == "README.md" ? sep : parse(basename(src)).name,
          ),
        ).pathname.substring(1),
        BASE,
      ).toString();

      let markdownContent = await readFile(src, { encoding: "utf8" });
      /** @type {{ data: { title?: string; description?: string; datePublished?: Date; dateModified?: Date; redirectFrom?: string[]; }; content: string; }} */
      let file = matter(markdownContent);
      let input = await marked.parse(file.content);

      let encoder = new TextEncoder();
      let decoder = new TextDecoder();
      let output = "";
      let rewriter = new HTMLRewriter((outputChunk) => {
        output += decoder.decode(outputChunk);
      });

      rewriter.on("a[href]", {
        element(element) {
          let href = element.getAttribute("href");
          if (!href) fail();

          let absoluteHRef = new URL(href, canonical);
          if (absoluteHRef.origin == new URL(BASE).origin) {
            if (absoluteHRef.pathname.endsWith("/README.md")) {
              absoluteHRef.pathname = absoluteHRef.pathname.slice(
                0,
                -"README.md".length,
              );

              element.setAttribute("href", absoluteHRef.toString());
            } else if (absoluteHRef.pathname.endsWith(".md")) {
              absoluteHRef.pathname = absoluteHRef.pathname.slice(
                0,
                -".md".length,
              );

              element.setAttribute("href", absoluteHRef.toString());
            }
          }
        },
      });

      let title = file.data.title;
      if (!title) {
        rewriter.on("h1", {
          text(text) {
            if (!title) title = text.text;
          },
        });
      }

      let description = file.data.description;
      if (!description) {
        let end = false;
        rewriter.on("p", {
          element(element) {
            element.onEndTag(() => {
              end = true;
            });
          },
          text(text) {
            if (end) return;
            if (!description) description = "";
            description += text.text;
          },
        });
      }

      let datePublished = file.data.datePublished;
      if (!datePublished) {
        rewriter.on("time#date-published", {
          element(element) {
            let dateTime = element.getAttribute("datetime");
            if (!dateTime) throw new Error("datetime is not found");
            datePublished = new Date(dateTime);
          },
        });
      }

      let dateModified = file.data.dateModified;
      if (!dateModified) {
        rewriter.on("time#date-modified", {
          element(element) {
            let dateTime = element.getAttribute("datetime");
            if (!dateTime) throw new Error("datetime is not found");
            if (!dateModified) dateModified = new Date(dateTime);
          },
        });
      }

      try {
        await rewriter.write(encoder.encode(input));
        await rewriter.end();
      } finally {
        rewriter.free();
      }

      if (!title) throw new Error();

      if (!dateModified) {
        let committerDate = (
          await execFile("git", [
            "log",
            "--max-count=1",
            "--pretty=tformat:%cI",
            "--",
            src,
          ])
        ).stdout.trim();
        if (committerDate) dateModified = new Date(committerDate);
      }

      let data = /* HTML */ `<!DOCTYPE html>
        <html lang="en" prefix="og: https://ogp.me/ns#">
          <head>
            <meta charset="utf-8" />
            <title>${escape(title)}</title>
            <meta name="author" content="${escape(AUTHOR)}" />
            ${
              description
                ? /* HTML */ `<meta
                    name="description"
                    content="${escape(description)}"
                  />`
                : ""
            }
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
            <meta property="og:title" content="${escape(title)}" />
            <meta property="og:type" content="article" />
            <meta property="og:url" content="${escape(canonical)}" />
            <meta
              property="og:image"
              content="${escape(new URL("ogp.png", BASE).toString())}"
            />
            ${
              description
                ? /* HTML */ `<meta
                    property="og:description"
                    content="${escape(description)}"
                  />`
                : ""
            }
            <link rel="canonical" href="${escape(canonical)}" />
            <link
              rel="icon"
              href="${escape(new URL("favicon.ico", BASE).toString())}"
              sizes="32x32"
            />
            <link
              rel="icon"
              href="${escape(new URL("icon.svg", BASE).toString())}"
              type="image/svg+xml"
            />
            <link
              rel="apple-touch-icon"
              href="${escape(new URL("apple-touch-icon.png", BASE).toString())}"
            />
            <link
              rel="alternate"
              type="application/rss+xml"
              href="${escape(new URL("feed.xml", BASE).toString())}"
            />
            <script type="application/ld+json">
              ${escape(
                JSON.stringify(
                  /** @type {import("schema-dts").BlogPosting} */ ({
                    "@context": "https://schema.org/",
                    "@type": "BlogPosting",
                    author: {
                      "@type": "Person",
                      name: AUTHOR,
                    },
                    dateModified: dateModified?.toISOString(),
                    datePublished: datePublished?.toISOString(),
                    headline: title,
                    image: new URL("ogp.png", BASE).toString(),
                  }),
                ),
              )}
            </script>
            <style>
              body {
                line-height: 1.5;
              }
              body > * {
                max-width: 40em;
                margin: 0 auto;
              }
            </style>
          </head>
          <body>
            <header>
              <hgroup>
                <h1>
                  <a href="${escape(BASE)}">${escape(TITLE)}</a>
                </h1>
                <p>${escape(DESCRIPTION)}</p>
              </hgroup>
            </header>
            <main>${output}</main>
            <footer>
              <address>
                ${escape(AUTHOR)} &lt;<a href="mailto:${EMAIL}"
                  >${escape(EMAIL)}</a
                >&gt;
              </address>
              <p>
                <a href="https://github.com/bangseongbeom">GitHub @bangseongbeom</a>
              </p>
              <p>
                <a href="${escape(new URL("feed.xml", BASE).toString())}"
                  >구독</a
                >
              </p>
            </footer>
          </body>
        </html>`;
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, data);

      articles.push({
        title,
        description,
        datePublished,
        dateModified,
      });
      sitemapURLs.push({
        loc: canonical,
        lastmod: datePublished,
      });
      rssItems.push({
        title,
        link: canonical,
        description,
        pubDate: datePublished,
        guid: canonical,
        content: output,
      });
      rssItems = rssItems
        .toSorted(
          (a, b) => (b.pubDate?.getTime() ?? 0) - (a.pubDate?.getTime() ?? 0),
        )
        .slice(0, 10);

      if (file.data.redirectFrom) {
        for (let redirectFromPath of file.data.redirectFrom) {
          let path = isAbsolute(redirectFromPath)
            ? join(DEST_ROOT, redirectFromPath)
            : join(dest, "..", redirectFromPath);
          let data = /* HTML */ `<!DOCTYPE html>
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
                <link
                  rel="icon"
                  href="${escape(new URL("favicon.ico", BASE).toString())}"
                  sizes="32x32"
                />
                <link
                  rel="icon"
                  href="${escape(new URL("icon.svg", BASE).toString())}"
                  type="image/svg+xml"
                />
                <link
                  rel="apple-touch-icon"
                  href="${escape(
                    new URL("apple-touch-icon.png", BASE).toString(),
                  )}"
                />
              </head>
              <body>
                <a href="${escape(canonical)}">${escape(canonical)}</a>
              </body>
            </html> `;
          await mkdir(dirname(path), {
            recursive: true,
          });
          await writeFile(path, data);
        }
      }
    } else if (
      [".jpg", ".jpeg", ".png", ".gif", ".ico", ".svg"].includes(extname(src))
    ) {
      let dest = join(DEST_ROOT, relative(SRC_ROOT, src));
      await mkdir(dirname(dest), { recursive: true });
      await copyFile(src, dest);
    }
  }),
);

let articlesContent = articles
  .toSorted(
    (a, b) =>
      (b.dateModified?.getTime() ?? 0) - (a.dateModified?.getTime() ?? 0),
  )
  .map(
    ({ title, description, datePublished, dateModified }) =>
      /* HTML */ `<article>
        <h1>${escape(title)}</h1>
        ${description ? /* HTML */ `<p>${escape(description)}</p>` : ""}
        ${datePublished
          ? /* HTML */ `<time
              datetime="${escape(datePublished.toISOString())}"
              class="date-published"
              >${escape(datePublished.toUTCString())}</time
            >`
          : ""}
        ${dateModified
          ? /* HTML */ `<time
              datetime="${escape(dateModified.toISOString())}"
              class="date-modified"
              >${escape(dateModified.toUTCString())}</time
            >`
          : ""}
      </article>`,
  )
  .join("");

await Promise.all(
  (await globby(join(DEST_ROOT, "**"))).map(async (path) => {
    if (extname(path) == ".html") {
      let input = await readFile(path, { encoding: "utf8" });

      let encoder = new TextEncoder();
      let decoder = new TextDecoder();
      let output = "";
      let rewriter = new HTMLRewriter((outputChunk) => {
        output += decoder.decode(outputChunk);
      });

      rewriter.on("section#articles", {
        element(element) {
          element.setInnerContent(
            /* HTML */ `<h2>게시물</h2>` + articlesContent,
            {
              html: true,
            },
          );
        },
      });

      try {
        await rewriter.write(encoder.encode(input));
        await rewriter.end();
      } finally {
        rewriter.free();
      }

      await writeFile(path, output);
    }
  }),
);

let sitemapFile = join(DEST_ROOT, "sitemap.xml");
let sitemapData = /* XML */ `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapURLs
  .map(
    ({ loc, lastmod }) => /* XML */ `<url>
  <loc>${escape(loc)}</loc>
  ${lastmod ? /* XML */ `<lastmod>${escape(lastmod.toISOString())}</lastmod>` : ""}
</url>
`,
  )
  .join("")}
</urlset>
`;
await writeFile(sitemapFile, sitemapData);

let robotsFile = join(DEST_ROOT, "robots.txt");
let robotsData = `Sitemap: ${new URL("sitemap.xml", BASE)}`;
await writeFile(robotsFile, robotsData);

let rssFile = join(DEST_ROOT, "feed.xml");
let rssData = /* XML */ `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" version="2.0">
  <channel>
    <title>${escape(TITLE)}</title>
    <link>${escape(BASE)}</link>
    <description>${escape(DESCRIPTION)}</description>
    <language>en</language>
    <docs>https://www.rssboard.org/rss-specification</docs>
    <managingEditor>${escape(EMAIL)} (${escape(AUTHOR)})</managingEditor>
    <webMaster>${escape(EMAIL)} (${escape(AUTHOR)})</webMaster>
    <lastBuildDate>${escape(new Date().toUTCString())}</lastBuildDate>
    <atom:link href="${escape(new URL("feed.xml", BASE).toString())}" rel="self" type="application/rss+xml" />
    ${rssItems
      .map(
        (item) => /* XML */ `<item>
      <title>${escape(item.title)}</title>
         <link>${escape(item.link)}</link>
      <description>${escape(item.description ?? item.content)}</description>
      ${item.pubDate ? /* XML*/ `<pubDate>${escape(item.pubDate.toUTCString())}</pubDate>` : ""}
      <guid>${escape(item.guid)}</guid>
      ${item.description ? /* XML */ `<content:encoded>${escape(item.content)}</content:encoded>` : ""}
    </item>
    `,
      )
      .join("")}
  </channel>
</rss>
`;
await writeFile(rssFile, rssData);
