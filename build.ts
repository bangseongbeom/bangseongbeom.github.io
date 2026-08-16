import { match } from "@formatjs/intl-localematcher";
import escape from "escape-html";
import GithubSlugger from "github-slugger";
import type { Document, HTMLElement } from "happy-dom";
import { Window } from "happy-dom";
import type NodeList from "happy-dom/lib/nodes/node/NodeList.js";
import { load } from "js-yaml";
import { fail } from "node:assert/strict";
import child_process from "node:child_process";
import { copyFile, glob, mkdir, readFile, writeFile } from "node:fs/promises";
import {
  dirname,
  extname,
  format,
  isAbsolute,
  join,
  parse,
  sep,
} from "node:path";
import { promisify } from "node:util";
import { markdownToHtml } from "satteri";
import expressiveCode from "satteri-expressive-code";
import type { Article, WithContext } from "schema-dts";

interface FrontMatter {
  lang?: string;
  tags?: string[];
  categories?: string[];
  title?: string;
  description?: string;
  date?: string;
  modified_date?: string;
  comments?: boolean;
  redirect_from?: string[];
}

async function markdownToHTML(markdown: string) {
  const result = await markdownToHtml(markdown, {
    hastPlugins: [expressiveCode()],
  });
  return {
    html: result.html,
    frontmatter: (result.frontmatter
      ? load(result.frontmatter.value)
      : {}) as FrontMatter,
  };
}

function toHTMLPath(path: string) {
  const { dir, name, ext } = parse(path);
  return ext === ".md"
    ? format({ dir, name: name === "README" ? "index" : name, ext: ".html" })
    : path;
}

function toURLPathname(path: string) {
  return path.split(sep).map(encodeURIComponent).join("/");
}

function toHTMLURL(url: string, base: string) {
  const htmlURL = new URL(url, base);
  if (htmlURL.pathname.endsWith("/README.md"))
    htmlURL.pathname = htmlURL.pathname.slice(0, -"README.md".length);
  else if (htmlURL.pathname.endsWith(".md"))
    htmlURL.pathname = htmlURL.pathname.slice(0, -".md".length);
  return htmlURL.toString();
}

function getLang(
  fileLang: string | undefined,
  path: string,
  defaultLang: string,
) {
  let lang;
  try {
    lang = Intl.getCanonicalLocales(fileLang)[0];
  } catch {}
  if (!lang) {
    try {
      lang = Intl.getCanonicalLocales(path.split(sep)[0])[0];
    } catch {}
  }
  if (!lang) lang = Intl.getCanonicalLocales(defaultLang)[0];
  return lang;
}

async function getFirstGitLogDate(path: string) {
  const { stdout } = await execFile("git", [
    "log",
    "--follow",
    "--max-count-oldest=1",
    "--pretty=format:%cI",
    "--",
    path,
  ]);
  if (stdout) return new Date(stdout);
}

async function getLastGitLogDate(path: string) {
  const { stdout } = await execFile("git", [
    "log",
    "--max-count=1",
    "--pretty=format:%cI",
    "--",
    path,
  ]);
  if (stdout) return new Date(stdout);
}

function htmlToDocument(html: string) {
  const document = new Window().document;
  document.body.innerHTML = html;
  return document;
}

function insertHeadingIds(document: Document) {
  const slugger = new GithubSlugger();
  for (const heading of document.querySelectorAll("h1, h2, h3, h4, h5, h6")) {
    if (!heading.id) heading.id = slugger.slug(heading.textContent);
  }
}

