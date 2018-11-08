---
layout: page
---

{%- for category in site.categories -%}
<span>{{ category | first }}</span>
{%- endfor -%}
