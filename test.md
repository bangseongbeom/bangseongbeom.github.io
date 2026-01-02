---
date: 2025-12-12
---

# Markdown Syntax Guide

This document demonstrates various Markdown features, including standard syntax and GitHub-specific extensions like Alerts and Footnotes.

## Text Formatting

You can make text **bold**, _italic_, or **_both_**. You can also ~~strikethrough~~ text.

## Lists

### Unordered List

- Item 1
- Item 2
  - Subitem 2.1
  - Subitem 2.2

### Ordered List

1. First step
2. Second step
3. Third step

## Code

Inline code looks like `const x = 1;`.

Block code:

```js
function hello() {
  console.log("Hello, world!");
}
```

<runnable-code>

```py
print(123)
```

```output
123
```

</runnable-code>

## Tables

| Feature           | Support |
| :---------------- | :-----: |
| Standard Markdown |   Yes   |
| GitHub Flavored   |   Yes   |

## GitHub Alerts

GitHub supports special blockquote syntax for alerts.

> [!NOTE]
> This is a note alert. Useful for general information.

> [!TIP]
> This is a tip alert. Helpful advice goes here.

> [!IMPORTANT]
> This is an important alert. Crucial information for the user.

> [!WARNING]
> This is a warning alert. Be careful!

> [!CAUTION]
> This is a caution alert. Dangerous actions ahead.

## Footnotes

Here is a simple footnote reference[^1].

A footnote can also have a label[^label].

You can also use inline footnotes like this one ^[This is an inline footnote].

## Conclusion

This covers the basic and extended syntax requested.

[^1]: This is the first footnote definition.

[^label]: This is the footnote with a label.
