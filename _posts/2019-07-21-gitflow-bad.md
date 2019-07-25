---
title: GitFlow가 안 좋은 이유
category: git
---

깃에서 가장 유명한 브랜칭 전략인 [GitFlow(깃플로)](https://danielkummer.github.io/git-flow-cheatsheet/)의 단점을 분석합니다.

## 단점 1: 복잡함

GitFlow는 너무 복잡합니다. 릴리스마다, 버그 수정마다 새로운 브랜치를 생성해야 한다거나, 지속적으로 하나의 브랜치를 여러 브랜치와 머지해야만 합니다.

**브랜치를 복잡하게 구성한다고 해서 버전 관리가 더 안정적으로 변하는 것은 아닙니다.** 깃에서 가장 중요한 건 코드의 기록을 담고 있는 커밋입니다. 변경 사항을 어떻게 잘 쪼개서 커밋할까, 커밋 메시지를 어떻게 맛깔나게 적을까를 고민하는 것이 더 중요합니다.

브랜칭 전략은 팀원과 협의를 통해 꼭 필요한 내용만 정하는 것이 좋습니다. **브랜칭 전략을 잘못 정할지라도 다른 브랜칭 전략으로 바꾸는 건 어렵지 않습니다.** 이와 달리 커밋은 수정하기가 까다롭습니다.

## 단점 2: 비직관적인 브랜치 이름

여러분이 GitFlow를 따른다면 가장 많이 하게 될 일은 `develop` 브랜치로부터 새로운 `feature` 브랜치를 만드는 것입니다. 편리하게 작업하기 위해서는 기본 브랜치를 `develop`으로 설정하는 게 좋습니다.

기본 브랜치를 `develop`으로 변경할 경우 제3자가 저장소를 복제했을 때 곧바로 안정 버전을 사용할 수 없다는 문제가 있지만, **깃은 최종 사용자를 위한 것이 아니라 개발자를 위한 도구입니다.** 최종 사용자라면 깃허브(GitHub)의 [릴리스](https://help.github.com/en/articles/creating-releases)같은 기능을 통해 접근하도록 유도해야 합니다.

`master`가 아닌 다른 이름을 기본 브랜치 이름으로 사용하는 건 처음 보는 사람에게 약간의 혼란을 일으킬 수 있습니다. 기본 브랜치 이름은 예외적으로, **조금 비직관적이더라도 그냥 `master`를 사용**하는 것이 낫습니다.

이제 `develop`이 `master`가 되었으니, 기존의 `master`는 **`stable`**, `current`, `latest`같이 최신 안정 릴리스 버전임을 더 잘 표현할 수 있는 이름을 가지도록 합시다.

결론적으로, 다음과 같습니다:

| 깃플로에서의 브랜치 이름 | 이 글에서 주장하는 브랜치 이름 |
|---|---|
| `develop` | `master` |
| `master` | `stable` |

## 단점 3: 단수형 단어 사용

레퍼런스는 깃에서 브랜치, 태그, 커밋에 상관 없이 이들을 같은 방식으로 식별할 수 있도록 도와줍니다. 브랜치의 레퍼런스는 `refs/heads/<브랜치 이름>`, 태그의 레퍼런스는 `refs/heads/<태그 이름>`입니다[^git-check-ref-format]. 브랜치인지 태그인지를 구분하기 위해 레퍼런스 이름에 복수형 단어(`heads`, `tags`)를 사용하고 있는 것을 확인할 수 있습니다.

[^git-check-ref-format]: <https://git-scm.com/docs/git-check-ref-format>

브랜치의 이름에는 슬래시('/')를 포함하여 구조적으로 보이게끔 할 수 있습니다. 이때 레퍼런스의 다른 부분들과 잘 어울리도록 복수형 단어를 쓰는 것이 좋습니다. `features/my-foo`를 예로 들어봅시다. 이 브랜치의 레퍼런스는 `refs/heads/features/my-foo`인데, `features`라는 단어는 `refs`, `heads`와 함께 복수 형태를 취하므로 자연스러운 느낌이 듭니다.  

GitFlow는 브랜치의 이름에 단수형 단어를 사용합니다. `feature/my-foo`같이 말이죠. 살짝 기분이 나쁩니다.

## 결론: GitFlow는 참고만 하자

GitFlow는 분명 일반적인 소프트웨어의 릴리스 사이클을 표현할 수 있는 좋은 브랜칭 전략이기는 하지만, 모든 소프트웨어에 알맞는 방식은 아닙니다. GitFlow를 완전히 따라하기보다는, 여러분의 브랜칭 전략을 결정하는데 참고하는 용도로만 사용합시다. GitFlow 외에도 [GitHub flow](https://guides.github.com/introduction/flow/)나 [마이크로소프트의 브랜칭 전략](https://docs.microsoft.com/en-us/azure/devops/learn/devops-at-microsoft/use-git-microsoft)이 있습시다.

## 참고

<https://www.endoflineblog.com/gitflow-considered-harmful>
<https://stackoverflow.com/questions/14858075/set-the-develop-branch-as-the-default-for-a-pull-request/14858295#14858295>
