import { all, createStarryNight } from "@wooorm/starry-night";
import { markdownToHTML } from "comrak";
import GithubSlugger from "github-slugger";
import { globby } from "globby";
import matter from "gray-matter";
import { toHtml } from "hast-util-to-html";
import { escape, unescape } from "html-escaper";
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
import * as ts from "typescript";

const execFile = promisify(child_process.execFile);

const starryNight = await createStarryNight(all);

const TITLE = "방성범 블로그";
const DESCRIPTION = "개발자 방성범의 기술 블로그";
const AUTHOR = "방성범 (Bang Seongbeom)";
const EMAIL = "bangseongbeom@gmail.com";
const BASE = "https://www.bangseongbeom.com/";

const SRC_ROOT = process.env.SRC_ROOT ?? ".";
const DEST_ROOT = process.env.DEST_ROOT ?? "_site";

let sitemapURLs = [] as { loc: string; lastmod?: Date | null }[];

let rssItems = [] as {
  title: string;
  link: string;
  description: string;
  categories: string[];
  pubDate?: Date | null;
  guid: string;
  content?: string;
}[];

await Promise.all(
  (await globby(join(SRC_ROOT, "**"), { gitignore: true })).map(async (src) => {
    if (extname(src) == ".md") {
      let dest = join(
        DEST_ROOT,
        dirname(relative(SRC_ROOT, src)),
        basename(src) == "README.md" ? "index.html" : `${parse(src).name}.html`,
      );
      let canonical = new URL(
        pathToFileURL(
          join(
            sep,
            dirname(relative(SRC_ROOT, src)),
            basename(src) == "README.md" ? sep : parse(src).name,
          ),
        ).pathname.substring(1),
        BASE,
      ).toString();

      let input = await readFile(src, { encoding: "utf8" });
      let file = matter(input) as {
        data: {
          categories?: string[];
          title?: string;
          description?: string;
          date_published?: Date;
          date_modified?: Date;
          redirect_from?: string[];
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

      rewriter.on("h1", {
        element(element) {
          element.after(
            /* HTML */ `<footer>
              <p>
                <a
                  rel="alternate"
                  type="text/markdown"
                  href="${escape(
                    pathToFileURL(join(sep, relative(SRC_ROOT, src))).pathname,
                  )}"
                  >마크다운으로 보기</a
                >
                |
                <a
                  rel="alternate"
                  type="text/html"
                  href="${escape(
                    `https://github.com/bangseongbeom/bangseongbeom.github.io/blob/main${
                      pathToFileURL(join(sep, relative(SRC_ROOT, src))).pathname
                    }`,
                  )}"
                  >GitHub에서 보기</a
                >
                |
                <a
                  href="${escape(
                    `https://github.com/bangseongbeom/bangseongbeom.github.io/edit/main${
                      pathToFileURL(join(sep, relative(SRC_ROOT, src))).pathname
                    }`,
                  )}"
                  >편집 제안</a
                >
                |
                <a
                  rel="alternate"
                  type="application/rss+xml"
                  href="${escape(new URL("feed.xml", BASE).toString())}"
                  a
                  >RSS</a
                >
              </p>
            </footer>`,
            { html: true },
          );
        },
      });

      rewriter.on(".anchor", {
        element(element) {
          element.remove();
        },
      });

      let alertText = "";
      let alertType: string | null;
      let alertFirstText = true;
      rewriter.on("blockquote > p:first-child", {
        text(text) {
          let textContent = text.text;
          if (alertFirstText) {
            let matchArray = textContent.match(
              /\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s/i,
            );
            if (matchArray) {
              alertType = matchArray[1] ?? null;
              textContent = textContent.replace(
                /\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s/i,
                "",
              );
            }
          }
          alertText += textContent;
          text.remove();

          if (text.lastInTextNode) alertFirstText = true;
          else alertFirstText = false;
        },
      });
      rewriter.on("blockquote *", {
        element(element) {
          alertText += `<${element.tagName}${Array.from(element.attributes)
            .map(([k, v]) => ` ${k}="${escape(v)}"`)
            .join("")}>`;
          element.onEndTag((endTag) => {
            alertText += `</${endTag.name}>`;
          });
          element.removeAndKeepContent();
        },
        text(text) {
          if (text.removed) return;
          alertText += text.text;
          text.remove();
        },
        comments(comment) {
          alertText += `<!--${comment.text}-->`;
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
                    }[alertType.toLowerCase()]}${alertType[0]!.toUpperCase() +
                    alertType.substring(1).toLowerCase()}
                  </p>
                  ${alertText}
                </div>`,
                { html: true },
              );
            } else {
              endTag.after(/* HTML */ `<blockquote>${alertText}</blockquote>`, {
                html: true,
              });
            }

            alertText = "";
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

      rewriter.on("pre", {
        element(element) {
          element.before(`<div class="highlight">`, { html: true });
          element.after(`</div>`, { html: true });
          element.after(
            /* HTML */ `<div>
              <button type="button" class="clipboard-copy">
                <svg
                  aria-hidden="true"
                  height="16"
                  viewBox="0 0 16 16"
                  version="1.1"
                  width="16"
                  class="octicon octicon-copy js-clipboard-copy-icon"
                >
                  <path
                    d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"
                  ></path>
                  <path
                    d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"
                  ></path>
                </svg>
                <svg
                  aria-hidden="true"
                  height="16"
                  viewBox="0 0 16 16"
                  version="1.1"
                  width="16"
                  class="octicon octicon-check js-clipboard-check-icon color-fg-success"
                  style="display: none;"
                >
                  <path
                    d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"
                  ></path>
                </svg>
              </button>
            </div>`,
            {
              html: true,
            },
          );
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

      let slugger = new GithubSlugger();
      let headingContent = "";
      let headingText = "";
      rewriter.on("h1, h2, h3, h4, h5, h6", {
        element(element) {
          element.removeAndKeepContent();
          element.onEndTag((endTag) => {
            let slug = slugger.slug(unescape(headingText));
            endTag.after(
              /* HTML */ `<div class="markdown-heading">
                <${endTag.name} tabindex="-1" class="heading-element">${headingContent}</${endTag.name}>
                <a id="${escape(slug)}" class="anchor" aria-label="Permalink: ${headingText}" href="#${escape(slug)}">
                  <svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z"></path></svg>
                </a>
              </div>`,
              { html: true },
            );

            headingContent = "";
            headingText = "";
          });
        },
        text(text) {
          headingContent += text.text;
          headingText += text.text;
          text.remove();
        },
      });
      rewriter.on("h1 *, h2 *, h3 *, h4 *, h5 *, h6 *", {
        element(element) {
          if (element.removed) return;
          headingContent += `<${element.tagName}${Array.from(element.attributes)
            .map(([k, v]) => ` ${k}="${escape(v)}"`)
            .join("")}>`;
          element.onEndTag((endTag) => {
            headingContent += `</${endTag.name}>`;
          });
          element.removeAndKeepContent();
        },
      });

      let runnableCodeFlag: string | null;
      rewriter.on("runnable-code", {
        element(element) {
          element.onEndTag((endTag) => {
            if (["js", "ts", "py"].includes(runnableCodeFlag!))
              endTag.before(
                /* HTML */ `<p>
                  <button type="button" class="run-code">코드 실행</button>
                </p>`,
                { html: true },
              );
            else if (["java"].includes(runnableCodeFlag!))
              endTag.before(
                /* HTML */ `<p>
                  <button type="button" class="clipboard-copy">
                    <svg
                      aria-hidden="true"
                      height="16"
                      viewBox="0 0 16 16"
                      version="1.1"
                      width="16"
                      class="octicon octicon-copy js-clipboard-copy-icon"
                    >
                      <path
                        d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"
                      ></path>
                      <path
                        d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"
                      ></path>
                    </svg>
                    <svg
                      aria-hidden="true"
                      height="16"
                      viewBox="0 0 16 16"
                      version="1.1"
                      width="16"
                      class="octicon octicon-check js-clipboard-check-icon color-fg-success"
                      style="display: none;"
                    >
                      <path
                        d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"
                      ></path>
                    </svg>
                    코드 복사
                  </button>
                  후
                  <a href="https://dev.java/playground/" target="_blank"
                    >The Java Playground</a
                  >에 붙여넣어 실행
                </p>`,
                { html: true },
              );
          });
        },
      });
      rewriter.on("runnable-code code", {
        element(element) {
          runnableCodeFlag =
            element.getAttribute("class")?.match(/language-(.+)/)?.[1] ?? null;
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
      let codeText = "";
      rewriter.on("code", {
        element(element) {
          let flag = element.getAttribute("class")?.match(/language-(.+)/)?.[1];
          if (!flag) return;
          codeScope = starryNight.flagToScope(flag) ?? null;
          element.onEndTag((endTag) => {
            if (!codeScope) return;
            endTag.before(
              toHtml(starryNight.highlight(unescape(codeText), codeScope)),
              { html: true },
            );
            codeScope = null;
            codeText = "";
          });
        },
        text(text) {
          if (!codeScope) return;
          codeText += text.text;
          text.remove();
        },
      });

      let title = file.data.title;
      if (!title) {
        rewriter.on("h1", {
          text(text) {
            if (!title) title = unescape(text.text);
          },
        });
      }

      let description = file.data.description;
      if (!description) {
        rewriter.on("#description", {
          text(text) {
            if (!description) description = unescape(text.text);
          },
        });
      }

      let datePublished = file.data.date_published;

      let dateModified = file.data.date_modified;

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
          if (!datePublished) datePublished = new Date(committerDates.at(-1)!);
          if (!dateModified) dateModified = new Date(committerDates[0]!);
        }
      }

      const CATEGORY_NAMES = {
        android: "안드로이드",
        etc: "기타",
        git: "깃",
        iot: "IoT",
        java: "자바",
        linux: "리눅스",
        "machine-learning": "기계 학습",
        python: "파이썬",
        web: "웹",
      } as const;
      let categories = (file.data.categories ??
        []) as (keyof typeof CATEGORY_NAMES)[];
      let categoryHTML = categories.map(
        (category) =>
          /*HTML */ `<p><a href="/${category}">${escape(CATEGORY_NAMES[category])}</a></p>`,
      );

      await mkdir(dirname(dest), { recursive: true });
      await writeFile(
        dest,
        /* HTML */ `<!DOCTYPE html>
          <html lang="en" prefix="og: https://ogp.me/ns#">
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
              <script type="application/ld+json">
                ${JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "BlogPosting",
                  author: {
                    "@type": "Person",
                    name: AUTHOR,
                  },
                  dateModified: dateModified?.toISOString(),
                  datePublished: datePublished?.toISOString(),
                  headline: title,
                  image: new URL("ogp.png", BASE).toString(),
                } as WithContext<BlogPosting>)}
              </script>
              <script type="module" src="/clipboard-copy.js"></script>
              <!--
                Import map generated with JSPM Generator
                Edit here: https://generator.jspm.io/#ZY47DoMwEERdpMhFUmaRIR+XvgQHWMEKHPkneyFKmlw9hs6i2Oa9Gc1eTkKcf71nw5ZGoYcwkjMphdTgwmEILlpi0g+QCp6VL86hH3NxCmSlLPrp+sIV85BM5JJo4XZMxA/Pwe/22F9w2mcldJXLjPs/d2grvhp6F9ypjVv6UmpmM822HGu5TfwB2+nFz+wA
              -->
              <script type="importmap">
                {
                  "imports": {
                    "@codemirror/autocomplete": "https://ga.jspm.io/npm:@codemirror/autocomplete@6.18.7/dist/index.js",
                    "@codemirror/commands": "https://ga.jspm.io/npm:@codemirror/commands@6.8.1/dist/index.js",
                    "@codemirror/lang-javascript": "https://ga.jspm.io/npm:@codemirror/lang-javascript@6.2.4/dist/index.js",
                    "@codemirror/lang-python": "https://ga.jspm.io/npm:@codemirror/lang-python@6.2.1/dist/index.js",
                    "@codemirror/language": "https://ga.jspm.io/npm:@codemirror/language@6.11.3/dist/index.js",
                    "@codemirror/state": "https://ga.jspm.io/npm:@codemirror/state@6.5.2/dist/index.js",
                    "@codemirror/view": "https://ga.jspm.io/npm:@codemirror/view@6.38.2/dist/index.js",
                    "@lezer/highlight": "https://ga.jspm.io/npm:@lezer/highlight@1.2.1/dist/index.js"
                  },
                  "scopes": {
                    "https://ga.jspm.io/": {
                      "@lezer/common": "https://ga.jspm.io/npm:@lezer/common@1.2.3/dist/index.js",
                      "@lezer/javascript": "https://ga.jspm.io/npm:@lezer/javascript@1.5.3/dist/index.js",
                      "@lezer/lr": "https://ga.jspm.io/npm:@lezer/lr@1.4.2/dist/index.js",
                      "@lezer/python": "https://ga.jspm.io/npm:@lezer/python@1.1.18/dist/index.js",
                      "@marijn/find-cluster-break": "https://ga.jspm.io/npm:@marijn/find-cluster-break@1.0.2/src/index.js",
                      "crelt": "https://ga.jspm.io/npm:crelt@1.0.6/index.js",
                      "style-mod": "https://ga.jspm.io/npm:style-mod@4.1.2/src/style-mod.js",
                      "w3c-keyname": "https://ga.jspm.io/npm:w3c-keyname@2.2.8/index.js"
                    }
                  }
                }
              </script>
              <script type="importmap">
                {
                  "imports": {
                    "pyodide": "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/pyodide.js"
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
            </head>
            <body class="markdown-body p-5 container-lg">
              <nav>
                <p><a href="/">${TITLE}</a></p>
                ${categoryHTML}
              </nav>
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
        lastmod: dateModified ?? datePublished ?? null,
      });
      rssItems.push({
        title,
        link: canonical,
        description: html,
        categories,
        pubDate: datePublished ?? null,
        guid: canonical,
      });
      rssItems = rssItems
        .toSorted(
          (a, b) => (b.pubDate?.getTime() ?? 0) - (a.pubDate?.getTime() ?? 0),
        )
        .slice(0, 10);

      if (file.data.redirect_from) {
        for (let redirectFromPath of file.data.redirect_from) {
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

let output = ts.transpileModule(
  await readFile(join(SRC_ROOT, "clipboard-copy.ts"), { encoding: "utf8" }),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      sourceMap: true,
    },
    fileName: "clipboard-copy.ts",
  },
);
await writeFile(join(DEST_ROOT, "clipboard-copy.js"), output.outputText);
await writeFile(
  join(DEST_ROOT, "clipboard-copy.js.map"),
  output.sourceMapText!,
);
await copyFile(
  join(SRC_ROOT, "clipboard-copy.ts"),
  join(DEST_ROOT, "clipboard-copy.ts"),
);

output = ts.transpileModule(
  await readFile(join(SRC_ROOT, "runnable-code.ts"), { encoding: "utf8" }),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      sourceMap: true,
    },
    fileName: "runnable-code.ts",
  },
);
await writeFile(join(DEST_ROOT, "runnable-code.js"), output.outputText);
await writeFile(join(DEST_ROOT, "runnable-code.js.map"), output.sourceMapText!);
await copyFile(
  join(SRC_ROOT, "runnable-code.ts"),
  join(DEST_ROOT, "runnable-code.ts"),
);
