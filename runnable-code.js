import { EditorView } from "@codemirror/view";

export class RunnableCode extends HTMLElement {
  /** @type {EditorView | undefined} */
  view;
  /** @type {string | null | undefined} */
  flag;

  async connectedCallback() {
    let highlight = /** @type {HTMLElement} */ (
      this.querySelector(".highlight")
    );
    let code = /** @type {HTMLElement} */ (highlight.querySelector("code"));
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
      /** @type {HTMLPreElement} */ (highlight.querySelector("pre")).remove();
      this.view = new EditorView({ state: startState });
      highlight.prepend(this.view.dom);
      /** @type {HTMLButtonElement} */ (
        this.querySelector("button.run-code")
      ).addEventListener("click", runCode);
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
  let currentTarget = /** @type {HTMLButtonElement} */ (event.currentTarget);
  let runnableCode = /** @type {RunnableCode} */ (
    currentTarget.closest("runnable-code")
  );
  if (!runnableCode.view) throw new Error();
  let doc = runnableCode.view.state.doc;

  /** @type {HTMLElement[]} */
  let messages = [];

  if (runnableCode.flag == "javascript" || runnableCode.flag == "js") {
    let originalConsole = console;
    console = {
      ...originalConsole,
      /**
       * @param {boolean | undefined} condition
       * @param {...any} data
       */
      assert(condition, ...data) {
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
      /**
       * @param {...any} data
       */
      debug(...data) {
        let message = document.createElement("div");
        message.classList.add("log");
        message.textContent = data.join(" ");
        messages.push(message);
        originalConsole.debug(...data);
      },
      /**
       * @param {...any} data
       */
      error(...data) {
        let message = document.createElement("div");
        message.classList.add("error");
        message.textContent = data.join(" ");
        messages.push(message);
        originalConsole.error(...data);
      },
      /**
       * @param {...any} data
       */
      info(...data) {
        let message = document.createElement("div");
        message.classList.add("info");
        message.textContent = data.join(" ");
        messages.push(message);
        originalConsole.info(...data);
      },
      /**
       * @param {...any} data
       */
      log(...data) {
        let message = document.createElement("div");
        message.classList.add("log");
        message.textContent = data.join(" ");
        messages.push(message);
        originalConsole.log(...data);
      },
      /**
       * @param {any} tabularData
       * @param {string[] | undefined} properties
       */
      table(tabularData, properties) {
        let message = document.createElement("table");
        message.append(
          ...tabularData.map(
            /** @param {any} row */ (row) => {
              let tr = document.createElement("tr");
              tr.append(
                ...row.map(
                  /** @param {any} cell */ (cell) => {
                    let td = document.createElement("td");
                    td.textContent = cell;
                    return td;
                  },
                ),
              );
              return tr;
            },
          ),
        );
        messages.push(message);
        originalConsole.table(tabularData, properties);
      },
      /**
       * @param {...any} data
       */
      trace(...data) {
        let message = document.createElement("div");
        message.classList.add("log");
        message.textContent = data.join(" ");
        messages.push(message);
        originalConsole.trace(...data);
      },
      /**
       * @param {...any} data
       */
      warn(...data) {
        let message = document.createElement("div");
        message.classList.add("warn");
        message.textContent = data.join(" ");
        messages.push(message);
        originalConsole.warn(...data);
      },
      /**
       * @param {any} item
       * @param {any} options
       */
      dir(item, options) {
        let message = document.createElement("div");
        message.classList.add("log");
        message.textContent = item;
        messages.push(message);
        originalConsole.dir(item, options);
      },
      /**
       * @param {...any} data
       */
      dirxml(...data) {
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
      currentTarget.disabled = true;
      currentTarget.dataset.defaultTextContent = currentTarget.textContent;
      currentTarget.textContent = "코드 실행 중...";

      // @ts-expect-error
      pyodide = await loadPyodide();

      currentTarget.disabled = false;
      currentTarget.textContent = currentTarget.dataset.defaultTextContent;
      delete currentTarget.dataset.defaultTextContent;
    }
    pyodide.setStdout({
      /**
       * @param {string} output
       */
      batched(output) {
        let message = document.createElement("div");
        message.classList.add("log");
        message.textContent = output;
        messages.push(message);
      },
    });
    pyodide.setStderr({
      /**
       * @param {string} output
       */
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
      message.textContent =
        error instanceof Error
          ? (error.stack ?? error.toString())
          : String(error);
      messages.push(message);
    }
  } else throw new Error();

  let output = runnableCode.querySelector("output");
  if (!output) {
    runnableCode.insertAdjacentHTML(
      "beforeend",
      /* HTML */ `<pre><output></output></pre>`,
    );
    output = /** @type {HTMLOutputElement} */ (
      runnableCode.querySelector("output")
    );
  }
  output.replaceChildren(...messages);
}
