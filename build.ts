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
  basename,
  dirname,
  extname,
  format,
  isAbsolute,
  join,
  parse,
  sep,
} from "node:path";
import { promisify } from "node:util";
import * as pagefind from "pagefind";
import { markdownToHtml } from "satteri";
import type { Article, WithContext } from "schema-dts";
import { codeToHtml } from "shiki";

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
  authors?: string[];
}

interface SidebarItem {
  title: string;
  url: string;
  items?: SidebarItem[];
}

interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

interface TOCItem {
  title: string;
  id: string;
  items: TOCItem[];
}

function markdownToHTML(markdown: string) {
  const result = markdownToHtml(markdown);
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
  const scope = new URL("./", base).href;
  if (htmlURL.href.startsWith(scope)) {
    if (htmlURL.pathname.endsWith("/README.md"))
      htmlURL.pathname = htmlURL.pathname.slice(0, -"README.md".length);
    else if (htmlURL.pathname.endsWith(".md"))
      htmlURL.pathname = htmlURL.pathname.slice(0, -".md".length);
  }
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

function getMessages(lang: string, defaultLang: string) {
  return msgData[
    match([lang], Object.keys(msgData), defaultLang) as keyof MessageData
  ];
}

function getDate(fileDate: string | undefined) {
  if (fileDate) return new Date(fileDate);
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

async function getModifiedDate(
  fileModifiedDate: string | undefined,
  path: string,
) {
  if (fileModifiedDate) return new Date(fileModifiedDate);
  return await getLastGitLogDate(path);
}

function htmlToDocument(html: string, url: string) {
  // If url is not set, fragment links like #section start from about:blank.
  const document = new Window({ url }).document;
  document.body.innerHTML = html;
  return document;
}

function getTitle(fileTitle: string | undefined, document: Document) {
  return (
    fileTitle ??
    document.querySelector("h1")?.textContent ??
    fail("title is required")
  );
}

function getDescription(
  fileDescription: string | undefined,
  document: Document,
) {
  return fileDescription ?? document.querySelector("h1 ~ p")?.textContent;
}

function getExcerpt(document: Document) {
  return document.querySelector("h1 ~ p")?.outerHTML;
}

function headingIds(document: Document) {
  const slugger = new GithubSlugger();
  for (const heading of document.querySelectorAll("h1, h2, h3, h4, h5, h6")) {
    if (!heading.id) heading.id = slugger.slug(heading.textContent);
  }
}

function getTOCItems(document: Document) {
  const root: TOCItem[] = [];
  const stack = [{ level: 1, items: root }];
  for (const heading of document.querySelectorAll(
    "h2[id], h3[id], h4[id], h5[id], h6[id]",
  )) {
    const level = Number(heading.tagName.slice(1));
    while (stack.length > 1 && stack.at(-1)!.level >= level) stack.pop();
    const item: TOCItem = {
      title: heading.textContent,
      id: heading.id,
      items: [],
    };
    stack.at(-1)!.items.push(item);
    stack.push({ level, items: item.items });
  }
  return root;
}

function alerts(document: Document) {
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

function links(document: Document, baseURL: string) {
  for (const link of document.links) link.href = toHTMLURL(link.href, baseURL);
}

function noFirstHeading(document: Document) {
  document.querySelector("h1")?.remove();
}

function alertOcticons(document: Document) {
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

function anchorLinks(document: Document) {
  for (const heading of document.querySelectorAll(
    "h2[id], h3[id], h4[id], h5[id], h6[id]",
  )) {
    heading.insertAdjacentHTML(
      "beforeend",
      /* HTML */ `<a
        class="header-link"
        href="#${escape(heading.id)}"
        aria-label="Link"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
          <!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->
          <path
            d="M419.5 96c-16.6 0-32.7 4.5-46.8 12.7-15.8-16-34.2-29.4-54.5-39.5 28.2-24 64.1-37.2 101.3-37.2 86.4 0 156.5 70 156.5 156.5 0 41.5-16.5 81.3-45.8 110.6l-71.1 71.1c-29.3 29.3-69.1 45.8-110.6 45.8-86.4 0-156.5-70-156.5-156.5 0-1.5 0-3 .1-4.5 .5-17.7 15.2-31.6 32.9-31.1s31.6 15.2 31.1 32.9c0 .9 0 1.8 0 2.6 0 51.1 41.4 92.5 92.5 92.5 24.5 0 48-9.7 65.4-27.1l71.1-71.1c17.3-17.3 27.1-40.9 27.1-65.4 0-51.1-41.4-92.5-92.5-92.5zM275.2 173.3c-1.9-.8-3.8-1.9-5.5-3.1-12.6-6.5-27-10.2-42.1-10.2-24.5 0-48 9.7-65.4 27.1L91.1 258.2c-17.3 17.3-27.1 40.9-27.1 65.4 0 51.1 41.4 92.5 92.5 92.5 16.5 0 32.6-4.4 46.7-12.6 15.8 16 34.2 29.4 54.6 39.5-28.2 23.9-64 37.2-101.3 37.2-86.4 0-156.5-70-156.5-156.5 0-41.5 16.5-81.3 45.8-110.6l71.1-71.1c29.3-29.3 69.1-45.8 110.6-45.8 86.6 0 156.5 70.6 156.5 156.9 0 1.3 0 2.6 0 3.9-.4 17.7-15.1 31.6-32.8 31.2s-31.6-15.1-31.2-32.8c0-.8 0-1.5 0-2.3 0-33.7-18-63.3-44.8-79.6z"
          />
        </svg>
      </a>`,
    );
  }
}

async function highlight(document: Document) {
  for (const pre of document.querySelectorAll("pre")) {
    const code = pre.querySelector("code");
    if (!code) continue;
    const language = Array.from(code.classList)
      .find((className) => className.startsWith("language-"))
      ?.slice("language-".length);
    const html = await codeToHtml(code.textContent.replace(/\n$/, ""), {
      lang: language ?? "text",
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: "light-dark()",
      rootStyle: false,
    });
    pre.outerHTML = /* HTML */ `<div
      class="language-${language ?? "plaintext"}"
    >
      <div class="highlight">${html}</div>
    </div>`;
  }
}

function clipboardCopy(document: Document, messages: Messages) {
  for (const highlight of document.querySelectorAll(".highlight")) {
    highlight.insertAdjacentHTML(
      "beforeend",
      /* HTML */ `<button type="button" class="clipboard-copy">
        <span
          class="normal"
          role="img"
          aria-label="${escape(messages.clipboardCopy.normal())}"
        >
          <svg
            class="svg-icon grey"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 448 512"
          >
            <!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->
            <path
              d="M192 0c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-200.6c0-17.4-7.1-34.1-19.7-46.2L370.6 17.8C358.7 6.4 342.8 0 326.3 0L192 0zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-16-64 0 0 16-192 0 0-256 16 0 0-64-16 0z"
            />
          </svg>
        </span>
        <span
          class="copied"
          role="img"
          aria-label="${escape(messages.clipboardCopy.copied())}"
          hidden
        >
          <svg
            class="svg-icon grey"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 448 512"
          >
            <!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->
            <path
              d="M434.8 70.1c14.3 10.4 17.5 30.4 7.1 44.7l-256 352c-5.5 7.6-14 12.3-23.4 13.1s-18.5-2.7-25.1-9.3l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l101.5 101.5 234-321.7c10.4-14.3 30.4-17.5 44.7-7.1z"
            />
          </svg>
        </span>
      </button>`,
    );
  }
}

function runnableCode(document: Document, messages: Messages) {
  for (const runnableCode of document.querySelectorAll(
    "runnable-code",
  ) as NodeList<HTMLElement>) {
    const codeBlock = runnableCode.querySelector('[class^="language-"]');
    if (!codeBlock) throw new Error();
    const language = codeBlock.className.slice("language-".length);

    if (["javascript", "js", "python", "py"].includes(language)) {
      codeBlock.insertAdjacentHTML(
        "afterend",
        /* HTML */ `<p data-pagefind-ignore>
          <button type="button" class="run-code">
            <span class="normal">${escape(messages.runCode.normal())}</span>
            <span class="running" hidden
              >${escape(messages.runCode.running())}</span
            >
          </button>
        </p>`,
      );
    } else if (language === "java") {
      codeBlock.insertAdjacentHTML(
        "afterend",
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

function navItems({ pages }: { pages: { title?: string; url: string }[] }) {
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

function header({
  baseURL,
  siteTitle,
  navPages,
}: {
  baseURL: string;
  siteTitle: string;
  navPages: { title?: string; url: string }[];
}) {
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
                    viewBox="0 0 448 512"
                  >
                    <!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->
                    <path
                      d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"
                    />
                  </svg>
                  <svg
                    class="menu-icon-close"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 384 512"
                  >
                    <!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->
                    <path
                      d="M55.1 73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L147.2 256 9.9 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192.5 301.3 329.9 438.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.8 256 375.1 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192.5 210.7 55.1 73.4z"
                    />
                  </svg>
                </span>
              </label>

              ${navItems({ pages: navPages })}
            </nav>`
      }

      <div class="site-search">
        <pagefind-modal-trigger></pagefind-modal-trigger>
        <pagefind-modal></pagefind-modal>
      </div>
    </div>
  </header>`;
}

function sidebarItems({
  items,
  url,
}: {
  items: SidebarItem[];
  url: string;
}): string {
  return /* HTML */ `<ul>
    ${items
      .map(
        (item) => /* HTML */ `
          <li${item.url === url ? ` class="current"` : ""}>
            <a href="${escape(item.url)}">${escape(item.title)}</a>
            ${item.items?.length ? sidebarItems({ items: item.items, url }) : ""}
          </li>
        `,
      )
      .join("")}
  </ul>`;
}

function sidebar({
  summary,
  sections,
  url,
}: {
  summary: string;
  sections: SidebarSection[];
  url: string;
}) {
  return /* HTML */ `<aside class="site-sidebar">
    <nav class="wrapper">
      <details>
        <summary>${escape(summary)}</summary>
        ${sections
          .map(
            (section) => /* HTML */ `
              ${section.title ? /* HTML */ `<h4>${escape(section.title)}</h4>` : ""}
              ${sidebarItems({ items: section.items, url })}
            `,
          )
          .join("")}
      </details>
    </nav>
  </aside>`;
}

function tocItems({ items }: { items: TOCItem[] }): string {
  return /* HTML */ `<ol>
    ${items
      .map(
        (item) => /* HTML */ `
          <li>
            <a href="#${escape(item.id)}">${escape(item.title)}</a>
            ${item.items.length ? tocItems({ items: item.items }) : ""}
          </li>
        `,
      )
      .join("")}
  </ol>`;
}

function toc({ summary, items }: { summary: string; items: TOCItem[] }) {
  return /* HTML */ `<aside class="site-toc">
    <nav class="wrapper">
      <details>
        <summary>${escape(summary)}</summary>
        ${tocItems({ items })}
      </details>
    </nav>
  </aside>`;
}

function home({
  title,
  content,
  listTitle,
  lang,
  showExcerpts,
  posts,
  paginator,
}: {
  title?: string;
  content: string;
  listTitle?: string;
  lang: string;
  showExcerpts?: boolean;
  posts?: { date: Date; url: string; title: string; excerpt?: string }[];
  paginator?: {
    previousPage?: number;
    previousPagePath?: string;
    page: number;
    nextPage?: number;
    nextPagePath?: string;
  };
}) {
  return /* HTML */ `<div class="home">
    ${title ? /* HTML */ `<h1 class="page-heading">${escape(title)}</h1>` : ""}
    ${content}
    ${
      posts?.length
        ? /* HTML */ `
            ${listTitle ? /* HTML */ `<h2 class="post-list-heading">${escape(listTitle)}</h2>` : ""}
            <ul class="post-list" data-pagefind-ignore>
              ${posts
                .map(
                  (post) =>
                    /* HTML */ `<li>
                      <span class="post-meta"
                        >${escape(post.date.toLocaleDateString(lang))}</span
                      >
                      <h3>
                        <a class="post-link" href="${escape(post.url)}">
                          ${escape(post.title)}
                        </a>
                      </h3>
                      ${showExcerpts ? (post.excerpt ? post.excerpt : "") : ""}
                    </li>`,
                )
                .join("")}
            </ul>

            ${
              paginator
                ? /* HTML */ `<div class="pager">
                    <ul class="pagination">
                      ${
                        paginator.previousPage
                          ? /* HTML */ `<li>
                              <a
                                href="${escape(paginator.previousPagePath)}"
                                class="previous-page"
                                title="Go to Page ${paginator.previousPage}"
                              >
                                ${paginator.previousPage}
                              </a>
                            </li>`
                          : /* HTML */ `<li>
                              <div class="pager-edge">•</div>
                            </li>`
                      }
                      <li>
                        <div class="current-page">${paginator.page}</div>
                      </li>
                      ${
                        paginator.nextPage
                          ? /* HTML */ `<li>
                              <a
                                href="${escape(paginator.nextPagePath)}"
                                class="next-page"
                                title="Go to Page ${paginator.nextPage}"
                              >
                                ${paginator.nextPage}
                              </a>
                            </li>`
                          : /* HTML */ `<li>
                              <div class="pager-edge">•</div>
                            </li>`
                      }
                    </ul>
                  </div>`
                : ""
            }
          `
        : ""
    }
  </div>`;
}

function postLinks({
  path,
  baseURL,
  messages,
  repository,
}: {
  path: string;
  baseURL: string;
  messages: Messages;
  repository: string;
}) {
  return /* HTML */ `<div class="post-links">
    <a
      href="${escape(new URL(toURLPathname(path), baseURL).toString())}"
      title="${escape(messages.header.nav.markdown.title())}"
      >${escape(messages.header.nav.markdown.content())}</a
    >,
    <a
      href="${escape(
        new URL(
          toURLPathname(path),
          `https://github.com/${repository}/blob/main/`,
        ).toString(),
      )}"
      title="${escape(messages.header.nav.github.title())}"
      >${escape(messages.header.nav.github.content())}</a
    >,
    <a
      href="${escape(
        new URL(
          toURLPathname(path),
          `https://github.com/${repository}/edit/main/`,
        ).toString(),
      )}"
      title="${escape(messages.header.nav.edit.title())}"
      >${escape(messages.header.nav.edit.content())}</a
    >,
    <a
      href="${escape(
        new URL(
          toURLPathname(path),
          `https://github.com/${repository}/commits/main/`,
        ).toString(),
      )}"
      title="${escape(messages.header.nav.history.title())}"
      >${escape(messages.header.nav.history.content())}</a
    >
  </div>`;
}

function page({
  title,
  content,
  messages,
  path,
  baseURL,
  repository,
}: {
  title: string;
  content: string;
  messages: Messages;
  path: string;
  baseURL: string;
  repository: string;
}) {
  return /* HTML */ `<article class="post">
    <header class="post-header">
      <h1 class="post-title">${escape(title)}</h1>
      <div class="post-meta" data-pagefind-ignore>
        ${postLinks({ path, baseURL, messages, repository })}
      </div>
    </header>

    <div class="post-content">${content}</div>
  </article>`;
}

function commentsSection({ path, lang }: { path: string; lang: string }) {
  return path === "README.md"
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

function post({
  title,
  modifiedDate,
  date,
  messages,
  lang,
  authors,
  content,
  comments,
  path,
  url,
  baseURL,
  repository,
}: {
  title: string;
  modifiedDate?: Date;
  date: Date;
  messages: Messages;
  lang: string;
  authors?: string[];
  content: string;
  comments?: boolean;
  path: string;
  url: string;
  baseURL: string;
  repository: string;
}) {
  return /* HTML */ `<article
    class="post h-entry"
    itemscope
    itemtype="http://schema.org/BlogPosting"
  >
    <header class="post-header">
      <h1 class="post-title p-name" itemprop="name headline">
        ${escape(title)}
      </h1>
      <div class="post-meta" data-pagefind-ignore>
        ${
          modifiedDate
            ? /* HTML */ `<span class="meta-label"
                >${escape(messages.header.dates.published())}:</span
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
                  >${escape(messages.header.dates.modified())}:</span
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
          authors && authors.length >= 1
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
                        ></span
                      >`,
                  )
                  .join(", ")}
              </div>`
            : ""
        }
        ${postLinks({ path, baseURL, messages, repository })}
      </div>
    </header>

    <div class="post-content e-content" itemprop="articleBody">${content}</div>

    ${
      process.env.NODE_ENV === "production"
        ? comments === false
          ? /* HTML */ `<div
              class="comments-disabled-message"
              data-pagefind-ignore
            >
              Comments have been disabled for this post.
            </div>`
          : commentsSection({ path, lang })
        : ""
    }

    <a class="u-url" href="${escape(url)}" hidden></a>
  </article>`;
}

function social({
  socialLinks,
  hideSiteFeedLink,
  feedPath = "feed.xml",
  baseURL,
}: {
  socialLinks: { url: string; title: string; icon: string }[];
  hideSiteFeedLink?: boolean;
  feedPath?: string;
  baseURL: string;
}) {
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
              ${entry.icon}
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

function footer({
  baseURL,
  siteAuthor,
  siteDescription,
  socialLinks,
  hideSiteFeedLink,
  feedPath,
}: {
  baseURL: string;
  siteAuthor?: { name?: string; email?: string };
  siteDescription: string;
  socialLinks: { url: string; title: string; icon: string }[];
  hideSiteFeedLink?: boolean;
  feedPath?: string;
}) {
  return /* HTML */ `<footer class="site-footer h-card">
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
        ${social({ socialLinks, hideSiteFeedLink, feedPath, baseURL })}
      </div>
    </div>
  </footer>`;
}

function directoryItems(
  pages: { path: string; title: string; url: string }[],
  dir: string,
) {
  const entryDir = (path: string) =>
    dirname(basename(path) === "README.md" ? dirname(path) : path);
  return pages
    .filter(
      ({ path }) =>
        extname(path) === ".md" &&
        path !== "README.md" &&
        entryDir(path) === dir,
    )
    .toSorted((a, b) => a.path.localeCompare(b.path));
}

function base({
  path,
  lang,
  title,
  description,
  modifiedDate,
  date,
  categories,
  tags,
  url,
  baseURL,
  navPages,
  sidebarSummary,
  sidebarSections,
  tocSummary,
  tocItems,
  content,
  repository,
  siteDescription,
  siteAuthor,
}: {
  path: string;
  lang?: string;
  title: string;
  description?: string;
  modifiedDate?: Date;
  date?: Date;
  categories?: string[];
  tags?: string[];
  url: string;
  baseURL: string;
  navPages: { title?: string; url: string }[];
  sidebarSummary: string;
  sidebarSections?: SidebarSection[];
  tocSummary: string;
  tocItems?: TOCItem[];
  content: string;
  repository: string;
  siteDescription: string;
  siteAuthor?: { name?: string; email?: string };
}) {
  function toOGLocale(tag: string) {
    const locale = new Intl.Locale(tag).maximize();
    return `${locale.language}_${locale.region}`;
  }

  return /* HTML */ `<!DOCTYPE html>
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
        ${
          siteAuthor?.name
            ? /* HTML */ `<meta
                name="author"
                content="${escape(siteAuthor.name)}"
              />`
            : ""
        }
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
        <meta property="og:site_name" content="${escape(siteTitle)}" />
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
                ${
                  siteAuthor?.name
                    ? /* HTML */ `<meta
                        property="article:author"
                        content="${escape(siteAuthor.name)}"
                      />`
                    : ""
                }
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
          href="${escape(new URL("apple-touch-icon.png", baseURL).toString())}"
        />
        ${
          extname(path) === ".md"
            ? /* HTML */ `<link
                rel="alternate"
                type="text/markdown"
                href="${escape(
                  new URL(toURLPathname(path), baseURL).toString(),
                )}"
              />`
            : ""
        }
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
          href="${escape(new URL("markdown-alert.css", baseURL).toString())}"
        />
        <link
          rel="stylesheet"
          href="${escape(new URL("runnable-code.css", baseURL).toString())}"
        />
        <link
          rel="stylesheet"
          href="${escape(new URL("layout.css", baseURL).toString())}"
        />
        <link
          rel="stylesheet"
          href="${escape(
            new URL("pagefind/pagefind-component-ui.css", baseURL).toString(),
          )}"
        />
        <link
          rel="stylesheet"
          href="${escape(new URL("search.css", baseURL).toString())}"
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

          .highlight {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: start;
            background-color: var(--minima-code-background-color);
          }

          button.clipboard-copy {
            padding: 10px 12px;
            background-color: transparent;
            border: none;
            opacity: 0;
          }

          .highlight:hover > button.clipboard-copy,
          button.clipboard-copy:focus {
            opacity: 1;
          }

          @media (hover: none) {
            button.clipboard-copy {
              opacity: 1;
            }
          }
        </style>
        ${
          date
            ? /* HTML */ `<script type="application/ld+json">
                ${JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Article",
                  author: siteAuthor
                    ? {
                        "@type": "Person",
                        name: siteAuthor.name,
                      }
                    : undefined,
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
          src="${escape(new URL("clipboard-copy.js", baseURL).toString())}"
        ></script>
        <script
          type="module"
          src="${escape(new URL("runnable-code.js", baseURL).toString())}"
        ></script>
        <script
          type="module"
          src="${escape(new URL("toc.js", baseURL).toString())}"
        ></script>
        <script
          type="module"
          src="${escape(
            new URL("pagefind/pagefind-component-ui.js", baseURL).toString(),
          )}"
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
        ${header({ baseURL, siteTitle, navPages })}
        ${
          sidebarSections?.length
            ? sidebar({
                summary: sidebarSummary,
                sections: sidebarSections,
                url,
              })
            : ""
        }
        ${tocItems?.length ? toc({ summary: tocSummary, items: tocItems }) : ""}
        <main class="page-content" aria-label="Content" data-pagefind-body>
          <div class="wrapper">${content}</div>
        </main>
        ${footer({
          baseURL,
          siteAuthor,
          siteDescription,
          socialLinks: [
            {
              url: `https://github.com/${repository}`,
              title: "GitHub",
              icon: /* HTML */ `<svg
                class="svg-icon grey"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
              >
                <!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->
                <path
                  d="M216.5 362.5c-66-8-112.5-55.5-112.5-117 0-25 9-52 24-70-6.5-16.5-5.5-51.5 2-66 20-2.5 47 8 63 22.5 19-6 39-9 63.5-9s44.5 3 62.5 8.5c15.5-14 43-24.5 63-22 7 13.5 8 48.5 1.5 65.5 16 19 24.5 44.5 24.5 70.5 0 61.5-46.5 108-113.5 116.5 17 11 28.5 35 28.5 62.5l0 52C323 491.5 335.5 500 350.5 494 441 459.5 512 369 512 257 512 115.5 397 0 255.5 0S0 115.5 0 257c0 111 70.5 203 165.5 237.5 13.5 5 26.5-4 26.5-17.5l0-40c-7 3-16 5-24 5-33 0-52.5-18-66.5-51.5-5.5-13.5-11.5-21.5-23-23-6-.5-8-3-8-6 0-6 10-10.5 20-10.5 14.5 0 27 9 40 27.5 10 14.5 20.5 21 33 21s20.5-4.5 32-16c8.5-8.5 15-16 21-21z"
                />
              </svg>`,
            },
          ],
        })}
      </body>
    </html>`;
}

function redirectPage({
  title,
  url,
  baseURL,
}: {
  title: string;
  url: string;
  baseURL: string;
}) {
  return /* HTML */ `<!DOCTYPE html>
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
          href="${escape(new URL("apple-touch-icon.png", baseURL).toString())}"
        />
      </head>
      <body>
        <a href="${escape(url)}">${escape(url)}</a>
      </body>
    </html> `;
}

async function writeRedirectPages({
  redirectFrom,
  path,
  destination,
  title,
  url,
  baseURL,
}: {
  redirectFrom?: string[];
  path: string;
  destination: string;
  title: string;
  url: string;
  baseURL: string;
}) {
  if (!redirectFrom) return;

  for (const redirectFromPath of redirectFrom) {
    const resolvedPath = isAbsolute(redirectFromPath)
      ? join(destination, redirectFromPath)
      : join(destination, toHTMLPath(path), "..", redirectFromPath);
    await mkdir(dirname(resolvedPath), { recursive: true });
    await writeFile(resolvedPath, redirectPage({ title, url, baseURL }));
  }
}

function sitemap(
  sitemapURLs: {
    loc: string;
    lastmod?: Date;
    changefreq?:
      "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
    priority?: number;
  }[],
) {
  return /* XML */ `<?xml version="1.0" encoding="UTF-8"?>
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
`;
}

function rss(
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

  return /* XML */ `<?xml version="1.0" encoding="UTF-8"?>
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
`;
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

const msgData = {
  en: {
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
      },
      dates: {
        published: () => "Published",
        modified: () => "Updated",
      },
    },
    home: {
      listTitle: () => "Posts",
    },
    sidebar: {
      summary: () => "Menu",
      posts: () => "Posts",
    },
    toc: {
      summary: () => "Contents",
    },
    clipboardCopy: {
      normal: () => "Copy",
      copied: () => "Copied!",
    },
    runCode: {
      normal: () => "Run",
      running: () => "Running...",
    },
  },
  ko: {
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
      },
      dates: {
        published: () => "게시일",
        modified: () => "수정일",
      },
    },
    home: {
      listTitle: () => "글 목록",
    },
    sidebar: {
      summary: () => "메뉴",
      posts: () => "게시물",
    },
    toc: {
      summary: () => "목차",
    },
    clipboardCopy: {
      normal: () => "복사",
      copied: () => "복사 완료!",
    },
    runCode: {
      normal: () => "실행",
      running: () => "실행 중...",
    },
  },
};

type MessageData = typeof msgData;
type Messages = MessageData[keyof MessageData];

const pages: {
  path: string;
  url: string;
  lang: string;
  messages: Messages;
  date?: Date;
  modifiedDate?: Date;
  frontmatter: FrontMatter;
  title: string;
  description?: string;
  content: string;
  excerpt?: string;
  rssContent: string;
  tocItems: TOCItem[];
}[] = [];

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
    const { frontmatter, html } = markdownToHTML(markdown);
    const lang = getLang(frontmatter.lang, path, defaultLang);
    const messages = getMessages(lang, defaultLang);
    const date = getDate(frontmatter.date);
    const modifiedDate = await getModifiedDate(
      frontmatter.modified_date,
      join(source, path),
    );
    const document = htmlToDocument(html, url);
    headingIds(document);
    alerts(document);
    links(document, baseURL);
    const title = getTitle(frontmatter.title, document);
    const description = getDescription(frontmatter.description, document);
    const excerpt = getExcerpt(document);
    const tocItems = getTOCItems(document);
    const { html: rssHTML } = markdownToHTML(markdown);
    const rssDocument = htmlToDocument(rssHTML, url);
    headingIds(rssDocument);
    alerts(rssDocument);
    links(rssDocument, baseURL);
    noFirstHeading(document);
    alertOcticons(document);
    anchorLinks(document);
    await highlight(document);
    clipboardCopy(document, messages);
    runnableCode(document, messages);

    pages.push({
      path,
      url,
      lang,
      messages,
      date,
      modifiedDate,
      frontmatter,
      title,
      description,
      content: document.body.innerHTML,
      excerpt,
      rssContent: rssDocument.body.innerHTML,
      tocItems,
    });
  } else if (extname(path) === ".html") {
    const url = new URL(toURLPathname(path), baseURL).toString();
    const html = await readFile(join(source, path), "utf8");
    const lang = getLang(undefined, path, defaultLang);
    const messages = getMessages(lang, defaultLang);
    const document = htmlToDocument(html, url);
    const title = getTitle(undefined, document);

    pages.push({
      path,
      url,
      lang,
      messages,
      frontmatter: {},
      title,
      content: html,
      rssContent: html,
      tocItems: [],
    });
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

const posts = pages
  .flatMap(({ date, url, title, excerpt }) =>
    date ? [{ date, url, title, excerpt }] : [],
  )
  .toSorted((a, b) => b.date.getTime() - a.date.getTime());

const { index, errors } = await pagefind.createIndex({
  forceLanguage: defaultLang,
});
if (!index) fail(errors.join("\n"));

for (const {
  path,
  url,
  lang,
  messages,
  date,
  modifiedDate,
  frontmatter,
  title,
  description,
  content,
  rssContent,
  tocItems,
} of pages) {
  const html = base({
    path,
    lang,
    title,
    description,
    modifiedDate,
    date,
    categories: frontmatter.categories,
    tags: frontmatter.tags,
    url,
    baseURL,
    navPages: [],
    sidebarSummary: messages.sidebar.summary(),
    sidebarSections: (date || path === "README.md"
      ? [{ title: messages.sidebar.posts(), items: posts }]
      : [{ items: directoryItems(pages, dirname(path)) }]
    ).filter(({ items }) => items.length),
    tocSummary: messages.toc.summary(),
    tocItems,
    content:
      extname(path) === ".html"
        ? content
        : path === "README.md"
          ? home({
              title,
              content,
              listTitle: messages.home.listTitle(),
              lang,
              showExcerpts: true,
              posts,
            })
          : date
            ? post({
                title,
                modifiedDate,
                date,
                messages,
                lang,
                authors: [siteAuthor.name, ...(frontmatter.authors ?? [])],
                content,
                comments: frontmatter.comments,
                path,
                url,
                baseURL,
                repository,
              })
            : page({
                title,
                content,
                messages,
                path,
                baseURL,
                repository,
              }),
    repository,
    siteDescription,
    siteAuthor,
  });
  await mkdir(dirname(join(destination, toHTMLPath(path))), {
    recursive: true,
  });
  await writeFile(join(destination, toHTMLPath(path)), html);

  const { errors } = await index.addHTMLFile({
    url: new URL(url).pathname,
    content: html,
  });
  if (errors.length) fail(errors.join("\n"));

  sitemapURLs.push({
    loc: url,
    lastmod: modifiedDate,
  });
  rssItems.push({
    title,
    link: url,
    description: rssContent,
    categories: [
      ...(frontmatter.categories ?? []),
      ...(frontmatter.tags ?? []),
    ],
    pubDate: date,
    guid: url,
  });

  await writeRedirectPages({
    redirectFrom: frontmatter.redirect_from,
    path,
    destination,
    title,
    url,
    baseURL,
  });
}

await writeFile(
  join(destination, "sitemap.xml"),
  sitemap(sitemapURLs.toSorted((a, b) => a.loc.localeCompare(b.loc))),
);
await writeFile(
  join(destination, "robots.txt"),
  `Sitemap: ${new URL("sitemap.xml", baseURL)}`,
);
await writeFile(
  join(destination, "feed.xml"),
  rss(
    {
      title: siteTitle,
      link: baseURL,
      description: siteDescription,
      language: defaultLang,
      managingEditor: siteAuthor,
      webMaster: siteAuthor,
    },
    rssItems,
  ),
);

await copyFile(join(source, "auto.css"), join(destination, "auto.css"));
await copyFile(join(source, "auto.css.map"), join(destination, "auto.css.map"));
await copyFile(
  join(source, "clipboard-copy.js"),
  join(destination, "clipboard-copy.js"),
);
await copyFile(
  join(source, "runnable-code.js"),
  join(destination, "runnable-code.js"),
);
await copyFile(join(source, "toc.js"), join(destination, "toc.js"));

const { errors: writeFilesErrors } = await index.writeFiles({
  outputPath: join(destination, "pagefind"),
});
if (writeFilesErrors.length) fail(writeFilesErrors.join("\n"));
await pagefind.close();
