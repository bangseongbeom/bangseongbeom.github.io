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
      this.querySelector("button.run-code")!.addEventListener("click", runCode);
    }
  }
}
customElements.define("runnable-code", RunnableCode);

let pyodide: PyodideAPI;

async function runCode(event: Event) {
  let runnableCode = (event.currentTarget as HTMLElement).closest(
    "runnable-code",
  ) as RunnableCode;
  let doc = runnableCode.view!.state.doc;

  let messages: HTMLElement[] = [];

  if (runnableCode.flag == "javascript" || runnableCode.flag == "js") {
    let originalConsole = console;
    console = {
      ...originalConsole,
      assert(condition?: boolean, ...data: any[]) {
        if (!condition) {
          let message = document.createElement("div");
          message.classList.add("error");
          message.textContent =
            "Assertion failed: " +
            (data.length ? data.join(" ") : "console.assert");
          messages.push(message);
        }
        originalConsole.assert(condition, ...data);
      },
      clear() {
        messages = [];
        originalConsole.clear();
      },
      debug(...data: any[]) {
        let message = document.createElement("div");
        message.classList.add("log");
        message.textContent = data.join(" ");
        messages.push(message);
        originalConsole.debug(...data);
      },
      error(...data: any[]) {
        let message = document.createElement("div");
        message.classList.add("error");
        message.textContent = data.join(" ");
        messages.push(message);
        originalConsole.error(...data);
      },
      info(...data: any[]) {
        let message = document.createElement("div");
        message.classList.add("info");
        message.textContent = data.join(" ");
        messages.push(message);
        originalConsole.info(...data);
      },
      log(...data: any[]) {
        let message = document.createElement("div");
        message.classList.add("log");
        message.textContent = data.join(" ");
        messages.push(message);
        originalConsole.log(...data);
      },
      table(tabularData?: any, properties?: string[]) {
        let message = document.createElement("table");
        message.append(
          ...tabularData.map((row: any) => {
            let tr = document.createElement("tr");
            tr.append(
              ...row.map((cell: any) => {
                let td = document.createElement("td");
                td.textContent = cell;
                return td;
              }),
            );
            return tr;
          }),
        );
        messages.push(message);
        originalConsole.table(tabularData, properties);
      },
      trace(...data: any[]) {
        let message = document.createElement("div");
        message.classList.add("log");
        message.textContent = data.join(" ");
        messages.push(message);
        originalConsole.trace(...data);
      },
      warn(...data: any[]) {
        let message = document.createElement("div");
        message.classList.add("warn");
        message.textContent = data.join(" ");
        messages.push(message);
        originalConsole.warn(...data);
      },
      dir(item?: any, options?: any) {
        let message = document.createElement("div");
        message.classList.add("log");
        message.textContent = item;
        messages.push(message);
        originalConsole.dir(item, options);
      },
      dirxml(...data: any[]) {
        let message = document.createElement("div");
        message.classList.add("log");
        message.textContent = data.join(" ");
        messages.push(message);
        originalConsole.dirxml(...data);
      },
    };
    try {
      eval(doc.toString());
    } catch (error) {
      let message = document.createElement("div");
      message.classList.add("error");
      message.textContent = String(error);
      messages.push(message);
    }
    console = originalConsole;
  } else if (runnableCode.flag == "python" || runnableCode.flag == "py") {
    await import("pyodide");
    if (!pyodide) {
      // @ts-expect-error
      pyodide = await loadPyodide();
    }
    pyodide.setStdout({
      batched(output) {
        let message = document.createElement("div");
        message.classList.add("log");
        message.textContent = output;
        messages.push(message);
      },
    });
    pyodide.setStderr({
      batched(output) {
        let message = document.createElement("div");
        message.classList.add("error");
        message.textContent = output;
        messages.push(message);
      },
    });
    try {
      pyodide.runPython(doc.toString());
    } catch (error) {
      let message = document.createElement("div");
      message.classList.add("error");
      message.textContent = String(error);
      messages.push(message);
    }
  } else throw new Error();

  let output: HTMLOutputElement | null = runnableCode.querySelector("output");
  if (!output) {
    runnableCode.insertAdjacentHTML(
      "beforeend",
      /* HTML */ `<pre><output></output></pre>`,
    );
    output = runnableCode.querySelector("output")!;
  }
  output.replaceChildren(...messages);
}
