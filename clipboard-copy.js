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
    const pre =
      button.parentElement?.previousElementSibling?.querySelector("pre");
    if (pre) data = pre.textContent;
    else if (view) data = view.state.doc.toString();
    else throw new Error();

    navigator.clipboard.writeText(data);

    const notCopied = button.querySelector(":not(.copied)");
    if (!(notCopied instanceof HTMLElement)) throw new Error();
    notCopied.hidden = true;
    const copied = button.querySelector(".copied");
    if (!(copied instanceof HTMLElement)) throw new Error();
    copied.hidden = false;

    setTimeout(() => {
      notCopied.hidden = false;
      copied.hidden = true;
    }, 2000);
  }),
);
