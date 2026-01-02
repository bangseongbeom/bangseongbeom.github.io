import { all, createStarryNight } from "@wooorm/starry-night";
import { load } from "cheerio";
import { markdownToHTML } from "comrak";
import { globby } from "globby";
import matter from "gray-matter";
import { toHtml } from "hast-util-to-html";
import { escape } from "html-escaper";
import assert from "node:assert/strict";
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
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(child_process.execFile);

const starryNight = await createStarryNight(all);

const TITLE = "Bang Seongbeom";
const DESCRIPTION = "Developer Bang Seongbeom's technical documentation.";
const AUTHOR = "방성범 (Bang Seongbeom)";
const EMAIL = "bangseongbeom@gmail.com";
const BASE = "https://www.bangseongbeom.com/";
const LANG = "en";

const SRC_ROOT = process.env.SRC_ROOT ?? ".";
const DEST_ROOT = process.env.DEST_ROOT ?? "_site";

const messages = {
  en: {
    title: () => TITLE,
    categoryNames: {
      android: () => "Android",
      git: () => "Git",
      iot: () => "IoT",
      java: () => "Java",
      linux: () => "Linux",
      machineLearning: () => "Machine learning",
      misc: () => "Misc.",
      python: () => "Python",
      web: () => "Web",
    },
    footer: {
      markdown: { title: () => "View as Markdown", content: () => "Markdown" },
      github: { title: () => "View on GitHub", content: () => "GitHub" },
      edit: { title: () => "Suggest an edit", content: () => "Edit" },
      history: { title: () => "View history", content: () => "History" },
      rss: { title: () => "RSS feed", content: () => "RSS" },
    },
  },
  ko: {
    title: () => "방성범",
    categoryNames: {
      android: () => "안드로이드",
      git: () => "깃",
      iot: () => "IoT",
      java: () => "자바",
      linux: () => "리눅스",
      machineLearning: () => "기계 학습",
      misc: () => "기타",
      python: () => "파이썬",
      web: () => "웹",
    },
    footer: {
      markdown: { title: () => "마크다운으로 보기", content: () => "마크다운" },
      github: { title: () => "GitHub에서 보기", content: () => "GitHub" },
      edit: { title: () => "편집 제안", content: () => "편집" },
      history: { title: () => "역사 보기", content: () => "역사" },
      rss: { title: () => "RSS 피드", content: () => "RSS" },
    },
  },
};

/** @type {{ loc: string; lastmod?: Date | null }[]} */
const sitemapURLs = [];

/** @type {{ title: string; link: string; description: string; categories: string[]; pubDate?: Date | null; guid: string; content?: string; }[]} */
let rssItems = [];

