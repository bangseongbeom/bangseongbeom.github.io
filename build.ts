import { all, createStarryNight } from "@wooorm/starry-night";
import { markdownToHTML } from "comrak";
import escape from "escape-html";
import { globby } from "globby";
import matter from "gray-matter";
import { toHtml } from "hast-util-to-html";
import { HTMLRewriter } from "html-rewriter-wasm";
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
import type { BlogPosting, WithContext } from "schema-dts";

const execFile = promisify(child_process.execFile);

const starryNight = await createStarryNight(all);

const TITLE = "방성범 블로그";
const DESCRIPTION = "개발자 방성범의 기술 블로그";
const AUTHOR = "방성범 (Bang Seongbeom)";
const EMAIL = "bangseongbeom@gmail.com";
const BASE = "https://www.bangseongbeom.com/";

const SRC_ROOT = process.env.SRC_ROOT ?? ".";
const DEST_ROOT = process.env.DEST_ROOT ?? "_site";

let sitemapURLs = [] as { loc: string; lastmod?: Date }[];

let rssItems = [] as {
  title: string;
  link: string;
  description: string;
  pubDate?: Date;
  guid: string;
  content?: string;
}[];

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

      let input = await readFile(src, { encoding: "utf8" });
      let file = matter(input) as {
        data: {
          title?: string;
          description?: string;
          datePublished?: Date;
          dateModified?: Date;
          redirectFrom?: string[];
        };
        content: string;
      };
      let html = markdownToHTML(file.content, {
        extension: {
          autolink: true,
          footnotes: true,
          strikethrough: true,
          table: true,
          tasklist: true,
        },
        render: {
          unsafe: true,
        },
      });

      let encoder = new TextEncoder();
      let decoder = new TextDecoder();

      let output = "";
      let rewriter = new HTMLRewriter((outputChunk) => {
        output += decoder.decode(outputChunk);
      });

      let heading = "";
      let headingAnchor = "";
      rewriter.on("h1, h2, h3, h4, h5, h6", {
        element(element) {
          heading += `<${element.tagName} class="heading-element">`;
          element.onEndTag((endTag) => {
            heading += `</${endTag.name}>`;
            endTag.after(
              /* HTML */ ` <div class="markdown-heading">
                ${headingAnchor}${heading}
              </div>`,
              { html: true },
            );

            heading = "";
            headingAnchor = "";
          });
          element.removeAndKeepContent();
        },
        text(text) {
          heading += escape(text.text);
          text.remove();
        },
      });
      rewriter.on(
        "h1 .anchor, h2 .anchor, h3 .anchor, h4 .anchor, h5 .anchor, h6 .anchor",
        {
          element(element) {
            headingAnchor += `<${element.tagName}${Array.from(
              element.attributes,
            )
              .map(([k, v]) => ` ${k}="${escape(v)}"`)
              .join("")}>`;
            headingAnchor += `<svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z"></path></svg>`;
            headingAnchor += `</${element.tagName}>`;
            element.remove();
          },
        },
      );
      rewriter.on("h1 *, h2 *, h3 *, h4 *, h5 *, h6 *", {
        element(element) {
          if (element.removed) return;
          heading += `<${element.tagName}${Array.from(element.attributes)
            .map(([k, v]) => ` ${k}="${escape(v)}"`)
            .join("")}>`;
          element.onEndTag((endTag) => {
            heading += `</${endTag.name}>`;
          });
          element.removeAndKeepContent();
        },
      });

      let alertContent = "";
      let alertType = null as string;
      let alertFirstText = true;
      rewriter.on("blockquote > p:first-child", {
        text(text) {
          let textContent = text.text;
          if (alertFirstText) {
            let matchArray = textContent.match(
              /\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s/i,
            );
            if (matchArray) {
              alertType = matchArray[1];
              textContent = textContent.replace(
                /\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s/i,
                "",
              );
            }
          }
          alertContent += escape(textContent);
          text.remove();

          if (text.lastInTextNode) alertFirstText = true;
          else alertFirstText = false;
        },
      });
      rewriter.on("blockquote *", {
        element(element) {
          alertContent += `<${element.tagName}${Array.from(element.attributes)
            .map(([k, v]) => ` ${k}="${escape(v)}"`)
            .join("")}>`;
          element.onEndTag((endTag) => {
            alertContent += `</${endTag.name}>`;
          });
          element.removeAndKeepContent();
        },
        text(text) {
          if (text.removed) return;
          alertContent += escape(text.text);
          text.remove();
        },
        comments(comment) {
          alertContent += `<!--${escape(comment.text)}-->`;
          comment.remove();
        },
      });
      rewriter.on("blockquote", {
        element(element) {
          element.removeAndKeepContent();
          element.onEndTag((endTag) => {
            if (alertType) {
              endTag.after(
                /* HTML */ `<div
                  class="markdown-alert markdown-alert-${alertType.toLowerCase()}"
                >
                  <p class="markdown-alert-title">
                    ${{
                      note: `<svg class="octicon octicon-info mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>`,
                      tip: `<svg class="octicon octicon-light-bulb mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path></svg>`,
                      important: `<svg class="octicon octicon-report mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>`,
                      warning: `<svg class="octicon octicon-alert mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>`,
                      caution: `<svg class="octicon octicon-stop mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>`,
                    }[alertType.toLowerCase()]}${alertType[0].toUpperCase() +
                    alertType.substring(1).toLowerCase()}
                  </p>
                  ${alertContent}
                </div>`,
                { html: true },
              );
            } else {
              endTag.after(
                /* HTML */ `<blockquote>${alertContent}</blockquote>`,
                { html: true },
              );
            }

            alertContent = "";
            alertType = null;
          });
        },
      });

      try {
        await rewriter.write(encoder.encode(html));
        await rewriter.end();
        html = output;
      } finally {
        rewriter.free();
      }

      output = "";
      rewriter = new HTMLRewriter((outputChunk) => {
        output += decoder.decode(outputChunk);
      });

      let codeScope: string | null;
      let codeContent = "";
      rewriter.on("code", {
        element(element) {
          let flag = element
            .getAttribute("class")
            ?.match(/language-(\w+)/)?.[1];
          if (!flag) return;
          codeScope = starryNight.flagToScope(flag) ?? null;
          element.onEndTag((endTag) => {
            if (!codeScope) return;
            endTag.before(
              toHtml(starryNight.highlight(codeContent, codeScope)),
              { html: true },
            );
            codeScope = null;
            codeContent = "";
          });
        },
        text(text) {
          if (!codeScope) return;
          codeContent += text.text;
          text.remove();
        },
      });

      rewriter.on("[href]", {
        element(element) {
          let href = element.getAttribute("href");
          assert(typeof href == "string");
          if (href.endsWith("/README.md"))
            element.setAttribute("href", href.slice(0, -"README.md".length));
          else if (href.endsWith(".md"))
            element.setAttribute("href", href.slice(0, -".md".length));
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

      let datePublished = file.data.datePublished;
      if (!datePublished) {
        rewriter.on("time#date-published", {
          element(element) {
            let dateTime = element.getAttribute("datetime");
            if (!dateTime) throw new Error("datetime not found");
            datePublished = new Date(dateTime);
          },
        });
      }

      let dateModified = file.data.dateModified;
      if (!dateModified) {
        rewriter.on("time#date-modified", {
          element(element) {
            let dateTime = element.getAttribute("datetime");
            if (!dateTime) throw new Error("datetime not found");
            if (!dateModified) dateModified = new Date(dateTime);
          },
        });
      }

      try {
        await rewriter.write(encoder.encode(html));
        await rewriter.end();
        html = output;
      } finally {
        rewriter.free();
      }

      if (!title) throw new Error();

      if (!datePublished || !dateModified) {
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
        if (committerDates[0] == "") committerDates = [];
        if (committerDates.length) {
          if (!datePublished)
            datePublished = new Date(committerDates[committerDates.length - 1]);
          if (!dateModified) dateModified = new Date(committerDates[0]);
        }
      }

      await mkdir(dirname(dest), { recursive: true });
      await writeFile(
        dest,
        /* HTML */ `<!DOCTYPE html>
          <html lang="en" prefix="og: https://ogp.me/ns#">
            <head>
              <meta charset="utf-8" />
              <title>${escape(title)}</title>
              <meta name="author" content="${escape(AUTHOR)}" />
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
              <link rel="stylesheet" href="/primer.css" />
              <link rel="stylesheet" href="/both.css" />
              <script type="application/ld+json">
                ${JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "BlogPosting",
                  author: {
                    "@type": "Person",
                    name: escape(AUTHOR),
                  },
                  dateModified: escape(dateModified?.toISOString()),
                  datePublished: escape(datePublished?.toISOString()),
                  headline: escape(title),
                  image: escape(new URL("ogp.png", BASE).toString()),
                } satisfies WithContext<BlogPosting>)}
              </script>
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
                data-repo-id="MDEwOlJlcG9zaXRvcnk5MjM1NjAyNQ=="
                data-category="Comments"
                data-category-id="DIC_kwDOBYE9uc4Ct9yc"
                data-mapping="pathname"
                data-strict="0"
                data-reactions-enabled="1"
                data-emit-metadata="0"
                data-input-position="bottom"
                data-theme="preferred_color_scheme"
                data-lang="ko"
                crossorigin="anonymous"
                async
              ></script>
              <style>
                .markdown-body {
                  max-width: 1012px;
                  margin-right: auto;
                  margin-left: auto;
                  padding: 32px;
                  box-sizing: content-box;
                }
                .markdown-body a {
                  text-decoration: underline;
                  text-underline-offset: 0.2em;
                }
                .markdown-body .markdown-heading {
                  position: relative;
                }
                .markdown-body .markdown-heading .anchor {
                  opacity: 0;
                  position: absolute;
                  top: 0;
                  padding-top: 4px;
                  padding-bottom: 4px;
                  @media (pointer: coarse) {
                    opacity: 1;
                  }
                }
                .markdown-body .markdown-heading:hover .anchor {
                  opacity: 1;
                }
                .markdown-body .markdown-heading .anchor:focus {
                  opacity: 1;
                  border-radius: 6px;
                  outline: 2px solid var(--color-accent-emphasis);
                  outline-offset: -2px;
                }
                .markdown-body .markdown-heading .anchor .octicon {
                  color: var(--color-scale-gray-9);
                }
                .markdown-body .markdown-alert {
                  padding: 0 1em;
                  border-left: 0.25em solid;
                }
                .markdown-body .markdown-alert .markdown-alert-title {
                  display: flex;
                  align-items: center;
                  font-weight: var(--base-text-weight-medium, 500);
                }
                .markdown-body .markdown-alert.markdown-alert-note {
                  border-left-color: var(--borderColor-accent-emphasis);
                }
                .markdown-body
                  .markdown-alert.markdown-alert-note
                  .markdown-alert-title {
                  color: var(--fgColor-accent);
                }
                .markdown-body .markdown-alert.markdown-alert-tip {
                  border-left-color: var(--borderColor-success-emphasis);
                }
                .markdown-body
                  .markdown-alert.markdown-alert-tip
                  .markdown-alert-title {
                  color: var(--fgColor-success);
                }
                .markdown-body .markdown-alert.markdown-alert-important {
                  border-left-color: var(--borderColor-done-emphasis);
                }
                .markdown-body
                  .markdown-alert.markdown-alert-important
                  .markdown-alert-title {
                  color: var(--fgColor-done);
                }
                .markdown-body .markdown-alert.markdown-alert-warning {
                  border-left-color: var(--borderColor-attention-emphasis);
                }
                .markdown-body
                  .markdown-alert.markdown-alert-warning
                  .markdown-alert-title {
                  color: var(--fgColor-attention);
                }
                .markdown-body .markdown-alert.markdown-alert-caution {
                  border-left-color: var(--borderColor-danger-emphasis);
                }
                .markdown-body
                  .markdown-alert.markdown-alert-caution
                  .markdown-alert-title {
                  color: var(--fgColor-danger);
                }
              </style>
            </head>
            <body
              class="markdown-body"
              data-color-mode="auto"
              data-light-theme="light"
              data-dark-theme="dark"
            >
              ${html}
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
        lastmod: dateModified ?? datePublished,
      });
      rssItems.push({
        title,
        link: canonical,
        description: html,
        pubDate: datePublished,
        guid: canonical,
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
      let dest = join(DEST_ROOT, relative(SRC_ROOT, src));
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
  fileURLToPath(import.meta.resolve("@primer/css/dist/primer.css")),
  join(DEST_ROOT, "primer.css"),
);

await copyFile(
  fileURLToPath(import.meta.resolve("@wooorm/starry-night/style/both")),
  join(DEST_ROOT, "both.css"),
);
