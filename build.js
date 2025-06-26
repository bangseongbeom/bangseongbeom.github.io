import { globby } from "globby";
import { fromHtml } from "hast-util-from-html";
import { select } from "hast-util-select";
import { toHtml } from "hast-util-to-html";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
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
import { rehype } from "rehype";
import rehypeDocument from "rehype-document";
import rehypeFormat from "rehype-format";
import rehypeGithubAlert from "rehype-github-alert";
import rehypeGithubDir from "rehype-github-dir";
import rehypeGithubEmoji from "rehype-github-emoji";
import rehypeGithubHeading from "rehype-github-heading";
import rehypeGithubImage from "rehype-github-image";
import rehypeInferDescriptionMeta from "rehype-infer-description-meta";
import rehypeInferTitleMeta from "rehype-infer-title-meta";
import rehypeMeta from "rehype-meta";
import rehypeRaw from "rehype-raw";
import rehypeStarryNight from "rehype-starry-night";
import rehypeStringify from "rehype-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { read } from "to-vfile";
import { unified } from "unified";
import unifiedInferGitMeta from "unified-infer-git-meta";
import { visit } from "unist-util-visit";
import { VFile } from "vfile";
import { matter } from "vfile-matter";
import { rss } from "xast-util-feed";
import { sitemap } from "xast-util-sitemap";
import { toXml } from "xast-util-to-xml";

const TITLE = "방성범 블로그";
export const DESCRIPTION = "개발자 방성범의 기술 블로그";
const AUTHOR = "방성범 (Bang Seongbeom)";
// const EMAIL = "bangseongbeom@gmail.com";
const BASE = "https://www.bangseongbeom.com/";

const SRC_ROOT = process.env.SRC_ROOT ?? ".";
const DEST_ROOT = process.env.DEST_ROOT ?? "_site";

/**
 * @param {{ suffix?: string }} param0
 */
function rehypeRelativeLinks({ suffix } = {}) {
  /**
   * @param {import("hast").Root} tree
   */
  return (tree) =>
    visit(tree, "element", (node) => {
      if ("href" in node.properties) {
        /** @type {string} */
        let href = node.properties.href;
        if (href.endsWith("/README.md")) {
          node.properties.href =
            href.slice(0, -"README.md".length) + (suffix ?? "");
        } else if (href.endsWith(".md")) {
          node.properties.href = href.slice(0, -".md".length) + (suffix ?? "");
        }
      }
    });
}

function rehypeInferContentMeta() {
  /**
   * @param {import("hast").Root} tree
   * @param {VFile} file
   */
  return (tree, file) =>
    visit(tree, "element", (node) => {
      if (node.tagName == "time" && node.properties.id == "published") {
        let dateTime = node.properties.dateTime;
        if (!file.data.meta) file.data.meta = {};
        file.data.meta.published = new Date(dateTime);
      } else if (node.tagName == "time" && node.properties.id == "modified") {
        let dateTime = node.properties.dateTime;
        if (!file.data.meta) file.data.meta = {};
        file.data.meta.modified = new Date(dateTime);
      }
    });
}

