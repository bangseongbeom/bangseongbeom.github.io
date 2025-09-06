customElements.define(
  "clipboard-copy",
  class extends HTMLElement {
    connectedCallback() {
      this.querySelector("button").addEventListener("click", this);
    }

    disconnectedCallback() {
      this.querySelector("button").removeEventListener("click", this);
    }

    handleEvent() {
      let data = this.closest(".highlight").querySelector("pre").textContent;
      navigator.clipboard.writeText(data);

      let copyIcon = this.querySelector(
        ".js-clipboard-copy-icon",
      ) as SVGAElement;
      let checkIcon = this.querySelector(
        ".js-clipboard-check-icon",
      ) as SVGAElement;
      copyIcon.attributeStyleMap.set("display", "none");
      checkIcon.attributeStyleMap.delete("display");
      setTimeout(() => {
        copyIcon.attributeStyleMap.delete("display");
        checkIcon.attributeStyleMap.set("display", "none");
      }, 2000);
    }
  },
);
