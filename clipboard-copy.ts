import type { RunnableCode } from "./runnable-code.ts";

document.querySelectorAll("button.clipboard-copy").forEach((button) =>
  button.addEventListener("click", () => {
    let data: string;
    let runnableCode = button.closest("runnable-code") as RunnableCode | null;
    let view = runnableCode?.view;
    let pre = button.closest(".highlight, runnable-code")?.querySelector("pre");
    if (pre) data = pre.textContent;
    else if (view) data = runnableCode!.view!.state.doc.toString();
    else throw new Error();

    navigator.clipboard.writeText(data);

    let copyIcon = button.querySelector(
      ".js-clipboard-copy-icon",
    ) as SVGElement;
    let checkIcon = button.querySelector(
      ".js-clipboard-check-icon",
    ) as SVGElement;
    copyIcon.attributeStyleMap.set("display", "none");
    checkIcon.attributeStyleMap.delete("display");
    setTimeout(() => {
      copyIcon.attributeStyleMap.delete("display");
      checkIcon.attributeStyleMap.set("display", "none");
    }, 2000);
  }),
);
