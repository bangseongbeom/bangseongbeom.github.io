[🏠 방성범 블로그](/README.md) > [🌐 웹](/web.md)

# 바닐라 웹 컴포넌트 만드는 법

<time id="date-published" datetime="2019-08-01">2019. 8. 1.</time>

[제이쿼리(jQuery)](https://jquery.com/), [리액트(React)](https://reactjs.org/), [뷰.js(Vue.js)](https://vuejs.org/)같은 프레임워크 없이 웹 컴포넌트를 만드는 방법에 대해 알아봅니다.

---

**바닐라**: 프레임워크나 라이브러리 없이, 바닐라 아이스크림처럼 '순수하게' 개발한다는 의미로 사용하는 표현입니다.

**웹 컴포넌트**: HTML 엘리먼트를 위해 만들어진 재사용 가능한 자바스크립트 코드 묶음을 일컫습니다. 재사용이 가능하다는 말은, 코드가 함수 등으로 묶여 있어 언제든지 임의의 HTML 엘리먼트에 적용할 수 있다는 것을 의미합니다.

## 요약 정리

세 가지 방법이 있습니다. 요약하자면 다음과 같습니다:

|                    | 구현 난이도 | 사용성             | 컴포넌트 중첩 |
| ------------------ | ----------- | ------------------ | ------------- |
| 함수               | 쉬움        | 경우에 따라 어려움 | 가능          |
| `MutationObserver` | 어려움      | 쉬움               | 가능          |
| 커스텀 엘리먼트    | 보통        | 쉬움               | 불가능        |

|                    | 성능 | IE 지원              |
| ------------------ | ---- | -------------------- |
| 함수               | 빠름 | 모든 버전            |
| `MutationObserver` | 느림 | IE11 (폴리필 있음)   |
| 커스텀 엘리먼트    | 빠름 | 미지원 (폴리필 있음) |

## 함수

직접 함수를 실행해 엘리먼트에 자바스크립트를 적용하는 방법입니다:

<div markdown="1" class="codepen" data-prefill data-theme-id="light" data-default-tab="js">

```html
<span class="random">Click me!</span>
```

{: data-lang="html"}

```js
function makeRandom(elements) {
  for (var element of elements) {
    element.onclick = function () {
      element.textContent = Math.random();
    };
  }
}

makeRandom(document.querySelectorAll(".random"));
```

{: data-lang="js"}

</div>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

간단하게 구현할 수 있어 편리합니다. 그저 `makeRandom()`같은 함수 하나 만들고, 매개변수로 들어온 엘리먼트에 대해 필요한 기능을 추가하면 됩니다. 부트스트랩(Bootstrap)이나 시맨틱 UI(Semantic UI)에서도 웹 컴포넌트를 초기화할 때 이러한 방식을 사용합니다[^bootstrap-popovers] [^semantic-ui-dropdown].

[^bootstrap-popovers]: <https://getbootstrap.com/docs/4.3/components/popovers/#example-enable-popovers-everywhere>

[^semantic-ui-dropdown]: <https://semantic-ui.com/modules/dropdown.html#/usage>

다만 함수를 실행하는 것을 잊지 말아야 합니다. 정적인 웹 페이지라면 특정 HTML `class`를 가진 모든 엘리먼트에 대해 한 번만 호출하면 되므로 그다지 어렵지 않지만, 동적으로 자바스크립트에서 HTML 엘리먼트를 생성하는 경우 상당히 번거롭습니다.

그럼에도 이 방법은 호환성 문제 없이, 그리고 성능 저하 없이 간편하게 구현할 수 있으므로 웹 컴포넌트를 구현할 때 가장 널리 쓰이는 방법입니다.

## `MutationObserver`

직접 함수를 실행하는 것 대신, [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)로 [`class`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/class)나 [`data-*`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*)같은 HTML 애트리뷰트의 변화를 감시합니다:

<div markdown="1" class="codepen" data-prefill data-theme-id="light" data-default-tab="js" data-height="750">

```html
<span class="random">Click me!</span>
```

{: data-lang="html"}

```js
for (let random of document.querySelectorAll(".random")) {
  // 변화 감지 이전
  random.onclick = function () {
    random.textContent = Math.random();
  };
}
new MutationObserver(function (mutations) {
  for (let mutation of mutations) {
    if (mutation.type == "attributes") {
      // 애트리뷰트의 변화
      if (mutation.target.classList.contains("random")) {
        mutation.target.onclick = function () {
          mutation.target.textContent = Math.random();
        };
      } else {
        mutation.target.onclick = null;
      }
    } else if (mutation.type == "childList") {
      // 엘리먼트의 변화
      for (let addedNode of mutation.addedNodes) {
        if (addedNode instanceof Element) {
          if (addedNode.classList.contains("random")) {
            addedNode.onclick = function () {
              addedNode.textContent = Math.random();
            };
          }
        }
      }
    }
  }
}).observe(document, {
  attributeFilter: ["class"],
  childList: true,
  subtree: true,
});
```

{: data-lang="js"}

</div>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

상당히 복잡합니다. `MutationObserver` 자체가 원체 복잡하기 때문입니다. 변화 감지 이전, 애트리뷰트의 변화(`attributeFilter`)와 엘리먼트의 변화(`childList`)를 개별적으로 다루어야 하기 때문에 코드가 무척 길어집니다.

더불어 이 방법은 모든 엘리먼트의 추가/제거를 감시하므로, 반복적으로 다수의 엘리먼트를 추가하거나 제거하는 경우 성능 문제를 야기할 수 있습니다.

`MutationObserver`는 IE11(인터넷 익스플로러 11)에서만 동작합니다. [관련 폴리필](https://github.com/megawac/MutationObserver.js)을 쓸 수도 있지만 성능 저하를 감수해야 합니다.

## 커스텀 엘리먼트

[커스텀 엘리먼트](https://developers.google.com/web/fundamentals/web-components/customelements)를 만들어 웹 컴포넌트를 구현합니다:

<div markdown="1" class="codepen" data-prefill data-theme-id="light" data-default-tab="js" data-height="450">

```html
<x-random>Click me!</x-random>
```

{: data-lang="html"}

```js
customElements.define(
  "x-random",
  class extends HTMLElement {
    constructor() {
      super();

      this.onclick = function () {
        this.textContent = Math.random();
      };
    }
  }
);
```

{: data-lang="js"}

</div>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

코드 길이도 짧고 사용하기도 쉽습니다. 앞서 소개한 방식 중 가장 깔끔합니다.

단점으로는 여러 엘리먼트에 동일한 커스텀 엘리먼트를 중첩해서 적용할 수 없다는 점이 있습니다. 구현해야 할 웹 컴포넌트의 기능이 그저 기존 엘리먼트의 기능을 약간 강화하는 정도에 그친다면 `MutationObserver`를 사용하는 것이 좋습니다.

커스텀 엘리먼트는 IE의 어느 버전에서도 지원하지 않습니다. [관련 폴리필](https://github.com/webcomponents/polyfills/tree/master/packages/custom-elements)을 알아보세요.
