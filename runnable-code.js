import { EditorView } from "@codemirror/view";

export class RunnableCode extends HTMLElement {
  /** @type {EditorView | undefined} */
  view;
  /** @type {string | null | undefined} */
  flag;

  async connectedCallback() {
    const highlight = this.querySelector(".highlight");
    if (!highlight) throw new Error();
    const code = highlight.querySelector("code");
    if (!code) throw new Error();
    const flag = code.getAttribute("class")?.match(/language-(.+)/)?.[1];
    this.flag = flag ?? null;

    if (
      flag === "javascript" ||
      flag === "js" ||
      flag === "python" ||
      flag === "py"
    ) {
      const [
        { EditorState },
        { EditorView, keymap, highlightSpecialChars },
        { defaultKeymap, indentWithTab, history, historyKeymap },
        {
          autocompletion,
          completionKeymap,
          acceptCompletion,
          closeBrackets,
          closeBracketsKeymap,
        },
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
      const languageExtension = [];
      if (flag === "javascript" || flag === "js")
        languageExtension.push(
          (await import("@codemirror/lang-javascript")).javascript(),
        );
      else if (flag === "python" || flag === "py")
        languageExtension.push(
          (await import("@codemirror/lang-python")).python(),
          indentUnit.of("    "),
        );

      const startState = EditorState.create({
        doc: code.textContent.slice(0, -1),
        extensions: [
          highlightSpecialChars(),
          history(),
          syntaxHighlighting(classHighlighter),
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            ...completionKeymap,
            { key: "Tab", run: acceptCompletion },
            indentWithTab,
          ]),
          closeBrackets(),
          autocompletion(),
          indentOnInput(),
          bracketMatching(),
          languageExtension,
        ],
      });
      const pre = highlight.querySelector("pre");
      if (!pre) throw new Error();
      pre.remove();
      this.view = new EditorView({ state: startState });
      highlight.prepend(this.view.dom);
      const runCodeButton = this.querySelector("button.run-code");
      if (!(runCodeButton instanceof HTMLButtonElement)) throw new Error();
      runCodeButton.addEventListener("click", runCode);
    }
  }
}
customElements.define("runnable-code", RunnableCode);

/** @type {import("pyodide").PyodideAPI} */
let pyodide;

/**
 * @param {Event} event
 */
