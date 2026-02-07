import { match } from "@formatjs/intl-localematcher";
import { all, createStarryNight } from "@wooorm/starry-night";
import { load } from "cheerio";
import { markdownToHTML } from "comrak";
import { globby } from "globby";
import matter from "gray-matter";
import { toHtml } from "hast-util-to-html";
import { escape } from "html-escaper";
import { fail } from "node:assert/strict";
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

/**
 * @param {string} src
 * @param {string} srcRoot
 * @param {string} destRoot
 */
function srcToDest(src, srcRoot, destRoot) {
  return join(
    destRoot,
    dirname(relative(srcRoot, src)),
    basename(src) === "README.md" ? "index.html" : `${parse(src).name}.html`,
  );
}

/**
 * @param {string} src
 * @param {string} srcRoot
 * @param {string} baseURL
 */
function srcToCanonical(src, srcRoot, baseURL) {
  return new URL(
    pathToFileURL(
      join(
        sep,
        dirname(relative(srcRoot, src)),
        basename(src) === "README.md" ? sep : parse(src).name,
      ),
    ).pathname.substring(1),
    baseURL,
  ).toString();
}

/**
 * @param {string | undefined} fileLang
 * @param {string} src
 * @param {string} defaultLang
 */
function getLang(fileLang, src, defaultLang) {
  let lang;
  try {
    lang = Intl.getCanonicalLocales(fileLang)[0];
  } catch {}
  if (!lang) {
    try {
      lang = Intl.getCanonicalLocales(src.split(sep)[0])[0];
    } catch {}
  }
  if (!lang) lang = Intl.getCanonicalLocales(defaultLang)[0];
  return lang;
}

/**
 * @param {string} src
 */