/** @type {import("unified").Preset} */
let rehypePresetDocument = {
  plugins: [
    [
      rehypeDocument,
      {
        link: [
          {
            rel: "icon",
            href: new URL("favicon.ico", BASE).toString(),
            sizes: "32x32",
          },
          {
            rel: "icon",
            href: new URL("icon.svg", BASE).toString(),
            type: "image/svg+xml",
          },
          {
            rel: "apple-touch-icon",
            href: new URL("apple-touch-icon.png", BASE).toString(),
          },
          {
            rel: "alternate",
            type: "application/rss+xml",
            href: new URL("feed.xml", BASE).toString(),
          },
        ],
        meta: [{ content: "rehype-document", name: "generator" }],
        css: ["/primer.css", "/both.css"],
        style: /* CSS */ `.markdown-body {
        max-width: 1012px;
        margin-right: auto;
        margin-left: auto;
        padding: 32px !important;
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
        border-left: 0.25em solid var(--color-border-default);
      }

      .markdown-body .markdown-alert .markdown-alert-title {
          font-weight: var(--base-text-weight-medium, 500);
      }
      
      .markdown-body .markdown-alert.markdown-alert-note {
        border-left-color: var(--color-accent-fg);
      }
      
      .markdown-body .markdown-alert.markdown-alert-note .markdown-alert-title {
        color: var(--color-accent-fg);
      }
      
      .markdown-body .markdown-alert.markdown-alert-tip {
        border-left-color: var(--color-success-fg);
      }
      
      .markdown-body .markdown-alert.markdown-alert-tip .markdown-alert-title {
        color: var(--color-success-fg);
      }
      
      .markdown-body .markdown-alert.markdown-alert-important {
        border-left-color: var(--color-done-fg);
      }
      
      .markdown-body .markdown-alert.markdown-alert-important .markdown-alert-title {
        color: var(--color-done-fg);
      }
      
      .markdown-body .markdown-alert.markdown-alert-warning {
        border-left-color: var(--color-attention-fg);
      }
      
      .markdown-body .markdown-alert.markdown-alert-warning .markdown-alert-title {
        color: var(--color-attention-fg);
      }
      
      .markdown-body .markdown-alert.markdown-alert-caution {
        border-left-color: var(--color-danger-fg);
      }
      
      .markdown-body .markdown-alert.markdown-alert-caution .markdown-alert-title {
        color: var(--color-danger-fg);
      }`,
      },
    ],
  ],
};

/** @type {import("unified").Preset} */
let rehypePresetMeta = {
  plugins: [
    [
      rehypeMeta,
      {
        og: true,
        type: "article",
        image: new URL("ogp.png", BASE).toString(),
      },
    ],
  ],
};

function rehypeJsonLdMeta() {
  /**
   * @param {import("hast").Root} tree
   * @param {VFile} file
   */
  return (tree, file) =>
    visit(tree, "element", (node) => {
      if (node.tagName == "head") {
        node.children.push({
          type: "element",
          tagName: "script",
          properties: {
            type: "application/ld+json",
          },
          children: [
            {
              type: "text",
              value: JSON.stringify(
                /** @type {import("schema-dts").BlogPosting} */ ({
                  "@context": "https://schema.org/",
                  "@type": "BlogPosting",
                  author: {
                    "@type": "Person",
                    name: file.data.meta?.author,
                  },
                  dateModified: file.data.meta?.modified,
                  datePublished: file.data.meta?.published,
                  headline: file.data.meta?.title,
                  image: new URL("ogp.png", BASE).toString(),
                })
              ),
            },
          ],
        });
      }
    });
}

let markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(() => (_, file) => matter(file))
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeGithubAlert)
  .use(rehypeGithubDir)
  .use(rehypeGithubEmoji)
  .use(rehypeGithubHeading)
  .use(rehypeStarryNight)
  .use(rehypeGithubImage)
  .use(rehypeRelativeLinks)
  .use(rehypeInferTitleMeta)
  .use(rehypeInferDescriptionMeta)
  .use(unifiedInferGitMeta)
  .use(rehypeInferContentMeta)
  .use(rehypePresetDocument)
  .use(() => {
    /**
     * @param {import("hast").Root} tree
     */
    return (tree) => {
      visit(tree, "element", (node) => {
        if (node.tagName == "body") {
          node.properties.className = ["markdown-body"];
          node.properties.dataColorMode = "auto";
          node.properties.dataLightTheme = "light";
          node.properties.dataDarkTheme = "dark";
        }
      });
    };
  })
  .use(rehypePresetMeta)
  .use(rehypeJsonLdMeta)
  .use(rehypeFormat)
  .use(rehypeStringify);

function rehypeRedirectDocument() {
  /**
   * @param {import("hast").Root} tree
   * @param {VFile} file
   */
  return (tree, file) =>
    visit(tree, "element", (node) => {
      if (node.tagName == "head") {
        node.children.push({
          type: "element",
          tagName: "meta",
          properties: {
            name: "robots",
            content: "noindex",
          },
          children: [],
        });
        node.children.push({
          type: "element",
          tagName: "meta",
          properties: {
            httpEquiv: "refresh",
            content: `0; URL=${file.data.meta.origin}${file.data.meta.pathname}`,
          },
          children: [],
        });
      } else if (node.tagName == "body") {
        node.children.push({
          type: "element",
          tagName: "a",
          properties: {
            href: `${file.data.meta.origin}${file.data.meta.pathname}`,
          },
          children: [
            {
              type: "text",
              value: `${file.data.meta.origin}${file.data.meta.pathname}`,
            },
          ],
        });
      }
    });
}

