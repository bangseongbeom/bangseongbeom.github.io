/**
 * @typedef {import("./runnable-code.js").RunnableCode} RunnableCode
 */

for (const button of document.querySelectorAll("button.clipboard-copy")) {
  button.addEventListener("click", () => {
    const highlight = button.closest(".highlight");
    if (!highlight) throw new Error();
    const view = /** @type {RunnableCode | null} */ (
      button.closest("runnable-code")
    )?.view;
    const data =
      view && highlight.contains(view.dom)
        ? view.state.doc.toString()
        : highlight.querySelector("pre")?.textContent;
    if (data === undefined) throw new Error();

    navigator.clipboard.writeText(data);

    const normal = /** @type {HTMLElement} */ (button.querySelector(".normal"));
    const copied = /** @type {HTMLElement} */ (button.querySelector(".copied"));
    normal.hidden = true;
    copied.hidden = false;
    setTimeout(() => {
      normal.hidden = false;
      copied.hidden = true;
    }, 2000);
  });
}