await Promise.all(
  (await globby(join(SRC_ROOT, "**"), { gitignore: true })).map(async (src) => {
    if (extname(src) === ".md") {
      const dest = join(
        DEST_ROOT,
        dirname(relative(SRC_ROOT, src)),
        basename(src) === "README.md"
          ? "index.html"
          : `${parse(src).name}.html`,
      );
      const canonical = new URL(
        pathToFileURL(
          join(
            sep,
            dirname(relative(SRC_ROOT, src)),
            basename(src) === "README.md" ? sep : parse(src).name,
          ),
        ).pathname.substring(1),
        BASE,
      ).toString();

      const input = await readFile(src, "utf8");
      /** @type {{ data: { lang?: string; categories?: string[]; title?: string; description?: string; date?: Date; modified_date?: Date; redirect_from?: string[]; }; content: string; }} */
      const file = matter(input);

      let lang;
      try {
        lang = Intl.getCanonicalLocales(file.data.lang)[0];
      } catch {}
      if (!lang) {
        try {
          lang = Intl.getCanonicalLocales(src.split(sep)[0])[0];
        } catch {}
      }
      if (!lang) lang = Intl.getCanonicalLocales(LANG)[0];

      /** @type {keyof typeof messages | undefined} */
      let lc;
      if (Object.keys(messages).includes(lang))
        lc = /** @type {keyof typeof messages} */ (lang);
      if (
        !lc &&
        Object.keys(messages).includes(Intl.getCanonicalLocales(LANG)[0])
      )
        lc = /** @type {keyof typeof messages} */ (
          Intl.getCanonicalLocales(LANG)[0]
        );
      if (!lc) throw new Error();

      let html = markdownToHTML(file.content, {
        extension: {
          alerts: true,
          autolink: true,
          footnotes: true,
          strikethrough: true,
          headerIDs: "",
          table: true,
          tasklist: true,
        },
        render: {
          unsafe: true,
        },
      });

      const $ = load(html, null, false);

      $("[href]").each(function () {
        const $element = $(this);
        const href = $element.attr("href");
        assert(typeof href === "string");
        if (href.endsWith("/README.md"))
          $element.attr("href", href.slice(0, -"README.md".length));
        else if (href.endsWith(".md"))
          $element.attr("href", href.slice(0, -".md".length));
      });

      if (file.data.date) {
        $("h1").after(
          /* HTML */ `<p>
            <time datetime="${escape(file.data.date.toISOString())}"
              >${escape(
                new Intl.DateTimeFormat(lc).format(file.data.date),
              )}</time
            >
          </p>`,
        );
      }

      $("h1").after(
        /* HTML */ `<nav>
          <p>
            <a
              href="${escape(
                pathToFileURL(join(sep, relative(SRC_ROOT, src))).pathname,
              )}"
              title="View as Markdown"
              >Markdown</a
            >
            •
            <a
              href="${escape(
                `https://github.com/bangseongbeom/bangseongbeom.github.io/blob/main${
                  pathToFileURL(join(sep, relative(SRC_ROOT, src))).pathname
                }`,
              )}"
              title="View on GitHub"
              >GitHub</a
            >
            •
            <a
              href="${escape(
                `https://github.com/bangseongbeom/bangseongbeom.github.io/edit/main${
                  pathToFileURL(join(sep, relative(SRC_ROOT, src))).pathname
                }`,
              )}"
              title="Suggest an edit"
              >Edit</a
            >
            •
            <a
              href="${escape(
                `https://github.com/bangseongbeom/bangseongbeom.github.io/commits/main${
                  pathToFileURL(join(sep, relative(SRC_ROOT, src))).pathname
                }`,
              )}"
              title="View history"
              >History</a
            >
            •
            <a
              href="${escape(new URL("feed.xml", BASE).toString())}"
              title="RSS feed"
              >RSS</a
            >
          </p>
        </nav>`,
      );

      $("h1, h2, h3, h4, h5, h6").each(function () {
        const $element = $(this);
        const $anchor = $element.find(".anchor");
        if ($anchor.length) {
          const id = $anchor.attr("id");
          assert(id);
          $element.attr("id", id);
          $anchor.remove();
        }
      });

      $("pre").each(function () {
        const $element = $(this);
        $element.wrap('<div class="highlight"></div>');
        const $code = $element.find("code");

        if (!$code.hasClass("language-output")) {
          $element.after(
            /* HTML */ `<p>
              <button type="button" class="clipboard-copy">
                <span class="copy">복사</span>
                <span class="copied" hidden>복사 완료</span>
              </button>
            </p>`,
          );
        }
      });

      $("runnable-code").each(function () {
        const $element = $(this);
        const $code = $element.find("code");
        const flag = $code.attr("class")?.match(/language-(.+)/)?.[1];
        if (!flag) return;
        const $clipboardCopy = $element.find(".clipboard-copy");

        if (["js", "ts", "py"].includes(flag)) {
          $clipboardCopy.after(/* HTML */ `
            <button type="button" class="run-code">코드 실행</button>
          `);
        } else if (["java"].includes(flag)) {
          $clipboardCopy.after(/* HTML */ `
            <a href="https://dev.java/playground/" target="_blank"
              >The Java Playground에 붙여넣고 실행</a
            >
          `);
        }
      });

      $("code").each(function () {
        const $element = $(this);
        const flag = $element.attr("class")?.match(/language-(.+)/)?.[1];
        if (!flag) return;
        const codeScope = starryNight.flagToScope(flag) ?? null;
        if (!codeScope) return;
        $element.html(
          toHtml(starryNight.highlight($element.text(), codeScope)),
        );
      });

      let title = file.data.title;
      if (!title) title = $("h1").first().text();

      let description = file.data.description;
      if (!description) description = $("#description").text();

      let date = file.data.date;

      let modifiedDate = file.data.modified_date;

      if (!date || !modifiedDate) {
        let committerDates = (
          await execFile("git", [
            "log",
            "--follow",
            "--pretty=tformat:%cI",
            "--",
            src,
          ])
        ).stdout
          .trim()
          .split("\n");
        if (committerDates[0] === "") committerDates = [];
        if (committerDates.length) {
          if (!date)
            date = new Date(/** @type {string} */ (committerDates.at(-1)));
          if (!modifiedDate) modifiedDate = new Date(committerDates[0]);
        }
      }

      html = $.html();

      if (!title) throw new Error();

      const CATEGORY_NAMES = {
        android: messages[lc].categoryNames.android(),
        git: messages[lc].categoryNames.git(),
        iot: messages[lc].categoryNames.iot(),
        java: messages[lc].categoryNames.java(),
        linux: messages[lc].categoryNames.linux(),
        "machine-learning": messages[lc].categoryNames.machineLearning(),
        misc: messages[lc].categoryNames.misc(),
        python: messages[lc].categoryNames.python(),
        web: messages[lc].categoryNames.web(),
      };
      const categories = file.data.categories ?? [];

      await mkdir(dirname(dest), { recursive: true });
      await writeFile(
        dest,
        /* HTML */ `<!DOCTYPE html>
          <html ${lang ? `lang="${lang}"` : ""} prefix="og: https://ogp.me/ns#">
            <head>
              <meta charset="utf-8" />
              <title>${escape(title)}</title>
              ${description
                ? /*HTML */ `<meta name="description" content="${escape(description)}" />`
                : ""}
              <meta name="author" content="${escape(AUTHOR)}" />
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1"
              />
              <meta name="color-scheme" content="light dark" />
              <meta property="og:title" content="${escape(title)}" />
              <meta property="og:type" content="article" />
              <meta
                property="og:image"
                content="${escape(new URL("ogp.png", BASE).toString())}"
              />
              <meta property="og:url" content="${escape(canonical)}" />
              ${description
                ? /*HTML */ `<meta property="og:description" content="${escape(description)}" />`
                : ""}
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
              <link
                rel="alternate"
                type="text/markdown"
                href="${escape(
                  pathToFileURL(join(sep, relative(SRC_ROOT, src))).pathname,
                )}"
              />
              <link
                rel="alternate"
                type="text/html"
                href="${escape(
                  `https://github.com/bangseongbeom/bangseongbeom.github.io/blob/main${
                    pathToFileURL(join(sep, relative(SRC_ROOT, src))).pathname
                  }`,
                )}"
              />
              <link
                rel="alternate"
                type="application/rss+xml"
                href="${escape(new URL("feed.xml", BASE).toString())}"
              />
              <link rel="stylesheet" href="/github-markdown.css" />
              <link rel="stylesheet" href="/github-markdown-extensions.css" />
              <link rel="stylesheet" href="/codemirror-github-theme.css" />
              <style>
                .markdown-body {
                  box-sizing: border-box;
                  min-width: 200px;
                  max-width: 980px;
                  margin: 0 auto;
                  padding: 45px;
                }

                @media (max-width: 767px) {
                  .markdown-body {
                    padding: 15px;
                  }
                }

                main nav,
                time {
                  font-size: 12px;
                }

                .markdown-body .highlight pre,
                .markdown-body .highlight .cm-editor {
                  margin-bottom: var(--base-size-16);
                }
              </style>
              <script type="application/ld+json">
                ${JSON.stringify(
                  /** @satisfies {import("schema-dts").WithContext<import("schema-dts").BlogPosting>} */ ({
                    "@context": "https://schema.org",
                    "@type": "BlogPosting",
                    author: {
                      "@type": "Person",
                      name: AUTHOR,
                    },
                    dateModified: modifiedDate?.toISOString(),
                    datePublished: date?.toISOString(),
                    headline: title,
                    image: new URL("ogp.png", BASE).toString(),
                  }),
                )}
              </script>
              <script type="module" src="/clipboard-copy.js"></script>
              <!--
                Import map generated with JSPM Generator
                Edit here: https://generator.jspm.io/#ZY47DoMwEERdpMhFUmaRIR+XvgQHWMEKHPkneyFKmlw9hs6i2Oa9Gc1eTkKcf71nw5ZGoYcwkjMphdTgwmEILlpi0g+QCp6VL86hH3NxCmSlLPrp+sIV85BM5JJo4XZMxA/Pwe/22F9w2mcldJXLjPs/d2grvhp6F9ypjVv6UmpmM822HGu5TfwB2+nFz+wA
              -->
              <script type="importmap">
                {
                  "imports": {
                    "@codemirror/autocomplete": "https://ga.jspm.io/npm:@codemirror/autocomplete@6.20.0/dist/index.js",
                    "@codemirror/commands": "https://ga.jspm.io/npm:@codemirror/commands@6.10.1/dist/index.js",
                    "@codemirror/lang-javascript": "https://ga.jspm.io/npm:@codemirror/lang-javascript@6.2.4/dist/index.js",
                    "@codemirror/lang-python": "https://ga.jspm.io/npm:@codemirror/lang-python@6.2.1/dist/index.js",
                    "@codemirror/language": "https://ga.jspm.io/npm:@codemirror/language@6.11.3/dist/index.js",
                    "@codemirror/state": "https://ga.jspm.io/npm:@codemirror/state@6.5.2/dist/index.js",
                    "@codemirror/view": "https://ga.jspm.io/npm:@codemirror/view@6.39.4/dist/index.js",
                    "@lezer/highlight": "https://ga.jspm.io/npm:@lezer/highlight@1.2.3/dist/index.js"
                  },
                  "scopes": {
                    "https://ga.jspm.io/": {
                      "@lezer/common": "https://ga.jspm.io/npm:@lezer/common@1.4.0/dist/index.js",
                      "@lezer/javascript": "https://ga.jspm.io/npm:@lezer/javascript@1.5.4/dist/index.js",
                      "@lezer/lr": "https://ga.jspm.io/npm:@lezer/lr@1.4.5/dist/index.js",
                      "@lezer/python": "https://ga.jspm.io/npm:@lezer/python@1.1.18/dist/index.js",
                      "@marijn/find-cluster-break": "https://ga.jspm.io/npm:@marijn/find-cluster-break@1.0.2/src/index.js",
                      "crelt": "https://ga.jspm.io/npm:crelt@1.0.6/index.js",
                      "style-mod": "https://ga.jspm.io/npm:style-mod@4.1.3/src/style-mod.js",
                      "w3c-keyname": "https://ga.jspm.io/npm:w3c-keyname@2.2.8/index.js"
                    }
                  }
                }
              </script>
              <script type="importmap">
                {
                  "imports": {
                    "pyodide": "https://cdn.jsdelivr.net/pyodide/v0.29.0/full/pyodide.js"
                  }
                }
              </script>
              <script type="module" src="/runnable-code.js"></script>
              <!-- Google tag (gtag.js) -->
              <script
                async
                src="https://www.googletagmanager.com/gtag/js?id=G-P5S28YZ348"
              ></script>
              <script>
                window.dataLayer = window.dataLayer || [];
                function gtag() {
                  dataLayer.push(arguments);
                }
                gtag("js", new Date());

                gtag("config", "G-P5S28YZ348");
              </script>
              <script
                src="https://giscus.app/client.js"
                data-repo="bangseongbeom/bangseongbeom.github.io"
                data-repo-id="MDEwOlJlcG9zaXRvcnk5MjM1NjAyNQ==="
                data-category="Comments"
                data-category-id="DIC_kwDOBYE9uc4Ct9yc"
                data-mapping="pathname"
                data-strict="0"
                data-reactions-enabled="1"
                data-emit-metadata="0"
                data-input-position="bottom"
                data-theme="preferred_color_scheme"
                ${lang ? `data-lang="${lang}"` : ""}
                crossorigin="anonymous"
                async
              ></script>
              <script src="https://cdn.jsdelivr.net/npm/anchor-js/anchor.min.js"></script>
              <script>
                document.addEventListener("DOMContentLoaded", function () {
                  anchors.add();
                });
              </script>
            </head>
            <body class="markdown-body">
              <nav>
                <p><a href="/">${escape(messages[lc].title())}</a></p>
                ${categories.map(
                  (category) =>
                    /* HTML */ `<p>
                      <a href="/${category}"
                        >${escape(
                          CATEGORY_NAMES[
                            /** @type {keyof typeof CATEGORY_NAMES} */ (
                              category
                            )
                          ],
                        )}</a
                      >
                    </p>`,
                )}
              </nav>
              <main>${html}</main>
              ${["/README.md", "/404.md"].includes(
                pathToFileURL(join(sep, relative(SRC_ROOT, src))).pathname,
              )
                ? ""
                : /* HTML */ `<section id="comments" class="giscus"></section>`}
            </body>
          </html>`,
      );

      sitemapURLs.push({
        loc: canonical,
        lastmod: modifiedDate ?? date ?? null,
      });
      rssItems.push({
        title,
        link: canonical,
        description: html,
        categories,
        pubDate: date ?? null,
        guid: canonical,
      });

      if (file.data.redirect_from) {
        for (const redirectFromPath of file.data.redirect_from) {
          const path = isAbsolute(redirectFromPath)
            ? join(DEST_ROOT, redirectFromPath)
            : join(dest, "..", redirectFromPath);
          await mkdir(dirname(path), {
            recursive: true,
          });
          await writeFile(
            path,
            /* HTML */ `<!DOCTYPE html>
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
              </html> `,
          );
        }
      }
    }
    if (
      [".md", ".jpg", ".jpeg", ".png", ".gif", ".ico", ".svg", ".css"].includes(
        extname(src),
      )
    ) {
      const dest = join(DEST_ROOT, relative(SRC_ROOT, src));
      await mkdir(dirname(dest), { recursive: true });
      await copyFile(src, dest);
    }
  }),
);

