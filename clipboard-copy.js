/**
 * @typedef {import("./runnable-code.js").RunnableCode} RunnableCode
 */

document.querySelectorAll("button.clipboard-copy").forEach((button) =>
  button.addEventListener("click", () => {
    /** @type {string} */
    let data;
    /** @type {RunnableCode | null} */
    const runnableCode = button.closest("runnable-code");
    const view = runnableCode?.view;
    /** @type {HTMLPreElement | null | undefined} */
    const pre = button
      .closest(".highlight, runnable-code")
      ?.querySelector("pre");
    if (view) data = view.state.doc.toString();
    else if (pre) data = pre.textContent;
    else throw new Error();

    navigator.clipboard.writeText(data);

    /** @type {HTMLElement | null} */
    const normal = button.querySelector(".normal");
    if (!normal) throw new Error();
    /** @type {HTMLElement | null} */
    const copied = button.querySelector(".copied");
    if (!copied) throw new Error();
    normal.hidden = true;
    copied.hidden = false;
    setTimeout(() => {
      normal.hidden = false;
      copied.hidden = true;
    }, 2000);
  }),
);
