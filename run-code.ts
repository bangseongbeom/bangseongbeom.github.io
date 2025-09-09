import type { EditorView } from "@codemirror/view";

export class RunCodeElement extends HTMLElement {
  view: EditorView | undefined;

  async connectedCallback() {
    let highlight = this.querySelector(".highlight")!;
    let code = highlight.querySelector("code")!;

    if (
      !code.classList.contains("language-js") &&
      !code.classList.contains("language-py")
    ) {
      console.warn("only JavaScript and Python are supported");
      return;
    }

    const [
      { javascript },
      { python },
      { EditorState },
      { EditorView, keymap },
      { defaultKeymap, indentWithTab },
      { closeBrackets, closeBracketsKeymap },
      {
        HighlightStyle,
        syntaxHighlighting,
        indentUnit,
        indentOnInput,
        bracketMatching,
      },
      { tags },
    ] = await Promise.all([
      import("@codemirror/lang-javascript"),
      import("@codemirror/lang-python"),
      import("@codemirror/state"),
      import("@codemirror/view"),
      import("@codemirror/commands"),
      import("@codemirror/autocomplete"),
      import("@codemirror/language"),
      import("@lezer/highlight"),
    ]);

    let theme = EditorView.theme({
      "&": {
        color: "var(--fgColor-default)",
        backgroundColor: "var(--bgColor-default)",
      },
      ".cm-content": {
        caretColor: "var(--fgColor-default)",
      },
      ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "var(--fgColor-accent)",
      },
      ".cm-panels": {
        backgroundColor: "var(--bgColor-muted)",
        color: "var(--fgColor-default)",
      },
      ".cm-panels.cm-panels-top": {
        borderBottom: "2px solid var(--borderColor-default)",
      },
      ".cm-panels.cm-panels-bottom": {
        borderTop: "2px solid var(--borderColor-default)",
      },
      ".cm-searchMatch": {
        backgroundColor: "var(--bgColor-attention-muted)",
        outline: "1px solid var(--borderColor-accent-emphasis)",
      },
      ".cm-searchMatch.cm-searchMatch-selected": {
        backgroundColor: "var(--bgColor-accent-muted)",
      },
      ".cm-activeLine": { backgroundColor: "var(--bgColor-neutral-muted)" },
      ".cm-selectionMatch": {
        backgroundColor: "var(--bgColor-success-muted)",
      },
      "&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket": {
        backgroundColor: "var(--bgColor-neutral-muted)",
      },
      ".cm-gutters": {
        backgroundColor: "var(--bgColor-default)",
        color: "var(--fgColor-muted)",
        border: "none",
      },
      ".cm-activeLineGutter": {
        backgroundColor: "var(--bgColor-neutral-muted)",
      },
      ".cm-foldPlaceholder": {
        backgroundColor: "transparent",
        border: "none",
        color: "var(--fgColor-muted)",
      },
      ".cm-tooltip": {
        border: "none",
        backgroundColor: "var(--bgColor-muted)",
      },
      ".cm-tooltip .cm-tooltip-arrow:before": {
        borderTopColor: "transparent",
        borderBottomColor: "transparent",
      },
      ".cm-tooltip .cm-tooltip-arrow:after": {
        borderTopColor: "var(--bgColor-muted)",
        borderBottomColor: "var(--bgColor-muted)",
      },
      ".cm-tooltip-autocomplete": {
        "& > ul > li[aria-selected]": {
          backgroundColor: "var(--bgColor-neutral-muted)",
          color: "var(--fgColor-default)",
        },
      },
    });

    let highlightStyle = HighlightStyle.define([
      {
        tag: tags.keyword,
        color: "var(--color-prettylights-syntax-keyword)",
      },
      {
        tag: [
          tags.name,
          tags.deleted,
          tags.character,
          tags.propertyName,
          tags.macroName,
        ],
        color: "var(--color-prettylights-syntax-entity)",
      },
      {
        tag: [tags.function(tags.variableName), tags.labelName],
        color: "var(--color-prettylights-syntax-entity)",
      },
      {
        tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)],
        color: "var(--color-prettylights-syntax-constant)",
      },
      {
        tag: [tags.definition(tags.name), tags.separator],
        color: "var(--color-prettylights-syntax-storage-modifier-import)",
      },
      {
        tag: [
          tags.typeName,
          tags.className,
          tags.number,
          tags.changed,
          tags.annotation,
          tags.modifier,
          tags.self,
          tags.namespace,
        ],
        color: "var(--color-prettylights-syntax-constant)",
      },
      {
        tag: [
          tags.operator,
          tags.operatorKeyword,
          tags.url,
          tags.escape,
          tags.regexp,
          tags.link,
          tags.special(tags.string),
        ],
        color: "var(--color-prettylights-syntax-string-regexp)",
      },
      {
        tag: [tags.meta, tags.comment],
        color: "var(--color-prettylights-syntax-comment)",
      },
      { tag: tags.strong, fontWeight: "bold" },
      { tag: tags.emphasis, fontStyle: "italic" },
      { tag: tags.strikethrough, textDecoration: "line-through" },
      {
        tag: tags.link,
        color: "var(--color-prettylights-syntax-constant-other-reference-link)",
        textDecoration: "underline",
      },
      {
        tag: tags.heading,
        fontWeight: "bold",
        color: "var(--color-prettylights-syntax-markup-heading)",
      },
      {
        tag: [tags.atom, tags.bool, tags.special(tags.variableName)],
        color: "var(--color-prettylights-syntax-constant)",
      },
      {
        tag: [tags.processingInstruction, tags.string, tags.inserted],
        color: "var(--color-prettylights-syntax-string)",
      },
      {
        tag: tags.invalid,
        color: "var(--color-prettylights-syntax-invalid-illegal-text)",
      },
    ]);

    let languageExtension = code.classList.contains("language-js")
      ? javascript()
      : code.classList.contains("language-py")
        ? [python(), indentUnit.of("    ")]
        : [];

    let startState = EditorState.create({
      doc: code.textContent.slice(0, -1),
      extensions: [
        keymap.of(defaultKeymap),
        keymap.of(closeBracketsKeymap),
        keymap.of([indentWithTab]),
        theme,
        syntaxHighlighting(highlightStyle),
        closeBrackets(),
        indentOnInput(),
        bracketMatching(),
        languageExtension,
      ],
    });

    highlight.querySelector("pre")!.remove();
    this.view = new EditorView({ state: startState });
    highlight.prepend(this.view.dom);
  }
}
customElements.define("run-code", RunCodeElement);
