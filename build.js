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

const config = {
  title: "방성범 블로그",
  description: "개발자 방성범의 기술 블로그",
  base: "https://www.bangseongbeom.com/",
  author: "방성범 (Bang Seongbeom)",
  email: "bangseongbeom@gmail.com",
  srcRoot: process.env.SRC_ROOT ?? ".",
  destRoot: process.env.DEST_ROOT ?? "_site",
};

/**
 * @param {import("html-rewriter-wasm").HTMLRewriter} rewriter
 * @param {{ description?: string }} data
 */
function onDescription(rewriter, data) {
  let end = false;
  rewriter.on("p", {
    element(element) {
      element.onEndTag(() => {
        end = true;
      });
    },
    text(text) {
      if (end) return;
      if (!data.description) data.description = "";
      data.description += text.text;
    },
  });
}

/**
 * @param {import("html-rewriter-wasm").HTMLRewriter} rewriter
 * @param {object} config
 * @param {string} config.base
 * @param {string} canonical
 */
function onHRef(rewriter, config, canonical) {
  rewriter.on("[href]", {
    element(element) {
      let href = element.getAttribute("href");
      if (!href) fail();

      let absoluteHRef = new URL(href, canonical);
      if (absoluteHRef.origin == new URL(config.base).origin) {
        if (absoluteHRef.pathname.endsWith("/README.md")) {
          absoluteHRef.pathname = absoluteHRef.pathname.slice(
            0,
            -"README.md".length,
          );

          element.setAttribute("href", absoluteHRef.toString());
        } else if (absoluteHRef.pathname.endsWith(".md")) {
          absoluteHRef.pathname = absoluteHRef.pathname.slice(0, -".md".length);

          element.setAttribute("href", absoluteHRef.toString());
        }
      }
    },
  });
}

/**
 * @param {import("html-rewriter-wasm").HTMLRewriter} rewriter
 * @param {{ title?: string }} data
 */
function onTitle(rewriter, data) {
  rewriter.on("h1", {
    text(text) {
      if (!data.title) data.title = text.text;
    },
  });
}

/**
 * @param {import("html-rewriter-wasm").HTMLRewriter} rewriter
 * @param {{ datePublished?: Date }} data
 */
function onDatePublished(rewriter, data) {
  rewriter.on("time#date-published", {
    element(element) {
      let dateTime = element.getAttribute("datetime");
      if (!dateTime) throw new Error("datetime is not found");
      data.datePublished = new Date(dateTime);
    },
  });
}

/**
 * @param {import("html-rewriter-wasm").HTMLRewriter} rewriter
 * @param {{ dateModified?: Date }} data
 */
function onDateModified(rewriter, data) {
  rewriter.on("time#date-modified", {
    element(element) {
      let dateTime = element.getAttribute("datetime");
      if (!dateTime) throw new Error("datetime is not found");
      if (!data.dateModified) data.dateModified = new Date(dateTime);
    },
  });
}

/**
 * @param {object} config
 * @param {string} config.destRoot
 * @param {string | string[] | undefined} redirectFrom
 * @param {string} title
 * @param {string} dest
 * @param {string} canonical
 */