await writeFile(
  join(DEST_ROOT, "sitemap.xml"),
  /* XML */ `<?xml version="1.0" encoding="UTF-8"?>
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
`,
);

await writeFile(
  join(DEST_ROOT, "robots.txt"),
  `Sitemap: ${new URL("sitemap.xml", BASE)}`,
);

rssItems = rssItems
  .toSorted((a, b) => (b.pubDate?.getTime() ?? 0) - (a.pubDate?.getTime() ?? 0))
  .slice(0, 10);

await writeFile(
  join(DEST_ROOT, "feed.xml"),
  /* XML */ `<?xml version="1.0" encoding="UTF-8"?>
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
      <description>${escape(item.description)}</description>
      ${item.categories.map((category) => /* XML */ `<category>${escape(category)}</category>`).join("\n")}
      ${item.pubDate ? /* XML*/ `<pubDate>${escape(item.pubDate.toUTCString())}</pubDate>` : ""}
      <guid>${escape(item.guid)}</guid>
      ${item.content ? /* XML */ `<content:encoded>${escape(item.content)}</content:encoded>` : ""}
    </item>
    `,
      )
      .join("")}
  </channel>
</rss>
`,
);

await copyFile(
  fileURLToPath(import.meta.resolve("github-markdown-css/github-markdown.css")),
  join(DEST_ROOT, "github-markdown.css"),
);
await copyFile(
  join(SRC_ROOT, "clipboard-copy.js"),
  join(DEST_ROOT, "clipboard-copy.js"),
);
await copyFile(
  join(SRC_ROOT, "runnable-code.js"),
  join(DEST_ROOT, "runnable-code.js"),
);