async function getGitLogDates(src) {
  let gitLogDates = (
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
  if (gitLogDates[0] === "") gitLogDates = [];

  const date = gitLogDates.at(-1);
  const modifiedDate = gitLogDates.at(0);
  return {
    date: date ? new Date(date) : undefined,
    modifiedDate: modifiedDate ? new Date(modifiedDate) : undefined,
  };
}

/**
 * @param {string} markdown
 */
function markdownToCheerioAPI(markdown) {
  const html = markdownToHTML(markdown, {
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

  $("h1, h2, h3, h4, h5, h6").each(function () {
    const $element = $(this);
    const $anchor = $element.find(".anchor");
    if ($anchor.length) {
      const id = $anchor.attr("id") ?? fail();
      $element.attr("id", id);
      $anchor.remove();
    }
  });

  return $;
}

/**
 * @param {import("cheerio").CheerioAPI} $
 */
function convertLinks($) {
  $("[href]").each(function () {
    const $element = $(this);
    const href = $element.attr("href") ?? fail();
    if (href.endsWith("/README.md"))
      $element.attr("href", href.slice(0, -"README.md".length));
    else if (href.endsWith(".md"))
      $element.attr("href", href.slice(0, -".md".length));
  });
}

/**
 * @param {import("cheerio").CheerioAPI} $
 */
function wrapWithHeader($) {
  $("h1").wrap(/* HTML */ `<header></header>`);
}

/**
 * @param {import("cheerio").CheerioAPI} $
 * @param {string} src
 * @param {string} srcRoot
 * @param {keyof typeof messages} lc
 * @param {string} baseURL
 * @param {string} repository
 */
function insertNav($, src, srcRoot, lc, baseURL, repository) {
  $("header").append(/* HTML */ `
    <nav>
      <p>
        <a
          href="${escape(
            pathToFileURL(join(sep, relative(srcRoot, src))).pathname,
          )}"
          title="${escape(messages[lc].header.nav.markdown.title())}"
          >${escape(messages[lc].header.nav.markdown.content())}</a
        >
        <span>·</span>
        <a
          href="${escape(
            `https://github.com/${repository}/blob/main${pathToFileURL(join(sep, relative(srcRoot, src))).pathname}`,
          )}"
          title="${escape(messages[lc].header.nav.github.title())}"
          >${escape(messages[lc].header.nav.github.content())}</a
        >
        <span>·</span>
        <a
          href="${escape(
            `https://github.com/${repository}/edit/main${pathToFileURL(join(sep, relative(srcRoot, src))).pathname}`,
          )}"
          title="${escape(messages[lc].header.nav.edit.title())}"
          >${escape(messages[lc].header.nav.edit.content())}</a
        >
        <span>·</span>
        <a
          href="${escape(
            `https://github.com/${repository}/commits/main${pathToFileURL(join(sep, relative(srcRoot, src))).pathname}`,
          )}"
          title="${escape(messages[lc].header.nav.history.title())}"
          >${escape(messages[lc].header.nav.history.content())}</a
        >
        <span>·</span>
        <a
          href="${escape(new URL("feed.xml", baseURL).toString())}"
          title="${escape(messages[lc].header.nav.rss.title())}"
          >${escape(messages[lc].header.nav.rss.content())}</a
        >
      </p>
    </nav>
  `);
}

/**
 * @param {import("cheerio").CheerioAPI} $
 * @param {Date | undefined} date
 * @param {Date | undefined} modifiedDate
 * @param {string} lang
 */
function insertDates($, date, modifiedDate, lang) {
  if (!date) return;
  if (modifiedDate && modifiedDate.toISOString() !== date.toISOString()) {
    $("header").append(
      /* HTML */ `<p id="dates">
        <span
          >Published:
          <time id="date" datetime="${escape(date.toISOString())}"
            >${escape(new Intl.DateTimeFormat(lang).format(date))}</time
          ></span
        >
        <span>·</span>
        <span
          >Modified:
          <time
            id="modified-date"
            datetime="${escape(modifiedDate.toISOString())}"
            >${escape(new Intl.DateTimeFormat(lang).format(modifiedDate))}</time
          ></span
        >
      </p>`,
    );
  } else {
    $("h1 + header").append(
      /* HTML */ `<p>
        <time id="date" datetime="${escape(date.toISOString())}"
          >${escape(new Intl.DateTimeFormat(lang).format(date))}</time
        >
      </p>`,
    );
  }
}

/**
 * @param {import("cheerio").CheerioAPI} $
 */
function insertClipboardCopy($) {
  $("pre").each(function () {
    const $element = $(this);
    $element.wrap('<div class="highlight"></div>');
    const $code = $element.find("code");

    if (!$code.hasClass("language-output")) {
      $element.after(
        /* HTML */ `<p>
          <button type="button" class="clipboard-copy">
            <span class="normal">Copy</span>
            <span class="copied" hidden>Copied</span>
          </button>
        </p>`,
      );
    }
  });
}

/**
 * @param {import("cheerio").CheerioAPI} $
 */
function insertRunnableCodeChildren($) {
  $("runnable-code").each(function () {
    const $element = $(this);
    const $code = $element.find("code");
    const flag = $code.attr("class")?.match(/language-(.+)/)?.[1];
    if (!flag) return;
    const $clipboardCopy = $element.find(".clipboard-copy");

    if (["js", "ts", "py"].includes(flag)) {
      $clipboardCopy.after(/* HTML */ `
        <button type="button" class="run-code">
          <span class="normal">Run code</span>
          <span class="running" hidden>Running...</span>
        </button>
      `);
    } else if (["java"].includes(flag)) {
      $clipboardCopy.after(/* HTML */ `
        Paste and run in
        <a href="https://dev.java/playground/" target="_blank"
          >The Java Playground</a
        >
      `);
    }
  });
}

/**
 * @param {import("cheerio").CheerioAPI} $
 * @param {Awaited<ReturnType<typeof createStarryNight>>} starryNight
 */
function highlight($, starryNight) {
  $("code").each(function () {
    const $element = $(this);
    const flag = $element.attr("class")?.match(/language-(.+)/)?.[1];
    if (!flag) return;
    const codeScope = starryNight.flagToScope(flag);
    if (!codeScope) return;
    $element.html(toHtml(starryNight.highlight($element.text(), codeScope)));
  });
}

/**
 * @param {{
 *   dest: string;
 *   lang?: string;
 *   title: string;
 *   description?: string;
 *   modifiedDate?: Date | undefined;
 *   date?: Date | undefined;
 *   canonical: string;
 *   baseURL: string;
 *   author: string;
 *   lc: keyof typeof messages;
 *   messages: typeof messages;
 *   categories?: string[];
 *   categoryData: { [key: string]: { name: string; href: string } };
 *   $: import("cheerio").CheerioAPI;
 *   src: string;
 *   srcRoot: string;
 *   repository: string;
 * }} param0
 */
async function writeHTML({
  dest,
  lang,
  title,
  description,
  modifiedDate,
  date,
  canonical,
  baseURL,
  author,
  lc,
  messages,
  categories,
  categoryData,
  $,
  src,
  srcRoot,
  repository,
}) {
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(
    dest,
    /* HTML */ `<!DOCTYPE html>
      <html
        ${lang ? `lang="${escape(lang)}"` : ""}
        prefix="og: https://ogp.me/ns#"
      >
        <head>
          <meta charset="utf-8" />
          <title>${escape(title)}</title>
          ${description
            ? /*HTML */ `<meta name="description" content="${escape(description)}" />`
            : ""}
          <meta name="author" content="${escape(author)}" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="color-scheme" content="light dark" />
          <meta property="og:title" content="${escape(title)}" />
          <meta property="og:type" content="article" />
          <meta
            property="og:image"
            content="${escape(new URL("ogp.png", baseURL).toString())}"
          />
          <meta property="og:url" content="${escape(canonical)}" />
          ${description
            ? /*HTML */ `<meta property="og:description" content="${escape(description)}" />`
            : ""}
          <link rel="canonical" href="${escape(canonical)}" />
          <link
            rel="icon"
            href="${escape(new URL("favicon.ico", baseURL).toString())}"
            sizes="32x32"
          />
          <link
            rel="icon"
            href="${escape(new URL("icon.svg", baseURL).toString())}"
            type="image/svg+xml"
          />
          <link
            rel="apple-touch-icon"
            href="${escape(
              new URL("apple-touch-icon.png", baseURL).toString(),
            )}"
          />
          <link
            rel="alternate"
            type="text/markdown"
            href="${escape(
              pathToFileURL(join(sep, relative(srcRoot, src))).pathname,
            )}"
          />
          <link
            rel="alternate"
            type="text/html"
            href="${escape(
              `https://github.com/${repository}/blob/main${
                pathToFileURL(join(sep, relative(srcRoot, src))).pathname
              }`,
            )}"
          />
          <link
            rel="alternate"
            type="application/rss+xml"
            href="${escape(new URL("feed.xml", baseURL).toString())}"
          />
          <link
            rel="stylesheet"
            href="${escape(new URL("both.css", baseURL).toString())}"
          />
          <link
            rel="stylesheet"
            href="${escape(new URL("codemirror.css", baseURL).toString())}"
          />
          <style>
            @media (hover: none) {
              .anchorjs-link {
                opacity: 1;
              }
            }

            body {
              max-width: 80ch;
              margin-inline: auto;
              padding-inline: 8px;
              line-height: 1.5;
              overflow-wrap: break-word;
            }

            img {
              max-width: 100%;
            }

            pre {
              overflow: auto;
            }

            table {
              border-style: outset;
            }
            table > tr > td,
            table > tr > th,
            table > thead > tr > td,
            table > thead > tr > th,
            table > tbody > tr > td,
            table > tbody > tr > th,
            table > tfoot > tr > td,
            table > tfoot > tr > th {
              border-width: 1px;
              border-style: inset;
            }

            blockquote,
            figure {
              margin-inline: 20px;
            }

            dd {
              margin-inline-start: 20px;
            }
            dir,
            menu,
            ol,
            ul {
              padding-inline-start: 20px;
            }

            code {
              padding: 0.25em;
              background-color: light-dark(
                rgba(0, 0, 0, 0.1),
                rgba(255, 255, 255, 0.1)
              );
            }

            pre {
              padding: 0.5em;
              background-color: light-dark(
                rgba(0, 0, 0, 0.1),
                rgba(255, 255, 255, 0.1)
              );

              code {
                padding: 0;
                background-color: transparent;
              }
            }

            main header p {
              font-size: smaller;
            }

            [data-footnote-ref]::before {
              content: "[";
            }

            [data-footnote-ref]::after {
              content: "]";
            }

            .footnotes {
              font-size: smaller;
            }

            .markdown-alert {
              border-inline-start: 0.25em solid;
              padding-inline: 20px;

              .markdown-alert-title {
                font-weight: bolder;
              }

              &.markdown-alert-note {
                border-color: light-dark(#0969da, #4493f8);

                .markdown-alert-title {
                  color: light-dark(#0969da, #4493f8);
                }
              }

              &.markdown-alert-tip {
                border-color: light-dark(#1a7f37, #3fb950);

                .markdown-alert-title {
                  color: light-dark(#1a7f37, #3fb950);
                }
              }

              &.markdown-alert-important {
                border-color: light-dark(#8250df, #ab7df8);

                .markdown-alert-title {
                  color: light-dark(#8250df, #ab7df8);
                }
              }

              &.markdown-alert-warning {
                border-color: light-dark(#9a6700, #d29922);

                .markdown-alert-title {
                  color: light-dark(#9a6700, #d29922);
                }
              }

              &.markdown-alert-caution {
                border-color: light-dark(#d1242f, #f85149);

                .markdown-alert-title {
                  color: light-dark(#d1242f, #f85149);
                }
              }
            }

            .language-output {
              white-space: pre-wrap;
              word-break: break-word;

              .warn {
                background: light-dark(#fef5d5, #413c26);
              }

              .error {
                background: light-dark(#fcebea, #4f3534);
              }
            }
          </style>
          <script type="application/ld+json">
            ${JSON.stringify(
              /** @satisfies {import("schema-dts").WithContext<import("schema-dts").BlogPosting>} */ ({
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                author: {
                  "@type": "Person",
                  name: author,
                },
                dateModified: modifiedDate?.toISOString(),
                datePublished: date?.toISOString(),
                headline: title,
                image: new URL("ogp.png", baseURL).toString(),
              }),
            )}
          </script>
          <script
            type="module"
            src="${escape(new URL("clipboard-copy.js", baseURL).toString())}"
          ></script>
          <!--
            Import map generated with JSPM Generator
            Edit here: https://generator.jspm.io/#ZY49DsIwDEYzMHARRtKEAhJbLsEBrMRKg/KnxC2ChauTdms7ePH7nj+fDowdf89IjjwapnQyGFwpqXQwUtIpZI+E6s4vgosVbyxANLUxKbhcMQ/Rnl8wQdXFZZp1ft0n8oeGFBe690ewc6/cskqwPHTbXJwcvtu6f3DZBI9fLN3g7ODbkJKto/8DSFlPF+4A
          -->
          <script type="importmap">
            {
              "imports": {
                "@codemirror/autocomplete": "https://ga.jspm.io/npm:@codemirror/autocomplete@6.20.0/dist/index.js",
                "@codemirror/commands": "https://ga.jspm.io/npm:@codemirror/commands@6.10.1/dist/index.js",
                "@codemirror/lang-javascript": "https://ga.jspm.io/npm:@codemirror/lang-javascript@6.2.4/dist/index.js",
                "@codemirror/lang-python": "https://ga.jspm.io/npm:@codemirror/lang-python@6.2.1/dist/index.js",
                "@codemirror/language": "https://ga.jspm.io/npm:@codemirror/language@6.12.1/dist/index.js",
                "@codemirror/state": "https://ga.jspm.io/npm:@codemirror/state@6.5.4/dist/index.js",
                "@codemirror/view": "https://ga.jspm.io/npm:@codemirror/view@6.39.11/dist/index.js",
                "@lezer/highlight": "https://ga.jspm.io/npm:@lezer/highlight@1.2.3/dist/index.js"
              },
              "scopes": {
                "https://ga.jspm.io/": {
                  "@lezer/common": "https://ga.jspm.io/npm:@lezer/common@1.5.0/dist/index.js",
                  "@lezer/javascript": "https://ga.jspm.io/npm:@lezer/javascript@1.5.4/dist/index.js",
                  "@lezer/lr": "https://ga.jspm.io/npm:@lezer/lr@1.4.8/dist/index.js",
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
                "pyodide": "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.js"
              }
            }
          </script>
          <script
            type="module"
            src="${escape(new URL("runnable-code.js", baseURL).toString())}"
          ></script>
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
            data-repo="${escape(repository)}"
            data-repo-id="MDEwOlJlcG9zaXRvcnk5MjM1NjAyNQ==="
            data-category="Comments"
            data-category-id="DIC_kwDOBYE9uc4Ct9yc"
            data-mapping="pathname"
            data-strict="0"
            data-reactions-enabled="1"
            data-emit-metadata="0"
            data-input-position="bottom"
            data-theme="preferred_color_scheme"
            ${lang ? `data-lang="${escape(lang)}"` : ""}
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
        <body>
          <nav id="breadcrumb">
            <p>
              <a href="${new URL(".", baseURL).toString()}"
                >${escape(messages[lc].title())}</a
              >
              ${categories && categories.length >= 1
                ? /* HTML */ `<span>/</span>`
                : ""}${categories
                ?.map((category) =>
                  category
                    .split("/")
                    .map(
                      (_, i, segments) => /* HTML */ `
                        <a
                          href="${escape(
                            categoryData[segments.slice(0, i + 1).join("/")]
                              .href,
                          )}"
                          >${escape(
                            categoryData[
                              /** @type {keyof typeof categoryData} */ (
                                segments.slice(0, i + 1).join("/")
                              )
                            ].name,
                          )}</a
                        >
                      `,
                    )
                    .join(/* HTML */ `<span>/</span>`),
                )
                .join(/* HTML */ `<span>·</span>`) ?? ""}
            </p>
          </nav>
          <main>${$.html()}</main>
          ${["/README.md", "/404.md"].includes(
            pathToFileURL(join(sep, relative(srcRoot, src))).pathname,
          )
            ? ""
            : /* HTML */ `<section id="comments" class="giscus"></section>`}
        </body>
      </html>`,
  );
}

/**
 * @param {string[] | undefined} redirectFrom
 * @param {string} dest
 * @param {string} destRoot
 * @param {string} title
 * @param {string} canonical
 * @param {string} baseURL
 */
async function writeRedirectHTMLs(
  redirectFrom,
  dest,
  destRoot,
  title,
  canonical,
  baseURL,
) {
  if (!redirectFrom) return;

  for (const redirectFromPath of redirectFrom) {
    const resolvedPath = isAbsolute(redirectFromPath)
      ? join(destRoot, redirectFromPath)
      : join(dest, "..", redirectFromPath);
    await mkdir(dirname(resolvedPath), { recursive: true });
    await writeFile(
      resolvedPath,
      /* HTML */ `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${escape(title)}</title>
            <meta http-equiv="refresh" content="0; URL=${escape(canonical)}" />
            <link rel="canonical" href="${escape(canonical)}" />
            <link
              rel="icon"
              href="${escape(new URL("favicon.ico", baseURL).toString())}"
              sizes="32x32"
            />
            <link
              rel="icon"
              href="${escape(new URL("icon.svg", baseURL).toString())}"
              type="image/svg+xml"
            />
            <link
              rel="apple-touch-icon"
              href="${escape(
                new URL("apple-touch-icon.png", baseURL).toString(),
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

/**
 * @param {string} destRoot
 * @param {{ loc: string; lastmod?: Date; changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"; priority?: number }[]} sitemapURLs
 */
async function writeSitemap(destRoot, sitemapURLs) {
  await writeFile(
    join(destRoot, "sitemap.xml"),
    /* XML */ `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapURLs
  .map(
    ({ loc, lastmod, changefreq, priority }) => /* XML */ `<url>
  <loc>${escape(loc)}</loc>
  ${lastmod ? /* XML */ `<lastmod>${escape(lastmod.toISOString())}</lastmod>` : ""}
  ${changefreq ? /* XML */ `<changefreq>${escape(changefreq)}</changefreq>` : ""}
  ${priority !== undefined ? /* XML */ `<priority>${escape(priority.toString())}</priority>` : ""}
</url>
`,
  )
  .join("")}
</urlset>
`,
  );
}

/**
 * @param {string} destRoot
 * @param {string | URL | undefined} baseURL
 */
async function writeSitemapOnlyRobots(destRoot, baseURL) {
  await writeFile(
    join(destRoot, "robots.txt"),
    `Sitemap: ${new URL("sitemap.xml", baseURL)}`,
  );
}

/**
 * @param {string} destRoot
 * @param {{ title: string; link: string; description: string; language?: string; copyright?: string; managingEditor?: string | { email: string; name: string; }; webMaster?: string | { email: string; name: string; }; pubDate?: Date; categories?: string[]; generator?: string; }} param1
 * @param {{ title: string; link: string; description: string; categories?: string[]; pubDate?: Date; guid: string; content?: string; }[]} rssItems
 */
async function writeRSS(
  destRoot,
  {
    title,
    link,
    description,
    language,
    copyright,
    managingEditor,
    webMaster,
    pubDate,
    categories,
    generator,
  },
  rssItems,
) {
  rssItems = rssItems
    .toSorted(
      (a, b) => (b.pubDate?.getTime() ?? 0) - (a.pubDate?.getTime() ?? 0),
    )
    .slice(0, 10);

  await writeFile(
    join(destRoot, "feed.xml"),
    /* XML */ `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" version="2.0">
  <channel>
    <title>${escape(title)}</title>
    <link>${escape(link)}</link>
    <description>${escape(description)}</description>
    ${language ? /* XML */ `<language>${escape(language)}</language>` : ""}
    ${copyright ? /* XML */ `<copyright>${escape(copyright)}</copyright>` : ""}
    ${
      managingEditor
        ? /* XML */ `<managingEditor>${
            typeof managingEditor === "string"
              ? escape(managingEditor)
              : `${escape(managingEditor.email)} (${escape(managingEditor.name)})`
          }</managingEditor>`
        : ""
    }
    ${
      webMaster
        ? /* XML */ `<webMaster>${
            typeof webMaster === "string"
              ? escape(webMaster)
              : `${escape(webMaster.email)} (${escape(webMaster.name)})`
          }</webMaster>`
        : ""
    }
    ${pubDate ? /* XML */ `<pubDate>${escape(pubDate.toUTCString())}</pubDate>` : ""}
    <lastBuildDate>${escape(new Date().toUTCString())}</lastBuildDate>
    ${
      categories
        ?.map(
          (category) => /* XML */ `<category>${escape(category)}</category>`,
        )
        .join("") ?? ""
    }
    ${generator ? /* XML */ `<generator>${escape(generator)}</generator>` : ""}
    <docs>https://www.rssboard.org/rss-specification</docs>
    <atom:link href="${escape(new URL("feed.xml", link).toString())}" rel="self" type="application/rss+xml" />
    ${rssItems
      .map(
        (item) => /* XML */ `<item>
      <title>${escape(item.title)}</title>
      <link>${escape(item.link)}</link>
      <description>${escape(item.description)}</description>
      ${item.categories?.map((category) => /* XML */ `<category>${escape(category)}</category>`).join("") ?? ""}
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
}

const execFile = promisify(child_process.execFile);

const starryNight = await createStarryNight(all);

const repository = "bangseongbeom/bangseongbeom.github.io";
const title = "Bang Seongbeom";
const description = "Developer Bang Seongbeom's technical documentation.";
const author = {
  name: "방성범 (Bang Seongbeom)",
  email: "bangseongbeom@gmail.com",
};
const baseURL = process.env.BASE_URL ?? fail("BASE_URL is required");
const defaultLang = "en";

const srcRoot = process.env.SRC_ROOT ?? ".";
const destRoot = process.env.DEST_ROOT ?? "_site";

const messages = {
  en: {
    title: () => title,

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
    header: {
      nav: {
        markdown: {
          title: () => "View as Markdown",
          content: () => "Markdown",
        },
        github: { title: () => "View on GitHub", content: () => "GitHub" },
        edit: { title: () => "Suggest an edit", content: () => "Edit" },
        history: { title: () => "View history", content: () => "History" },
        rss: { title: () => "RSS feed", content: () => "RSS" },
      },
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
    header: {
      nav: {
        markdown: {
          title: () => "마크다운으로 보기",
          content: () => "마크다운",
        },
        github: { title: () => "GitHub에서 보기", content: () => "GitHub" },
        edit: { title: () => "편집 제안", content: () => "편집" },
        history: { title: () => "역사 보기", content: () => "역사" },
        rss: { title: () => "RSS 피드", content: () => "RSS" },
      },
    },
  },
};

/** @type {{ loc: string; lastmod?: Date; changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"; priority?: number }[]} */
const sitemapURLs = [];

/** @type {{ title: string; link: string; description: string; categories?: string[]; pubDate?: Date; guid: string; content?: string; }[]} */
let rssItems = [];

await Promise.all(
  (await globby(join(srcRoot, "**"), { gitignore: true })).map(async (src) => {
    if (extname(src) === ".md") {
      const dest = srcToDest(src, srcRoot, destRoot);
      const canonical = srcToCanonical(src, srcRoot, baseURL);

      const markdown = await readFile(src, "utf8");
      /** @type {{ data: { lang?: string; categories?: string[]; title?: string; description?: string; date?: Date; modified_date?: Date; redirect_from?: string[]; }; content: string; }} */
      const { data: frontMatter, content } = matter(markdown);

      const lang = getLang(frontMatter.lang, src, defaultLang);
      const lc = /** @type {keyof typeof messages} */ (
        match([lang], Object.keys(messages), defaultLang)
      );

      const gitLogDates = await getGitLogDates(src);
      const date = frontMatter.date ?? gitLogDates.date;
      const modifiedDate =
        frontMatter.modified_date ?? gitLogDates.modifiedDate;

      const $ = markdownToCheerioAPI(content);

      convertLinks($);

      const title =
        frontMatter.title ??
        $("h1").first().prop("textContent") ??
        fail("title is required");
      const description =
        frontMatter.description ?? $("h1 + p").prop("textContent") ?? undefined;

      const rssDescription = $.html();

      wrapWithHeader($);
      insertNav($, src, srcRoot, lc, baseURL, repository);
      insertDates($, frontMatter.date, modifiedDate, lang);
      insertClipboardCopy($);
      insertRunnableCodeChildren($);
      highlight($, starryNight);

      const categoryData = {
        android: {
          name: messages[lc].categoryNames.android(),
          href: "/android",
        },
        git: { name: messages[lc].categoryNames.git(), href: "/git" },
        iot: { name: messages[lc].categoryNames.iot(), href: "/iot" },
        java: { name: messages[lc].categoryNames.java(), href: "/java" },
        linux: { name: messages[lc].categoryNames.linux(), href: "/linux" },
        "machine-learning": {
          name: messages[lc].categoryNames.machineLearning(),
          href: "/machine-learning",
        },
        misc: { name: messages[lc].categoryNames.misc(), href: "/misc" },
        python: { name: messages[lc].categoryNames.python(), href: "/python" },
        web: { name: messages[lc].categoryNames.web(), href: "/web" },
      };
      const categories = frontMatter.categories;

      await writeHTML({
        dest,
        lang,
        title,
        description,
        modifiedDate,
        date,
        canonical,
        baseURL,
        author: author.name,
        lc,
        messages,
        categories,
        categoryData,
        $,
        src,
        srcRoot,
        repository,
      });

      sitemapURLs.push({
        loc: canonical,
        lastmod: modifiedDate,
      });
      rssItems.push({
        title,
        link: canonical,
        description: rssDescription,
        categories,
        pubDate: date,
        guid: canonical,
      });

      await writeRedirectHTMLs(
        frontMatter.redirect_from,
        dest,
        destRoot,
        title,
        canonical,
        baseURL,
      );
    }
    if (
      [".md", ".jpg", ".jpeg", ".png", ".gif", ".ico", ".svg", ".css"].includes(
        extname(src),
      )
    ) {
      const dest = join(destRoot, relative(srcRoot, src));
      await mkdir(dirname(dest), { recursive: true });
      await copyFile(src, dest);
    }
  }),
);

await writeSitemap(destRoot, sitemapURLs);
await writeSitemapOnlyRobots(destRoot, baseURL);
await writeRSS(
  destRoot,
  {
    title,
    link: baseURL,
    description,
    language: defaultLang,
    managingEditor: author,
    webMaster: author,
  },
  rssItems,
);

await copyFile(
  fileURLToPath(import.meta.resolve("@wooorm/starry-night/style/both")),
  join(destRoot, "both.css"),
);
await copyFile(
  join(srcRoot, "clipboard-copy.js"),
  join(destRoot, "clipboard-copy.js"),
);
await copyFile(
  join(srcRoot, "runnable-code.js"),
  join(destRoot, "runnable-code.js"),
);