let redirectProcessor = rehype()
  .data("settings", { fragment: true })
  .use(rehypePresetDocument)
  .use(rehypeRedirectDocument)
  .use(rehypePresetMeta)
  .use(rehypeFormat);

/** @type {VFile[]} */
let latestFiles = [];

/** @type {import("vfile").Data[]} */
let dataList = [];

await Promise.all(
  (await globby(join(SRC_ROOT, "**"), { gitignore: true })).map(async (src) => {
    if (extname(src) == ".md") {
      let dest = join(
        DEST_ROOT,
        dirname(relative(SRC_ROOT, src)),
        basename(src) == "README.md"
          ? "index.html"
          : `${parse(basename(src)).name}.html`
      );

      let file = await read(src);
      file.data.meta = {
        origin: BASE.slice(0, -1),
        pathname: pathToFileURL(
          join(
            sep,
            dirname(relative(SRC_ROOT, src)),
            basename(src) == "README.md" ? sep : parse(basename(src)).name
          )
        ).pathname,
      };
      file = await markdownProcessor.process(file);
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, String(file));

      latestFiles.push(file);
      latestFiles = latestFiles
        .toSorted(
          /**
           * @param {VFile} a
           * @param {VFile} b
           */ (a, b) => {
            let aPublished = a.data.meta?.published;
            let bPublished = b.data.meta?.published;
            return (
              (bPublished
                ? typeof bPublished == "string"
                  ? Date.parse(bPublished)
                  : bPublished.getTime()
                : 0) -
              (aPublished
                ? typeof aPublished == "string"
                  ? Date.parse(aPublished)
                  : aPublished.getTime()
                : 0)
            );
          }
        )
        .slice(0, 10);
      dataList.push(file.data);

      if (file.data.matter?.redirectFrom) {
        for (let redirectFromPath of file.data.matter.redirectFrom) {
          let redirectPath = isAbsolute(redirectFromPath)
            ? join(DEST_ROOT, redirectFromPath)
            : join(dest, "..", redirectFromPath);
          let redirectFile = new VFile({ data: file.data });
          redirectFile = await redirectProcessor.process(redirectFile);
          await mkdir(dirname(redirectPath), { recursive: true });
          await writeFile(redirectPath, String(redirectFile));
        }
      }
    } else if (
      [".jpg", ".jpeg", ".png", ".gif", ".ico", ".svg", ".css"].includes(
        extname(src)
      )
    ) {
      let dest = join(DEST_ROOT, relative(SRC_ROOT, src));
      await mkdir(dirname(dest), { recursive: true });
      await copyFile(src, dest);
    }
  })
);

let sitemapFile = join(DEST_ROOT, "sitemap.xml");
let sitemapData = sitemap(
  dataList.map((data) => {
    return {
      url: data.meta.origin + data.meta.pathname,
      modified: data.meta.modified,
    };
  })
);
await writeFile(sitemapFile, toXml(sitemapData));

let robotsFile = join(DEST_ROOT, "robots.txt");
let robotsData = `Sitemap: ${new URL("sitemap.xml", BASE)}`;
await writeFile(robotsFile, robotsData);

let rssFile = join(DEST_ROOT, "feed.xml");
let rssData = rss(
  {
    title: TITLE,
    url: BASE,
    feedUrl: new URL("feed.xml", BASE).toString(),
    description: DESCRIPTION,
    lang: "en",
    author: AUTHOR,
  },
  latestFiles.map((file) => {
    let data = file.data;
    let body = select("body", fromHtml(String(file)));
    return {
      title: data.meta.title,
      descriptionHtml: toHtml(body.children),
      url: data.meta.origin + data.meta.pathname,
      published: data.meta.published,
      modified: data.meta.modified,
      tags: data.meta.tags,
    };
  })
);
await writeFile(rssFile, toXml(rssData));

await copyFile(
  fileURLToPath(import.meta.resolve("@primer/css/dist/primer.css")),
  join(DEST_ROOT, "primer.css")
);

await copyFile(
  fileURLToPath(import.meta.resolve("@wooorm/starry-night/style/both")),
  join(DEST_ROOT, "both.css")
);
