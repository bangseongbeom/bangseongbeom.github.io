import type { RunCodeElement } from "./run-code.ts";

customElements.define(
  "clipboard-copy",
  class extends HTMLElement {
    connectedCallback() {
      this.querySelector("button")?.addEventListener("click", this);
    }

    disconnectedCallback() {
      this.querySelector("button")?.removeEventListener("click", this);
    }

    handleEvent() {
      let data: string;
      let pre = this.closest(".highlight")?.querySelector("pre");
      if (pre) data = pre.textContent;
      else {
        let runCode = this.closest("run-code") as RunCodeElement | null;
        data = runCode!.view!.state.doc.toString();
      }

      navigator.clipboard.writeText(data);

      let copyIcon = this.querySelector(
        ".js-clipboard-copy-icon",
      ) as SVGElement;
      let checkIcon = this.querySelector(
        ".js-clipboard-check-icon",
      ) as SVGElement;
      copyIcon.attributeStyleMap.set("display", "none");
      checkIcon.attributeStyleMap.delete("display");
      setTimeout(() => {
        copyIcon.attributeStyleMap.delete("display");
        checkIcon.attributeStyleMap.set("display", "none");
      }, 2000);
    }
  },
);