function convertAlerts(document: Document) {
  for (const blockquote of document.querySelectorAll("blockquote")) {
    const firstParagraph = blockquote.firstElementChild;
    if (firstParagraph?.tagName !== "P") continue;
    const match = firstParagraph.innerHTML.match(
      /^\[!(?<type>NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\n|$)/,
    );
    if (!match) continue;
    const type = match.groups!.type as
      "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION";
    firstParagraph.innerHTML = firstParagraph.innerHTML.slice(match[0].length);
    if (firstParagraph.innerHTML.length === 0) firstParagraph.remove();

    const alert = document.createElement("div");
    alert.className = `markdown-alert markdown-alert-${type.toLowerCase()}`;
    const title = document.createElement("p");
    title.className = "markdown-alert-title";
    title.textContent = {
      NOTE: "Note",
      TIP: "Tip",
      IMPORTANT: "Important",
      WARNING: "Warning",
      CAUTION: "Caution",
    }[type];
    alert.append(title, ...blockquote.childNodes);
    blockquote.replaceWith(alert);
  }
}

function resolveLinks(document: Document, url: string) {
  for (const link of document.querySelectorAll("a")) {
    if (!link.href) continue;
    link.href = toHTMLURL(link.href, url);
  }
}

function removeFirstHeading(document: Document) {
  document.querySelector("h1")?.remove();
}

function insertNav(
  document: Document,
  path: string,
  messages: Messages,
  lc: keyof Messages,
  baseURL: string,
  repository: string,
) {
  for (const header of document.querySelectorAll("header")) {
    header.insertAdjacentHTML(
      "beforeend",
      /* HTML */ `
        <nav>
          <p>
            <a
              href="${escape(new URL(toURLPathname(path), baseURL).toString())}"
              title="${escape(messages[lc].header.nav.markdown.title())}"
              >${escape(messages[lc].header.nav.markdown.content())}</a
            >
            <span>·</span>
            <a
              href="${escape(
                new URL(
                  toURLPathname(path),
                  `https://github.com/${repository}/blob/main/`,
                ).toString(),
              )}"
              title="${escape(messages[lc].header.nav.github.title())}"
              >${escape(messages[lc].header.nav.github.content())}</a
            >
            <span>·</span>
            <a
              href="${escape(
                new URL(
                  toURLPathname(path),
                  `https://github.com/${repository}/edit/main/`,
                ).toString(),
              )}"
              title="${escape(messages[lc].header.nav.edit.title())}"
              >${escape(messages[lc].header.nav.edit.content())}</a
            >
            <span>·</span>
            <a
              href="${escape(
                new URL(
                  toURLPathname(path),
                  `https://github.com/${repository}/commits/main/`,
                ).toString(),
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
      `,
    );
  }
}

function insertAlertOcticons(document: Document) {
  for (const alertTitle of document.querySelectorAll(
    ".markdown-alert.markdown-alert-note .markdown-alert-title",
  )) {
    alertTitle.insertAdjacentHTML(
      "afterbegin",
      /* HTML */ `<svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        width="16"
        height="16"
      >
        <path
          d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
        ></path>
      </svg>`,
    );
  }
  for (const alertTitle of document.querySelectorAll(
    ".markdown-alert.markdown-alert-tip .markdown-alert-title",
  )) {
    alertTitle.insertAdjacentHTML(
      "afterbegin",
      /* HTML */ `<svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        width="16"
        height="16"
      >
        <path
          d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"
        ></path>
      </svg>`,
    );
  }
  for (const alertTitle of document.querySelectorAll(
    ".markdown-alert.markdown-alert-important .markdown-alert-title",
  )) {
    alertTitle.insertAdjacentHTML(
      "afterbegin",
      /* HTML */ `<svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        width="16"
        height="16"
      >
        <path
          d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
        ></path>
      </svg>`,
    );
  }
  for (const alertTitle of document.querySelectorAll(
    ".markdown-alert.markdown-alert-warning .markdown-alert-title",
  )) {
    alertTitle.insertAdjacentHTML(
      "afterbegin",
      /* HTML */ `<svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        width="16"
        height="16"
      >
        <path
          d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
        ></path>
      </svg>`,
    );
  }
  for (const alertTitle of document.querySelectorAll(
    ".markdown-alert.markdown-alert-caution .markdown-alert-title",
  )) {
    alertTitle.insertAdjacentHTML(
      "afterbegin",
      /* HTML */ `<svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        width="16"
        height="16"
      >
        <path
          d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
        ></path>
      </svg>`,
    );
  }
}

function insertRunnableCodeChildren(
  document: Document,
  messages: Messages,
  lc: keyof Messages,
) {
  for (const runnableCode of document.querySelectorAll(
    "runnable-code",
  ) as NodeList<HTMLElement>) {
    const expressiveCode = runnableCode.querySelector(".expressive-code");
    const language =
      (
        expressiveCode?.querySelector(
          "pre[data-language]",
        ) as HTMLPreElement | null
      )?.dataset.language ?? "";

    if (["javascript", "js", "python", "py"].includes(language)) {
      runnableCode.insertAdjacentHTML(
        "beforeend",
        /* HTML */ `<p>
          <button type="button" class="run-code">
            <span class="normal">${escape(messages[lc].runCode.normal())}</span>
            <span class="running" hidden
              >${escape(messages[lc].runCode.running())}</span
            >
          </button>
        </p>`,
      );
    } else if (language === "java") {
      runnableCode.insertAdjacentHTML(
        "beforeend",
        /* HTML */ `<p>
          Paste and run in
          <a href="https://dev.java/playground/" target="_blank"
            >The Java Playground</a
          >
        </p>`,
      );
    }
  }
}

function navItems(pages: { title?: string; url: string }[]) {
  return /* HTML */ `<div class="nav-items">
    ${pages
      .map((page) =>
        page.title
          ? /* HTML */ `
              <a class="nav-item" href="${page.url}">${escape(page.title)}</a>
            `
          : "",
      )
      .join("")}
  </div>`;
}

function header(
  baseURL: string,
  siteTitle: string,
  navPages: { title?: string; url: string }[],
) {
  return /* HTML */ `<header class="site-header">
    <div class="wrapper">
      <a class="site-title" rel="author" href="${escape(baseURL)}"
        >${escape(siteTitle)}</a
      >

      ${
        navPages.length === 0
          ? ""
          : /* HTML */ `<nav class="site-nav">
              <input type="checkbox" id="nav-trigger" />
              <label for="nav-trigger">
                <span class="menu-icon">
                  <svg
                    class="menu-icon-open"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 640 640"
                  >
                    <!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->
                    <path
                      d="M96 160C96 142.3 110.3 128 128 128L512 128C529.7 128 544 142.3 544 160C544 177.7 529.7 192 512 192L128 192C110.3 192 96 177.7 96 160zM96 320C96 302.3 110.3 288 128 288L512 288C529.7 288 544 302.3 544 320C544 337.7 529.7 352 512 352L128 352C110.3 352 96 337.7 96 320zM544 480C544 497.7 529.7 512 512 512L128 512C110.3 512 96 497.7 96 480C96 462.3 110.3 448 128 448L512 448C529.7 448 544 462.3 544 480z"
                    />
                  </svg>
                  <svg
                    class="menu-icon-close"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 640 640"
                  >
                    <!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->
                    <path
                      d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"
                    />
                  </svg>
                </span>
              </label>

              ${navItems(navPages)}
            </nav>`
      }
    </div>
  </header>`;
}

function page(title: string, content: string) {
  return /* HTML */ `<article class="post">
    <header class="post-header">
      <h1 class="post-title">${escape(title)}</h1>
    </header>

    <div class="post-content">${content}</div>
  </article>`;
}

function commentsSection(path: string, lang: string) {
  return ["README.md", "404.md"].includes(path)
    ? ""
    : /* HTML */ ` <script
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
        ${lang ? `data-lang="${escape(lang)}"` : ""}
        crossorigin="anonymous"
        async
      ></script>`;
}

function post(
  title: string,
  modifiedDate: Date | undefined,
  date: Date,
  messages: Messages,
  lc: keyof Messages,
  lang: string,
  authors: string[],
  content: string,
  comments: boolean | undefined,
  path: string,
  url: string,
) {
  return /* HTML */ `<article
    class="post h-entry"
    itemscope
    itemtype="http://schema.org/BlogPosting"
  >
    <header class="post-header">
      <h1 class="post-title p-name" itemprop="name headline">
        ${escape(title)}
      </h1>
      <div class="post-meta">
        ${
          modifiedDate
            ? /* HTML */ `<span class="meta-label"
                >${escape(messages[lc].header.dates.published())}:</span
              >`
            : ""
        }
        <time
          class="dt-published"
          datetime="${escape(date.toISOString())}"
          itemprop="datePublished"
        >
          ${escape(date.toLocaleDateString(lang))}
        </time>
        ${
          modifiedDate
            ? /* HTML */ `<span class="bullet-divider">•</span>
                <span class="meta-label"
                  >${escape(messages[lc].header.dates.modified())}:</span
                >
                <time
                  class="dt-modified"
                  datetime="${escape(modifiedDate.toISOString())}"
                  itemprop="dateModified"
                >
                  ${escape(modifiedDate.toLocaleDateString(lang))}
                </time>`
            : ""
        }
        ${
          authors.length >= 1
            ? /* HTML */ `<div
                class="${modifiedDate ? "" : "force-inline "}post-authors"
              >
                ${authors
                  .map(
                    (author) =>
                      /* HTML */ `<span
                        itemprop="author"
                        itemscope
                        itemtype="http://schema.org/Person"
                      >
                        <span class="p-author h-card" itemprop="name"
                          >${escape(author)}</span
                        >
                      </span>`,
                  )
                  .join(", ")}
              </div>`
            : ""
        }
      </div>
    </header>

    <div class="post-content e-content" itemprop="articleBody">${content}</div>

    ${
      process.env.NODE_ENV === "production"
        ? comments === false
          ? /* HTML */ `<div class="comments-disabled-message">
              Comments have been disabled for this post.
            </div>`
          : commentsSection(path, lang)
        : ""
    }

    <a class="u-url" href="${escape(url)}" hidden></a>
  </article>`;
}

function social(
  socialLinks: { url: string; title: string; icon: string }[],
  hideSiteFeedLink: boolean | undefined,
  feedPath = "feed.xml",
  baseURL: string,
) {
  return /* HTML */ `<ul class="social-media-list">
    ${socialLinks
      .map(
        (entry) =>
          /* HTML */ `<li>
            <a
              rel="me"
              href="${escape(entry.url)}"
              target="_blank"
              title="${escape(entry.title)}"
            >
              <span
                class="grey fa-brands fa-${escape(entry.icon)} fa-lg"
              ></span>
            </a>
          </li>`,
      )
      .join("")}
    ${
      hideSiteFeedLink
        ? ""
        : /* HTML */ `<li>
            <a
              href="${escape(new URL(feedPath, baseURL).toString())}"
              target="_blank"
              title="Subscribe to syndication feed"
            >
              <svg class="svg-icon grey" viewbox="0 0 16 16">
                <path
                  d="M12.8 16C12.8 8.978 7.022 3.2 0 3.2V0c8.777 0 16 7.223 16 16h-3.2zM2.194
          11.61c1.21 0 2.195.985 2.195 2.196 0 1.21-.99 2.194-2.2 2.194C.98 16 0 15.017 0
          13.806c0-1.21.983-2.195 2.194-2.195zM10.606
          16h-3.11c0-4.113-3.383-7.497-7.496-7.497v-3.11c5.818 0 10.606 4.79 10.606 10.607z"
                />
              </svg>
            </a>
          </li>`
    }
  </ul>`;
}

function footer(
  baseURL: string,
  siteAuthor: { name?: string; email?: string } | undefined,
  siteDescription: string,
  socialLinks: { url: string; title: string; icon: string }[],
  hideSiteFeedLink?: boolean,
  feedPath?: string,
) {
  return /* HTML */ `<link
      id="fa-stylesheet"
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.0.0/css/all.min.css"
    />

    <footer class="site-footer h-card">
      <data class="u-url" value="${escape(baseURL)}"></data>

      <div class="wrapper">
        <div class="footer-col-wrapper">
          <div class="footer-col">
            ${
              siteAuthor
                ? /* HTML */ `<ul class="contact-list">
                    ${
                      siteAuthor.name
                        ? /* HTML */ `<li class="p-name">
                            ${escape(siteAuthor.name)}
                          </li>`
                        : ""
                    }
                    ${
                      siteAuthor.email
                        ? /* HTML */ `<li>
                            <a
                              class="u-email"
                              href="${escape(`mailto:${siteAuthor.email}`)}"
                              >${escape(siteAuthor.email)}</a
                            >
                          </li>`
                        : ""
                    }
                  </ul>`
                : ""
            }
          </div>
          <div class="footer-col">
            <p>${escape(siteDescription)}</p>
          </div>
        </div>

        <div class="social-links">
          ${social(socialLinks, hideSiteFeedLink, feedPath, baseURL)}
        </div>
      </div>
    </footer>`;
}

async function writeHTML({
  path,
  destination,
  lang,
  title,
  description,
  modifiedDate,
  date,
  categories,
  tags,
  url,
  baseURL,
  author,
  lc,
  messages,
  navPages,
  content,
  repository,
  siteDescription,
  siteAuthor,
}: {
  path: string;
  destination: string;
  lang?: string;
  title: string;
  description?: string;
  modifiedDate?: Date | undefined;
  date?: Date | undefined;
  categories?: string[] | undefined;
  tags?: string[] | undefined;
  url: string;
  baseURL: string;
  author: string;
  messages: Messages;
  lc: keyof Messages;
  navPages: { title?: string; url: string }[];
  content: string;
  repository: string;
  siteDescription: string;
  siteAuthor?: { name?: string; email?: string };
}) {
  function toOGLocale(tag: string) {
    const locale = new Intl.Locale(tag).maximize();
    return `${locale.language}_${locale.region}`;
  }

  await mkdir(dirname(join(destination, toHTMLPath(path))), {
    recursive: true,
  });
  await writeFile(
    join(destination, toHTMLPath(path)),
    /* HTML */ `<!DOCTYPE html>
      <html
        ${lang ? `lang="${escape(lang)}"` : ""}
        prefix="og: https://ogp.me/ns# article: https://ogp.me/ns/article#"
      >
        <head>
          <meta charset="utf-8" />
          <title>${escape(title)}</title>
          ${
            description
              ? /*HTML */ `<meta name="description" content="${escape(description)}" />`
              : ""
          }
          <meta name="author" content="${escape(author)}" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="color-scheme" content="light dark" />
          <meta property="og:title" content="${escape(title)}" />
          <meta property="og:type" content="${date ? "article" : "website"}" />
          <meta
            property="og:image"
            content="${escape(new URL("ogp.png", baseURL).toString())}"
          />
          <meta property="og:url" content="${escape(url)}" />
          ${
            description
              ? /*HTML */ `<meta property="og:description" content="${escape(description)}" />`
              : ""
          }
          ${
            lang
              ? /*HTML */ `<meta property="og:locale" content="${escape(toOGLocale(lang))}" />`
              : ""
          }
          <meta
            property="og:site_name"
            content="${escape(messages[lc].title())}"
          />
          ${
            date
              ? /* HTML */ `<meta
                    property="article:published_time"
                    content="${escape(date.toISOString())}"
                  />
                  ${
                    modifiedDate
                      ? /* HTML */ `<meta
                          property="article:modified_time"
                          content="${escape(modifiedDate.toISOString())}"
                        />`
                      : ""
                  }
                  <meta property="article:author" content="${escape(author)}" />
                  ${
                    categories?.[0]
                      ? /* HTML */ `<meta
                          property="article:section"
                          content="${escape(categories[0].split("/")[0])}"
                        />`
                      : ""
                  }
                  ${(tags ?? [])
                    .map(
                      (tag) =>
                        /* HTML */ `<meta
                          property="article:tag"
                          content="${escape(tag)}"
                        />`,
                    )
                    .join("")}`
              : ""
          }
          <link rel="canonical" href="${escape(url)}" />
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
            href="${escape(new URL(toURLPathname(path), baseURL).toString())}"
          />
          <link
            rel="alternate"
            type="text/html"
            href="${escape(
              new URL(
                toURLPathname(path),
                `https://github.com/${repository}/blob/main/`,
              ).toString(),
            )}"
          />
          <link
            rel="alternate"
            type="application/rss+xml"
            href="${escape(new URL("feed.xml", baseURL).toString())}"
          />
          <link
            rel="stylesheet"
            href="${escape(new URL("auto.css", baseURL).toString())}"
          />
          <link
            rel="stylesheet"
            href="${escape(
              new URL("github-markdown-alert.css", baseURL).toString(),
            )}"
          />
          <link
            rel="stylesheet"
            href="${escape(new URL("github-button.css", baseURL).toString())}"
          />
          <link
            rel="stylesheet"
            href="${escape(new URL("codemirror.css", baseURL).toString())}"
          />
          <style>
            .header-link {
              display: inline-block;
              position: relative;
              left: 0.5em;
              opacity: 0;
            }

            :hover > .header-link,
            .header-link:focus {
              opacity: 1;
            }

            .header-link svg {
              display: block;
              width: 0.8em;
              height: 0.8em;
              fill: currentcolor;
            }

            @media (hover: none) {
              .header-link {
                opacity: 1;
              }
            }
          </style>
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

            .markdown-body > *:first-child > *:first-child,
            .markdown-body > *:first-child > *:first-child > *:first-child {
              margin-top: 0 !important;
            }

            .markdown-body .highlight pre,
            .markdown-body .highlight .cm-editor {
              margin-bottom: var(--base-size-16);
            }

            .markdown-body pre code {
              .warn {
                color: var(--fgColor-attention);
              }

              .error {
                color: var(--fgColor-danger);
              }
            }
          </style>
          ${
            date
              ? /* HTML */ `<script type="application/ld+json">
                  ${JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Article",
                    author: {
                      "@type": "Person",
                      name: author,
                    },
                    dateModified: modifiedDate?.toISOString(),
                    datePublished: date.toISOString(),
                    headline: title,
                    image: new URL("ogp.png", baseURL).toString(),
                  } satisfies WithContext<Article>)}
                </script>`
              : ""
          }
          <!--
            Import map generated with JSPM Generator
            Edit here: https://generator.jspm.io/#ZY69EoMgEIQpUuRFUgZFEmtfwge4wRsgw9/gaSZp8uoBO7XYZr+73b1dGLv+xkCWHE5sUHFCb3OOuYGFooo+OSQcet61XO54YR7CNBcmjsxB0PcXrDCrbBPVd/48X6QPmRg2Kk50AV17RXfIngm2QT1vd/5q8V3sh6xZDr+YG2O1cUU0iFIh/2r/G7btAA
          -->
          <script type="importmap">
            {
              "imports": {
                "@codemirror/autocomplete": "https://ga.jspm.io/npm:@codemirror/autocomplete@6.20.3/dist/index.js",
                "@codemirror/commands": "https://ga.jspm.io/npm:@codemirror/commands@6.10.3/dist/index.js",
                "@codemirror/lang-javascript": "https://ga.jspm.io/npm:@codemirror/lang-javascript@6.2.5/dist/index.js",
                "@codemirror/lang-python": "https://ga.jspm.io/npm:@codemirror/lang-python@6.2.1/dist/index.js",
                "@codemirror/language": "https://ga.jspm.io/npm:@codemirror/language@6.12.3/dist/index.js",
                "@codemirror/state": "https://ga.jspm.io/npm:@codemirror/state@6.6.0/dist/index.js",
                "@codemirror/view": "https://ga.jspm.io/npm:@codemirror/view@6.43.1/dist/index.js",
                "@lezer/highlight": "https://ga.jspm.io/npm:@lezer/highlight@1.2.3/dist/index.js"
              },
              "scopes": {
                "https://ga.jspm.io/": {
                  "@lezer/common": "https://ga.jspm.io/npm:@lezer/common@1.5.2/dist/index.js",
                  "@lezer/javascript": "https://ga.jspm.io/npm:@lezer/javascript@1.5.4/dist/index.js",
                  "@lezer/lr": "https://ga.jspm.io/npm:@lezer/lr@1.4.10/dist/index.js",
                  "@lezer/python": "https://ga.jspm.io/npm:@lezer/python@1.1.19/dist/index.js",
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
                "pyodide": "https://cdn.jsdelivr.net/pyodide/v314.0.0/full/pyodide.js"
              }
            }
          </script>
          <script
            type="module"
            src="${escape(new URL("anchor-links.js", baseURL).toString())}"
          ></script>
          <script
            type="module"
            src="${escape(new URL("runnable-code.js", baseURL).toString())}"
          ></script>
          ${
            process.env.NODE_ENV === "production"
              ? /* HTML */ `<!-- Google tag (gtag.js) -->
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
                  </script>`
              : ""
          }
        </head>
        <body>
          ${header(baseURL, escape(messages[lc].title()), navPages)}
          <main class="page-content" aria-label="Content">
            <div class="wrapper">${content}</div>
          </main>
          ${footer(baseURL, siteAuthor, siteDescription, [])}
        </body>
      </html>`,
  );
}

async function writeRedirectHTMLs(
  redirectFrom: string[] | undefined,
  path: string,
  destination: string,
  title: string,
  url: string,
  baseURL: string,
) {
  if (!redirectFrom) return;

  for (const redirectFromPath of redirectFrom) {
    const resolvedPath = isAbsolute(redirectFromPath)
      ? join(destination, redirectFromPath)
      : join(destination, toHTMLPath(path), "..", redirectFromPath);
    await mkdir(dirname(resolvedPath), { recursive: true });
    await writeFile(
      resolvedPath,
      /* HTML */ `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${escape(title)}</title>
            <meta http-equiv="refresh" content="0; URL=${escape(url)}" />
            <link rel="canonical" href="${escape(url)}" />
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
            <a href="${escape(url)}">${escape(url)}</a>
          </body>
        </html> `,
    );
  }
}

async function writeSitemap(
  destination: string,
  sitemapURLs: {
    loc: string;
    lastmod?: Date;
    changefreq?:
      "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
    priority?: number;
  }[],
) {
  await writeFile(
    join(destination, "sitemap.xml"),
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

async function writeRSS(
  destination: string,
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
  }: {
    title: string;
    link: string;
    description: string;
    language?: string;
    copyright?: string;
    managingEditor?: string | { email: string; name: string };
    webMaster?: string | { email: string; name: string };
    pubDate?: Date;
    categories?: string[];
    generator?: string;
  },
  rssItems: {
    title: string;
    link: string;
    description: string;
    categories?: string[];
    pubDate?: Date;
    guid: string;
    content?: string;
  }[],
) {
  rssItems = rssItems
    .toSorted(
      (a, b) => (b.pubDate?.getTime() ?? 0) - (a.pubDate?.getTime() ?? 0),
    )
    .slice(0, 10);

  await writeFile(
    join(destination, "feed.xml"),
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

const repository = "bangseongbeom/bangseongbeom.github.io";
const siteTitle = "Bang Seongbeom";
const siteDescription = "Developer Bang Seongbeom's technical documentation.";
const siteAuthor = {
  name: "방성범 (Bang Seongbeom)",
  email: "bangseongbeom@gmail.com",
};
const baseURL = process.env.BASE_URL ?? "http://localhost:3000/";
const defaultLang = "en";

const source = process.env.SOURCE ?? ".";
const destination = process.env.DESTINATION ?? "_site";

const messages = {
  en: {
    title: () => siteTitle,
    categories: {
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
      dates: {
        published: () => "Published",
        modified: () => "Updated",
      },
    },
    runCode: {
      normal: () => "Run",
      running: () => "Running...",
    },
  },
  ko: {
    title: () => "방성범",
    categories: {
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
      dates: {
        published: () => "게시일",
        modified: () => "수정일",
      },
    },
    runCode: {
      normal: () => "실행",
      running: () => "실행 중...",
    },
  },
};

type Messages = typeof messages;

const sitemapURLs: {
  loc: string;
  lastmod?: Date;
  changefreq?:
    "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}[] = [];

const rssItems: {
  title: string;
  link: string;
  description: string;
  categories?: string[];
  pubDate?: Date;
  guid: string;
  content?: string;
}[] = [];

for await (const path of glob("**", {
  cwd: source,
  exclude: ["**/_*", "**/.*", "**/node_modules"],
})) {
  if (extname(path) === ".md") {
    const url = toHTMLURL(toURLPathname(path), baseURL);

    const markdown = await readFile(join(source, path), "utf8");
    const { frontmatter, html } = await markdownToHTML(markdown);
    const lang = getLang(frontmatter.lang, path, defaultLang);
    const lc = match(
      [lang],
      Object.keys(messages),
      defaultLang,
    ) as keyof Messages;
    const date = frontmatter.date ? new Date(frontmatter.date) : undefined;
    const lastGitLogDate = await getLastGitLogDate(join(source, path));
    const modifiedDate = frontmatter.modified_date
      ? new Date(frontmatter.modified_date)
      : lastGitLogDate;
    const document = htmlToDocument(html);
    insertHeadingIds(document);
    convertAlerts(document);
    resolveLinks(document, url);
    const title =
      frontmatter.title ??
      document.querySelector("h1")?.textContent ??
      fail("title is required");
    const description =
      frontmatter.description ?? document.querySelector("h1 + p")?.textContent;
    const rssDescription = document.body.innerHTML;
    removeFirstHeading(document);
    insertNav(document, path, messages, lc, baseURL, repository);
    insertAlertOcticons(document);
    insertRunnableCodeChildren(document, messages, lc);
    const navPages = [
      {
        title: messages[lc].categories.android(),
        url: new URL("android", baseURL).toString(),
      },
      {
        title: messages[lc].categories.git(),
        url: new URL("git", baseURL).toString(),
      },
      {
        title: messages[lc].categories.iot(),
        url: new URL("iot", baseURL).toString(),
      },
      {
        title: messages[lc].categories.java(),
        url: new URL("java", baseURL).toString(),
      },
      {
        title: messages[lc].categories.linux(),
        url: new URL("linux", baseURL).toString(),
      },
      {
        title: messages[lc].categories.machineLearning(),
        url: new URL("machine-learning", baseURL).toString(),
      },
      {
        title: messages[lc].categories.misc(),
        url: new URL("misc", baseURL).toString(),
      },
      {
        title: messages[lc].categories.python(),
        url: new URL("python", baseURL).toString(),
      },
      {
        title: messages[lc].categories.web(),
        url: new URL("web", baseURL).toString(),
      },
    ];

    await writeHTML({
      path,
      destination,
      lang,
      title,
      description,
      modifiedDate,
      date,
      categories: frontmatter.categories,
      tags: frontmatter.tags,
      url,
      baseURL,
      author: siteAuthor.name,
      messages,
      lc,
      navPages,
      content: date
        ? post(
            title,
            modifiedDate,
            date,
            messages,
            lc,
            lang,
            [],
            document.body.innerHTML,
            frontmatter.comments,
            path,
            url,
          )
        : page(title, document.body.innerHTML),
      repository,
      siteDescription,
      siteAuthor,
    });

    sitemapURLs.push({
      loc: url,
      lastmod: modifiedDate,
    });
    rssItems.push({
      title,
      link: url,
      description: rssDescription,
      categories: [
        ...(frontmatter.categories ?? []),
        ...(frontmatter.tags ?? []),
      ],
      pubDate: date,
      guid: url,
    });

    await writeRedirectHTMLs(
      frontmatter.redirect_from,
      path,
      destination,
      title,
      url,
      baseURL,
    );
  }
  if (
    [".md", ".jpg", ".jpeg", ".png", ".gif", ".ico", ".svg", ".css"].includes(
      extname(path),
    )
  ) {
    await mkdir(dirname(join(destination, path)), { recursive: true });
    await copyFile(join(source, path), join(destination, path));
  }
}

await writeSitemap(
  destination,
  sitemapURLs.toSorted((a, b) => a.loc.localeCompare(b.loc)),
);
await writeFile(
  join(destination, "robots.txt"),
  `Sitemap: ${new URL("sitemap.xml", baseURL)}`,
);
await writeRSS(
  destination,
  {
    title: siteTitle,
    link: baseURL,
    description: siteDescription,
    language: defaultLang,
    managingEditor: siteAuthor,
    webMaster: siteAuthor,
  },
  rssItems,
);

await copyFile(join(source, "auto.css"), join(destination, "auto.css"));
await copyFile(join(source, "auto.css.map"), join(destination, "auto.css.map"));
await copyFile(
  join(source, "anchor-links.js"),
  join(destination, "anchor-links.js"),
);
await copyFile(
  join(source, "runnable-code.js"),
  join(destination, "runnable-code.js"),
);
