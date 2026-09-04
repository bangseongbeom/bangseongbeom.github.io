const links = Array.from(
  /** @type {NodeListOf<HTMLAnchorElement>} */ (
    document.querySelectorAll('.site-toc a[href^="#"]')
  ),
);
const headings = links.map((link) =>
  document.getElementById(decodeURIComponent(link.hash.slice(1))),
);

function update() {
  let current = -1;
  headings.forEach((heading, i) => {
    if (heading && heading.getBoundingClientRect().top <= 0) current = i;
  });
  links.forEach((link, i) => {
    link.parentElement?.classList.toggle("current", i === current);
  });
}

if (links.length) {
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  update();
}