async function writeRedirect(
  { destRoot },
  redirectFrom,
  title,
  dest,
  canonical,
) {
  if (redirectFrom) {
    for (let singleRedirectFrom of Array.isArray(redirectFrom)
      ? redirectFrom
      : [redirectFrom]) {
      let path = isAbsolute(singleRedirectFrom)
        ? join(destRoot, singleRedirectFrom)
        : join(dest, "..", singleRedirectFrom);
      let data = /* HTML */ `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${escape(title)}</title>
            <meta http-equiv="refresh" content="0; URL=${escape(canonical)}" />
            <meta name="robots" content="noindex" />
            <link rel="canonical" href="${escape(canonical)}" />
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
}

/**
 * @param {object} config
 * @param {string} config.destRoot
 * @param {string} config.srcRoot
 * @param {string} config.base
 * @param {string} config.author
 * @param {string} src
 * @returns {Promise<{ content: string, title: string, description?: string, datePublished?: Date, dateModified?: Date, dest: string, canonical: string }>}
 */
async function writeHTML(config, src) {
  let dest = join(
    config.destRoot,
    dirname(relative(config.srcRoot, src)),
    basename(src) == "README.md"
      ? "index.html"
      : `${parse(basename(src)).name}.html`,
  );
  let canonical = new URL(
    pathToFileURL(
      join(
        sep,
        dirname(relative(config.srcRoot, src)),
        basename(src) == "README.md" ? sep : parse(basename(src)).name,
      ),
    ).pathname.substring(1),
    config.base,
  ).toString();

  let markdown = await readFile(src, { encoding: "utf8" });
  /** @type {{ data: { title?: string, description?: string, datePublished?: Date, dateModified?: Date, redirectFrom?: string | string[] }, content: string; }} */
  let file = matter(markdown);
  let originalContent = await marked.parse(file.content);

  let encoder = new TextEncoder();
  let decoder = new TextDecoder();
  let content = "";
  let rewriter = new HTMLRewriter((outputChunk) => {
    content += decoder.decode(outputChunk);
  });

  onHRef(rewriter, config, canonical);
  if (!file.data.description) onDescription(rewriter, file.data);
  if (!file.data.title) onTitle(rewriter, file.data);
  if (!file.data.datePublished) onDatePublished(rewriter, file.data);
  if (!file.data.dateModified) onDateModified(rewriter, file.data);

  try {
    await rewriter.write(encoder.encode(originalContent));
    await rewriter.end();
  } finally {
    rewriter.free();
  }

  if (!file.data.title) throw new Error("title is not found");
  if (!file.data.dateModified) {
    const committerDate = (
      await execFile("git", [
        "log",
        "--max-count=1",
        "--pretty=tformat:%cI",
        "--",
        src,
      ])
    ).stdout.trim();

    if (committerDate) file.data.dateModified = new Date(committerDate);
  }

  let data = /* HTML */ `<!DOCTYPE html>
    <html lang="en" prefix="og: https://ogp.me/ns#">
      <head>
        <meta charset="utf-8" />
        <title>${escape(file.data.title)}</title>
        <meta name="author" content="${escape(config.author)}" />
        ${file.data.description
          ? /* HTML */ `<meta
              name="description"
              content="${escape(file.data.description)}"
            />`
          : ""}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="${escape(file.data.title)}" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="${escape(canonical)}" />
        <meta
          property="og:image"
          content="${escape(new URL("ogp.png", config.base).toString())}"
        />
        ${file.data.description
          ? /* HTML */ `<meta
              property="og:description"
              content="${escape(file.data.description)}"
            />`
          : ""}
        <link rel="canonical" href="${escape(canonical)}" />
        <link
          rel="alternate"
          type="application/rss+xml"
          href="${escape(new URL("feed.xml", config.base).toString())}"
        />
        <script type="application/ld+json">
          ${escape(
            JSON.stringify(
              /** @type {import("schema-dts").BlogPosting} */ ({
                "@context": "https://schema.org/",
                "@type": "BlogPosting",
                author: {
                  "@type": "Person",
                  name: config.author,
                },
                dateModified: file.data.dateModified?.toISOString(),
                datePublished: file.data.datePublished?.toISOString(),
                headline: file.data.title,
                image: new URL("ogp.png", config.base).toString(),
              }),
            ),
          )}
        </script>
        <style>
          body {
            max-width: 40em;
            margin: 8px auto;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html> `;
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, data);

  await writeRedirect(
    config,
    file.data.redirectFrom,
    file.data.title,
    dest,
    canonical,
  );

  return {
    content,
    title: file.data.title,
    description: file.data.description,
    datePublished: file.data.datePublished,
    dateModified: file.data.dateModified,
    dest,
    canonical,
  };
}

/**
 * @param {object} config
 * @param {string} config.srcRoot
 * @param {string} config.destRoot
 * @param {string} src
 * @returns {Promise<{ dest: string }>}
 */
async function writeImage({ srcRoot, destRoot }, src) {
  let dest = join(destRoot, relative(srcRoot, src));
  await mkdir(dirname(dest), { recursive: true });
  await copyFile(src, dest);

  return { dest };
}

/**
 * @param {object} config
 * @param {string} config.destRoot
 * @param {{ title: string, description?: string, datePublished?: Date, dateModified?: Date }[]} articles
 */
async function transformArticlesElement({ destRoot }, articles) {
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
    (await globby(join(destRoot, "**"))).map(async (path) => {
      let srcExtName = extname(path);
      if (srcExtName == ".html") {
        let originalData = await readFile(path, { encoding: "utf8" });

        let encoder = new TextEncoder();
        let decoder = new TextDecoder();
        let data = "";
        let rewriter = new HTMLRewriter((outputChunk) => {
          data += decoder.decode(outputChunk);
        });

        rewriter.on('[is="x-articles"]', {
          element(element) {
            element.setInnerContent(articlesContent, { html: true });
          },
        });

        try {
          await rewriter.write(encoder.encode(originalData));
          await rewriter.end();
        } finally {
          rewriter.free();
        }

        await writeFile(path, data);
      }
    }),
  );
}

/**
 * @param {object} config
 * @param {string} config.destRoot
 * @param {string=} config.sitemapPath
 * @param {{ loc: string, lastmod?: Date }[]} urls
 */
async function writeSitemap({ destRoot, sitemapPath = "sitemap.xml" }, urls) {
  let dest = join(destRoot, sitemapPath);
  let data = /* XML */ `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
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
  await writeFile(dest, data);
}

/**
 * @param {object} config
 * @param {string} config.destRoot
 * @param {string} config.base
 * @param {string=} config.robotsPath
 * @param {string=} config.sitemapPath
 */
async function writeRobots({
  destRoot,
  base,
  robotsPath = "robots.txt",
  sitemapPath = "sitemap.xml",
}) {
  let dest = join(destRoot, robotsPath);
  let data = `Sitemap: ${new URL(sitemapPath, base)}`;
  await writeFile(dest, data);
}

/**
 * @param {object} config
 * @param {string} config.destRoot
 * @param {string} config.title
 * @param {string} config.base
 * @param {string} config.description
 * @param {string} config.email
 * @param {string} config.author
 * @param {string=} config.rssPath
 * @param {{ title: string, link: string, description?: string, pubDate?: Date, guid: string, content: string }[]} items
 */
async function writeRSS(
  { destRoot, title, base, description, email, author, rssPath = "feed.xml" },
  items,
) {
  let dest = join(destRoot, rssPath);
  let data = /* XML */ `<?xml version="1.0" encoding="UTF-8"?>
  <rss xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" version="2.0">
    <channel>
      <title>${escape(title)}</title>
      <link>${escape(base)}</link>
      <description>${escape(description)}</description>
      <language>en</language>
      <docs>https://www.rssboard.org/rss-specification</docs>
      <managingEditor>${escape(email)} (${escape(author)})</managingEditor>
      <webMaster>${escape(email)} (${escape(author)})</webMaster>
      <lastBuildDate>${escape(new Date().toUTCString())}</lastBuildDate>
      <atom:link href="${escape(new URL(rssPath, base).toString())}" rel="self" type="application/rss+xml" />
      ${items
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
  await writeFile(dest, data);
}

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

/** @type {{ title: string, description?: string, canonical: string, datePublished?: Date, dateModified?: Date }[]} */
let articles = [];

/** @type {{ loc: string, lastmod?: Date }[]} */
let sitemapURLs = [];

/** @type {{ title: string, link: string, description?: string, pubDate?: Date, guid: string, content: string }[]} */
let rssItems = [];

await Promise.all(
  (await globby(join(config.srcRoot, "**"), { gitignore: true })).map(
    async (src) => {
      let srcExtName = extname(src);
      if (srcExtName == ".md") {
        let file = await writeHTML(config, src);
        articles.push(file);
        sitemapURLs.push({
          loc: file.canonical,
          lastmod: file.dateModified,
        });
        rssItems.push({
          title: file.title,
          link: file.canonical,
          description: file.description,
          pubDate: file.datePublished,
          guid: file.canonical,
          content: file.content,
        });
        rssItems = rssItems
          .toSorted(
            (a, b) => (b.pubDate?.getTime() ?? 0) - (a.pubDate?.getTime() ?? 0),
          )
          .slice(0, 10);
      } else if (
        [".jpg", ".jpeg", ".png", ".gif", ".ico"].includes(srcExtName)
      ) {
        await writeImage(config, src);
      }
    },
  ),
);

await transformArticlesElement(config, articles);
await writeSitemap(config, sitemapURLs);
await writeRobots(config);
await writeRSS(config, rssItems);
