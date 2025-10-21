/**
 * @typedef {import("./runnable-code.js").RunnableCode} RunnableCode
 */

document.querySelectorAll("button.clipboard-copy").forEach((button) =>
  button.addEventListener("click", () => {
    /** @type {string} */
    let data;
    /** @type {RunnableCode | null} */
    let runnableCode = button.closest("runnable-code");
    let view = runnableCode?.view;
    /** @type {HTMLPreElement | null | undefined} */
    let pre = button.closest(".highlight, runnable-code")?.querySelector("pre");
    if (pre) data = pre.textContent;
    else if (view) data = view.state.doc.toString();
    else throw new Error();

    navigator.clipboard.writeText(data);

    let copyIcon = /** @type {SVGElement} */ (
      button.querySelector(".js-clipboard-copy-icon")
    );
    let checkIcon = /** @type {SVGElement} */ (
      button.querySelector(".js-clipboard-check-icon")
    );
    copyIcon.attributeStyleMap.set("display", "none");
    checkIcon.attributeStyleMap.delete("display");
    setTimeout(() => {
      copyIcon.attributeStyleMap.delete("display");
      checkIcon.attributeStyleMap.set("display", "none");
    }, 2000);
  }),
);
