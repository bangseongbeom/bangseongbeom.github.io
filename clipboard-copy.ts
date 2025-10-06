import type { RunnableCode } from "./runnable-code.ts";

document.querySelectorAll("button.clipboard-copy").forEach((button) =>
  button.addEventListener("click", (event) => {
    let data: string;

    let pre = button.closest(".highlight")?.querySelector("pre");
    if (pre) data = pre.textContent;
    else {
      let runnableCode = button.closest("runnable-code") as RunnableCode | null;
      data = runnableCode!.view!.state.doc.toString();
    }

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
