---
title: 파이썬 더블 샤프(##) 주석
category: python
---

파이썬 내장 IDE인 [IDLE(아이들)][idle]에서는 'Comment Out Region'이라는 메뉴 항목이 있습니다. 이 항목은 사용자가 선택한 영역을 주석 처리하는데, 특이하게도 하나가 아니라 두 개의 샤프를 붙입니다. 샤프 두 개에 뭔가 특별한 의미라도 있는 걸까요?

[idle]: https://docs.python.org/3/library/idle.html

<figure>
<img src="/assets/2018-11-22-double-sharp-comments/comment-out-region.png" alt="IDLE에서 'Format' > 'Comment Out Region'">
<figcaption>IDLE의 'Comment Out Region' 메뉴 항목</figcaption>
</figure>

샤프가 한 개냐 두 개냐에 따라 무언가 달라지는 것 같지는 않습니다. 다 똑같은 주석일텐데 말이죠. 파이썬 공식 문서를 찾아보아도, 샤프 두 개와 관련된 말은 나오지 않습니다.

파이썬 메일링 리스트에서 단서를 찾을 수 있었습니다. 하나의 샤프(`#`)는 유용한 설명을, 두 개의 샤프(`##`)는 코드 일부분을 주석화할 때 사용합니다. [팀 피터스(Tim Peters)][tim-peters]가 [이맥스](https://ko.wikipedia.org/wiki/%EC%9D%B4%EB%A7%A5%EC%8A%A4)(역사 깊은 코드 편집기입니다)의 파이썬 편집 모드에 이러한 관습을 도입했다고 하네요[^single-vs-double].

이런 것을 [코딩 관습(Coding conventions)](https://en.wikipedia.org/wiki/Coding_conventions)이라고 합니다. 사람이 코드를 읽을 때 도움을 주기 위해 샤프를 하나 더 넣어 버릇했고, 그것이 관습으로 굳어진 것입니다. 파이썬 입장에서는 (코드가 실행될 때는) 아무런 차이가 없는데도 말이죠.

[pep-20]: https://www.python.org/dev/peps/pep-0020/

[tim-peters]: https://en.wikipedia.org/wiki/Tim_Peters_(software_engineer)

[^single-vs-double]: <https://mail.python.org/pipermail/python-list/2002-October/143369.html>

    I introduced two conventions of this nature in the early days of the Emacs Python mode: ## was used by the comment-region command to "comment out" a contiguous block of code.

    ... # means "this is a useful comment" and ## means "this section is commented out -- pretend it doesn't even exist".
