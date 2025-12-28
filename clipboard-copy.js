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
    if (pre) data = pre.textContent;
    else if (view) data = view.state.doc.toString();
    else throw new Error();

    navigator.clipboard.writeText(data);

    const copy = /** @type {HTMLElement} */ (button.querySelector(".copy"));
    const copied = /** @type {HTMLElement} */ (button.querySelector(".copied"));
    copy.hidden = true;
    copied.hidden = false;
    setTimeout(() => {
      copy.hidden = false;
      copied.hidden = true;
    }, 2000);
  }),
);