async function runCode(event) {
  const button = event.currentTarget;
  if (!(button instanceof HTMLButtonElement)) throw new Error();
  const runnableCode = button.closest("runnable-code");
  if (!(runnableCode instanceof RunnableCode)) throw new Error();
  if (!runnableCode.view) throw new Error();
  const doc = runnableCode.view.state.doc;

  let messages = [];

  /** @type {string | null} */
  let version = null;

  if (runnableCode.flag === "javascript" || runnableCode.flag === "js") {
    const originalConsole = console;
    console = {
      ...originalConsole,
      /**
       * @param {boolean | undefined} condition
       * @param {...any} data
       */
      assert(condition, ...data) {
        if (!condition) {
          const message = document.createElement("span");
          message.classList.add("error");
          message.textContent =
            "Assertion failed: " +
            (data.length ? data.join(" ") : "console.assert");
          message.textContent += "\n";
          messages.push(message);
        }
        originalConsole.assert(condition, ...data);
      },
      clear() {
        messages = [];
        originalConsole.clear();
      },
      /**
       * @param {...any} data
       */
      debug(...data) {
        const message = document.createElement("span");
        message.classList.add("log");
        message.textContent = data.join(" ");
        message.textContent += "\n";
        messages.push(message);
        originalConsole.debug(...data);
      },
      /**
       * @param {...any} data
       */
      error(...data) {
        const message = document.createElement("span");
        message.classList.add("error");
        message.textContent = data.join(" ");
        message.textContent += "\n";
        messages.push(message);
        originalConsole.error(...data);
      },
      /**
       * @param {...any} data
       */
      info(...data) {
        const message = document.createElement("span");
        message.classList.add("info");
        message.textContent = data.join(" ");
        message.textContent += "\n";
        messages.push(message);
        originalConsole.info(...data);
      },
      /**
       * @param {...any} data
       */
      log(...data) {
        const message = document.createElement("span");
        message.classList.add("log");
        message.textContent = data.join(" ");
        message.textContent += "\n";
        messages.push(message);
        originalConsole.log(...data);
      },
      /**
       * @param {any} tabularData
       * @param {string[] | undefined} properties
       */
      table(tabularData, properties) {
        const message = document.createElement("table");
        message.append(
          ...tabularData.map((/** @type {any} */ row) => {
            const tr = document.createElement("tr");
            tr.append(
              ...row.map((/** @type {any} */ cell) => {
                const td = document.createElement("td");
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
      /**
       * @param {...any} data
       */
      trace(...data) {
        const message = document.createElement("span");
        message.classList.add("log");
        message.textContent = data.join(" ");
        message.textContent += "\n";
        messages.push(message);
        originalConsole.trace(...data);
      },
      /**
       * @param {...any} data
       */
      warn(...data) {
        const message = document.createElement("span");
        message.classList.add("warn");
        message.textContent = data.join(" ");
        message.textContent += "\n";
        messages.push(message);
        originalConsole.warn(...data);
      },
      /**
       * @param {any} item
       * @param {any} options
       */
      dir(item, options) {
        const message = document.createElement("span");
        message.classList.add("log");
        message.textContent = item;
        message.textContent += "\n";
        messages.push(message);
        originalConsole.dir(item, options);
      },
      /**
       * @param {...any} data
       */
      dirxml(...data) {
        const message = document.createElement("span");
        message.classList.add("log");
        message.textContent = data.join(" ");
        message.textContent += "\n";
        messages.push(message);
        originalConsole.dirxml(...data);
      },
    };
    try {
      eval(doc.toString());
    } catch (error) {
      const message = document.createElement("span");
      message.classList.add("error");
      message.textContent = String(error);
      message.textContent += "\n";
      messages.push(message);
    }
    console = originalConsole;
  } else if (runnableCode.flag === "python" || runnableCode.flag === "py") {
    button.disabled = true;
    const normal = button.querySelector(".normal");
    if (!(normal instanceof HTMLElement)) throw new Error();
    const running = button.querySelector(".running");
    if (!(running instanceof HTMLElement)) throw new Error();
    normal.hidden = true;
    running.hidden = false;

    await import("pyodide");
    if (!pyodide) {
      // @ts-expect-error
      pyodide = await loadPyodide();
    }
    version = `Pyodide ${pyodide.version}`;
    pyodide.setStdin({
      stdin() {
        const result = prompt();
        if (typeof result === "string") {
          const message = document.createElement("span");
          message.classList.add("log");
          message.textContent = result;
          message.textContent += "\n";
          messages.push(message);
        }
        return result;
      },
    });
    pyodide.setStdout({
      write(buffer) {
        const message = document.createElement("span");
        message.classList.add("log");
        message.textContent = new TextDecoder().decode(buffer);
        messages.push(message);
        return buffer.length;
      },
    });
    pyodide.setStderr({
      write(buffer) {
        const message = document.createElement("span");
        message.classList.add("error");
        message.textContent = new TextDecoder().decode(buffer);
        messages.push(message);
        return buffer.length;
      },
    });
    try {
      pyodide.runPython(doc.toString());
    } catch (error) {
      const message = document.createElement("span");
      message.classList.add("error");
      message.textContent =
        error instanceof Error
          ? (error.stack ?? error.toString())
          : String(error);
      message.textContent += "\n";
      messages.push(message);
    }

    button.disabled = false;
    normal.hidden = false;
    running.hidden = true;
  } else throw new Error();

  let output = runnableCode.querySelector(".language-output");
  if (!output) {
    const highlight = runnableCode.querySelector(".highlight");
    if (!highlight) throw new Error();
    highlight.insertAdjacentHTML(
      "beforeend",
      /* HTML */ `<pre><code class="language-output"></code></pre>`,
    );
    output = runnableCode.querySelector(".language-output");
    if (!output) throw new Error();
  }
  if (version && !runnableCode.querySelector(".version")) {
    button.insertAdjacentHTML(
      "afterend",
      /* HTML */ ` <span class="version"></span>`,
    );
    const versionElement = runnableCode.querySelector(".version");
    if (!versionElement) throw new Error();
    versionElement.textContent = `(${version})`;
  }
  output.replaceChildren(...messages);
}
