import type { EditorView } from "@codemirror/view";
import { type PyodideAPI } from "pyodide";

export class RunnableCode extends HTMLElement {
  view?: EditorView;
  flag?: string | null;

  async connectedCallback() {
    let highlight = this.querySelector(".highlight")!;
    let code = highlight.querySelector("code")!;
    let flag = code.getAttribute("class")?.match(/language-(.+)/)?.[1];
    this.flag = flag ?? null;

    if (
      flag == "javascript" ||
      flag == "js" ||
      flag == "python" ||
      flag == "py"
    ) {
      const [
        { EditorState },
        { EditorView, keymap },
        { defaultKeymap, indentWithTab },
        { closeBrackets, closeBracketsKeymap },
        { syntaxHighlighting, indentUnit, indentOnInput, bracketMatching },
        { classHighlighter },
      ] = await Promise.all([
        import("@codemirror/state"),
        import("@codemirror/view"),
        import("@codemirror/commands"),
        import("@codemirror/autocomplete"),
        import("@codemirror/language"),
        import("@lezer/highlight"),
      ]);
      let languageExtension = [];
      if (flag == "javascript" || flag == "js")
        languageExtension.push(
          (await import("@codemirror/lang-javascript")).javascript(),
        );
      else if (flag == "python" || flag == "py")
        languageExtension.push(
          (await import("@codemirror/lang-python")).python(),
          indentUnit.of("    "),
        );

      let startState = EditorState.create({
        doc: code.textContent.slice(0, -1),
        extensions: [
          keymap.of(defaultKeymap),
          keymap.of(closeBracketsKeymap),
          keymap.of([indentWithTab]),
          syntaxHighlighting(classHighlighter),
          closeBrackets(),
          indentOnInput(),
          bracketMatching(),
          languageExtension,
        ],
      });
      highlight.querySelector("pre")!.remove();
      this.view = new EditorView({ state: startState });
      highlight.prepend(this.view.dom);

      this.insertAdjacentHTML(
        "beforeend",
        /* HTML */ `<p>
          <button type="button" class="run-code">코드 실행</button>
        </p>`,
      );
      this.querySelector("button.run-code")!.addEventListener("click", runCode);
    } else if (flag == "java" || flag == "jsh") {
      this.insertAdjacentHTML(
        "beforeend",
        /* HTML */ `<p>
          <button type="button">복사</button>한 다음 The Java Playground에
          붙여넣고 실행해보세요.
        </p>`,
      );
    } else throw new Error();
  }
}
customElements.define("runnable-code", RunnableCode);

let pyodide: PyodideAPI;

async function runCode(event: Event) {
  let runnableCode = (event.currentTarget as HTMLElement).closest(
    "runnable-code",
  ) as RunnableCode;
  let doc = runnableCode.view!.state.doc;

  let outputValue: string;

  if (runnableCode.flag == "javascript" || runnableCode.flag == "js") {
    let messages: string[] = [];
    let originalConsole = console;
    console = {
      ...originalConsole,
      assert(condition?: boolean, ...data: any[]) {
        if (!condition) messages.push(...data.map((a) => String(a)));
        originalConsole.assert(condition, ...data);
      },
      clear() {
        messages = [];
        originalConsole.clear();
      },
      debug(...data: any[]) {
        messages.push(...data.map((a) => String(a)));
        originalConsole.debug(...data);
      },
      error(...data: any[]) {
        messages.push(...data.map((a) => String(a)));
        originalConsole.error(...data);
      },
      info(...data: any[]) {
        messages.push(...data.map((a) => String(a)));
        originalConsole.info(...data);
      },
      log(...data: any[]) {
        messages.push(...data.map((a) => String(a)));
        originalConsole.log(...data);
      },
    };
    eval(doc.toString());
    console = originalConsole;
    outputValue = messages.join("\n");
  } else if (runnableCode.flag == "python" || runnableCode.flag == "py") {
    await import("pyodide");
    if (!pyodide) {
      // @ts-expect-error
      pyodide = await loadPyodide();
    }
    outputValue = pyodide.runPython(doc.toString());
  } else throw new Error();

  let output: HTMLOutputElement | null = runnableCode.querySelector("output");
  if (!output) {
    runnableCode.insertAdjacentHTML(
      "beforeend",
      /* HTML */ `<pre><output></output></pre>`,
    );
    output = runnableCode.querySelector("output")!;
  }
  output.value = outputValue;
}
