---
title: 파이썬 더블 샤프(##) 주석
category: python
---

파이썬 내장 IDE인 [IDLE(아이들)][idle]에서는 'Comment Out Region'이라는 메뉴 항목이 있습니다. 그런데 이 항목은 샤프를 하나만 붙이는 게 아니라 두 개를 붙입니다. 샤프 두 개에 뭔가 특별한 의미라도 있는 걸까요?

[idle]: https://docs.python.org/3/library/idle.html

<figure>
<img src="/assets/2018-11-22-double-sharp-comments/comment-out-region.png" alt="IDLE에서 'Format' > 'Comment Out Region'">
<figcaption>IDLE이 제공하는 'Comment Out Region'은 샤프 두 개(`##`)를 붙입니다.</figcaption>
</figure>

[PEP 20][pep-20]의 저자 [팀 피터스(Tim Peters)][tim-peters]가 말하길, `#`는 유용한 설명을, `##`는 코드 일부분을 주석화할 때 사용한다고 합니다. 이맥스(Emacs) 파이썬 모드 초창기에 자신이 이러한 관습을 도입했다고 하네요[^single-vs-double].

[pep-20]: https://www.python.org/dev/peps/pep-0020/

[tim-peters]: https://en.wikipedia.org/wiki/Tim_Peters_(software_engineer)

[^single-vs-double]: <https://mail.python.org/pipermail/python-list/2002-October/143369.html>

    I introduced two conventions of this nature in the early days of the Emacs Python mode: ## was used by the comment-region command to "comment out" a contiguous block of code.

    ... # means "this is a useful comment" and ## means "this section is commented out -- pretend it doesn't even exist".
