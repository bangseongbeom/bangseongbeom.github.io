[🏠 방성범 블로그](/README.md) > [🔀 깃](/git.md)

# GitFlow가 안 좋은 이유

<time id="date-published" datetime="2019-07-21">2019. 7. 21.</time>

깃에서 가장 유명한 브랜칭 전략인 [GitFlow(깃플로)](https://danielkummer.github.io/git-flow-cheatsheet/)의 단점을 분석합니다.

## 단점 1: 불필요한 브랜치

GitFlow는 너무 많은 수의 브랜치를 요구합니다. 이들 중 일부는 없어도 크게 상관 없습니다:

- GitFlow는 각 릴리스 별로 브랜치를 요구합니다. 그러나 **이미 릴리스를 위해 버전 별 태그가 존재**하는 상황에서, 릴리스 브랜치는 불필요합니다.
- `master` 브랜치는 최신 안정 릴리스를 표현하는 것이 전부일 뿐 별다른 역할을 하지 않습니다. **대부분의 분기는 `master`가 아니라 `develop`에서** 이루어집니다. 만약 이미 릴리스된 버전에 문제가 있어 핫픽스가 필요하다면, 특정 버전 태그로 간 뒤 거기서 브랜치를 분기하면 됩니다.

## 단점 2: 혼란스러운 기본값 브랜치 이름

깃에는 기본값 브랜치(default branch)라고 하는 것이 있습니다. 저장소를 복제할 때, 풀 리퀘스트를 수락할 때 기본적으로 선택되는 브랜치를 의미합니다.

개발의 편의성을 위해 **기본값 브랜치는 개발할 때 가장 많이 사용하는 브랜치**로 설정하는 것이 좋습니다. 그렇지 않으면 매번 저장소를 복제할 때마다 개발용 브랜치(GitFlow에서는 `develop`)로 바꾸는 수고를 해야 합니다. 이렇게 할 경우 외부 사람이 우리 저장소를 살펴볼 때 안정 버전 대신 개발 버전을 우선적으로 보게 된다는 문제가 있지만, 깃은 외부 사람을 위한 것이 아니라 활발히 개발하는 사람을 위한 도구입니다. 외부 사람이라면 깃허브(GitHub) [릴리스](https://help.github.com/en/articles/creating-releases)같이 별도의 기능을 통해 접근하도록 유도해야 합니다.

GitFlow에서 개발할 때 가장 많이 사용하는 브랜치는 `develop`입니다. 반면 **일반적으로 기본값 브랜치는 `master`라는 이름**을 가집니다. `master`가 아닌 다른 이름을 기본 브랜치 이름으로 사용하는 건 처음 보는 사람에게 약간의 혼란을 일으킬 수 있습니다.

`develop`을 `master`로 바꾸고, 기존의 `master`는 `stable`, `current`, `latest`같이 최신 안정 릴리스 버전임을 더 잘 표현할 수 있는 이름을 가지도록 합시다.

## 불만: 단수형 단어 사용

단점이라고 할 정도까지는 아니지만, 저는 GitFlow가 단수형 단어를 사용해 브랜치 이름을 짓는 것이 마음에 들지 않습니다.

---

일반적으로 브랜치는 그 이름을 통해 어떤 브랜치인지를 표현합니다. 하지만 **레퍼런스**라 불리는 더 긴 이름을 통해 표현할 수도 있습니다. 브랜치의 레퍼런스는 `refs/heads/<브랜치 이름>`과 같이 표현합니다. 태그의 레퍼런스도 존재하는데, `refs/heads/<태그 이름>`같은 식입니다[^git-check-ref-format].

[^git-check-ref-format]: <https://git-scm.com/docs/git-check-ref-format>

레퍼런스를 잘 보시면 레퍼런스 이름에 복수형 단어(`heads`, `tags`)를 사용하고 있는 것을 확인할 수 있습니다.

저는 레퍼런스와 잘 어울리도록 브랜치 이름에도 복수형 단어를 쓰는 것이 좋다고 생각합니다. 다음 표를 보세요. 뭐가 더 자연스럽습니까:

|             | 단수형                   | 복수형                    |
| ----------- | ------------------------ | ------------------------- |
| 브랜치 이름 | `feature/foo`            | `features/foo`            |
| 레퍼런스    | `refs/heads/feature/foo` | `refs/heads/features/foo` |
| 결과        | 단수형과 복수형 혼용     | 자연스러움                |

## 단점 3: 브랜칭 전략이 반드시 필요한가

이건 브랜칭 전략이라는 것의 근본적인 문제입니다. 과연 GitFlow같은 엄격한 브랜칭 전략이 프로젝트를 관리하는데 도움을 줄까요?

**브랜치를 복잡하게 구성한다고 해서 버전 관리를 더 안정적으로 할 수 있는 것은 아닙니다.** 깃에서 가장 중요한 건 코드의 기록을 담고 있는 커밋입니다. 변경 사항을 어떻게 잘 쪼개서 커밋할까, 커밋 메시지를 어떻게 맛깔나게 적을까를 고민하는 것이 더 중요합니다.

GitFlow는 분명 소스 코드를 관리할 수 있는 좋은 브랜칭 전략입니다. 하지만 모든 소프트웨어에 알맞는 방식은 아닙니다. GitFlow를 그대로 수용하기보다는 여러분의 브랜칭 전략을 결정하는데 참고하는 용도로만 활용합시다. GitFlow 외에도 [GitHub flow](https://guides.github.com/introduction/flow/)나 [마이크로소프트의 브랜칭 전략](https://docs.microsoft.com/en-us/azure/devops/learn/devops-at-microsoft/use-git-microsoft)이 있으니 참고해보세요.

## 참고

- <https://www.endoflineblog.com/gitflow-considered-harmful>
- <https://stackoverflow.com/questions/14858075/set-the-develop-branch-as-the-default-for-a-pull-request/14858295#14858295>
