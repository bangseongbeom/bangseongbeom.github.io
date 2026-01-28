---
lang: ko
categories: [web]
date: 2019-07-21
---

[방성범](/README.md) / [웹](/web.md)

# Redux의 장점과 주의점

[Redux(리덕스)](https://redux.js.org/)를 쓰는 이유와 사용 시 주의할 점에 대해 살펴봅니다.

## 장점 1: 상태의 중앙화

Redux는 [스토어(Store)](https://redux.js.org/glossary#store)라는 이름의 전역 자바스크립트 변수를 통해 상태를 한 곳에서 관리하는데, 이를 **중앙화**라 합니다.

**상태**: 웹 사이트에서 현재를 위해 필요한 정보를 뜻합니다. 현재 로그인한 사용자 정보라든가, 현재 사용자가 보고 있는 [탭](https://react-bootstrap.github.io/components/tabs/)이 어떤 것인지에 대한 정보가 이에 해당합니다. 상태는 그저 값에 불과하기 때문에 숫자, 문자열, 객체 등 어떠한 타입으로도 표현할 수 있습니다. 상태의 위치 또한 제한이 없습니다. 변수, HTML 엘리먼트의 [`data-*` 애트리뷰트](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes), (리액트(React)를 쓴다면) 리액트의 [state](https://reactjs.org/docs/glossary.html#state) 등 어느 곳에서나 존재할 수 있습니다.

상태의 중앙화로 인해 다음과 같은 이점을 얻을 수 있습니다:

- **더 이상 웹 사이트의 상태를 어디에 둘지 고민하지 않아도 됩니다.** 예를 들어, 로그인 사용자의 레벨을 상단 메뉴에도 출력하고 본문에도 출력해야 한다고 합시다. 이때 상태 정보를 어디에 두어야 할까요. 상단 메뉴 엘리먼트와 본문 엘리먼트에 각각 `data-*` 애트리뷰트로 레벨을 저장할까요? 아니면 전역 변수? 리액트를 쓴다면 문제는 더 복잡해지는데, 부모 컴포넌트로부터 [props](https://reactjs.org/docs/glossary.html#props)를 통해 단계 별로 물려받도록 구성해야 합니다.
- **웹 사이트에 다시 방문했을 때를 대비해 쉽게 상태를 저장하거나 불러올 수 있습니다.** 상태 정보가 여기저기 흩어져 있다면 각 상태마다 저장 기능을 구현해야 하는 불편함이 있습니다.

## 장점 2: 읽기 전용 상태

Redux는 상태를 **읽기 전용**으로 취급합니다. 상태를 변경하기 위해서는 상태 일부를 바꾸는 게 아니라 상태 전체를 갈아치워야 합니다.

이로 인해 다음과 같은 이점을 얻을 수 있습니다:

- 상태가 읽기 전용이므로, **이전 상태로 돌아가기 위해서는 그저 이전 상태를 현재 상태에 덮어쓰기만 하면 됩니다.** 이런 식으로 실행 취소 기능을 구현할 수 있습니다. 실제로 [Redux Undo](https://redux.js.org/recipes/implementing-undo-history#using-redux-undo)라는 라이브러리는 이런 식으로 실행 취소 기능을 제공합니다.

반면 다음과 같은 단점도 있습니다:

- Redux는 상태를 읽기 전용으로 취급할 뿐, 실제 읽기 전용으로 만들어주지는 않습니다. 때문에 상태를 실수로 직접 변경하지 않도록 항상 주의해야 합니다. 이를 예방하기 위해 [Immutable.js](https://immutable-js.github.io/immutable-js/)같은 라이브러리도 존재합니다.

## 장점 3: 부수 효과 없는 리듀서

Redux는 상태를 변경하는 도중 **부수 효과(side effect)가 일어나지 않도록** 코딩하기를 요구하며, 이와 함께 상태를 변경하려는 시도 자체를 복제, 저장, 전송할 수 있도록 **자바스크립트 객체** 형태로 구성하기를 강제합니다. 이때 부수 효과 없이 상태를 변경하는 함수를 [**리듀서(Reducer)**](https://redux.js.org/glossary#reducer), 상태 변경을 어떻게 할 것인지에 대한 정보를 담은 자바스크립트 객체를 [**액션(Action)**](https://redux.js.org/glossary#action)이라 합니다.

**부수 효과**: 함수가 실행될 때 함수의 매개변수가 아닌 다른 값에 따라 반환값이 바뀔 수 있는 것을 의미합니다. 바꿔 말하면, 부수 효과가 없는 함수는 매개 변수가 바뀌지 않는 한 언제나 동일한 결과를 반환해야 합니다. 함수 내부에서 [`XMLHttpRequest`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest), [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)를 사용할 경우 가져오는 데이터가 바뀌거나, 그 사이에 서버가 죽어 최종적으로 함수의 반환값이 바뀔 수 있으므로 부수 효과가 있다고 여깁니다. [`Math.random()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random), [`Date.now()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now)를 사용하는 것 역시 함수를 언제 호출하냐에 따라 다른 결과를 반환하기 때문에 부수 효과가 있습니다[^side-effects].

[^side-effects]:
    <https://redux.js.org/recipes/structuring-reducers/prerequisite-concepts#note-on-immutability-side-effects-and-mutation>

    > Other side effects like generating unique IDs or timestamps in a reducer also make the code unpredictable and harder to debug and test.

리듀서와 액션의 성질로 인해 다음과 같은 이점을 얻게 됩니다:

- **액션만 가지고 있어도 상태가 어떻게 변화할지 완벽히 예상할 수 있습니다.** 리듀서는 액션 말고 아무 것도 알 수 없으니, 액션이 무엇인지 알면 리듀서가 만들어내는 상태의 변화도 알 수 있기 때문입니다. 상태를 변경하는 도중 네트워크에 의해 영향을 받거나 예기치 않은 결과가 나오거나 하는 일이 없습니다.
- **액션 일부를 제외하고 다시 실행하더라도 어떤 일이 벌어질지 예상하기 쉽습니다.** 리듀서는 액션에 따라서만 움직이므로 마치 수학 공식처럼 작동하기 때문입니다. [Redux DevTools Extension(리덕스 개발자 도구)](http://extension.remotedev.io/)의 skip 기능이 이러한 Redux의 성질을 효과적으로 이용합니다. 반면 리듀서 내부에서 `Math.random()` 따위를 호출해 부수 효과를 일으킬 경우, 리듀서에 동일한 액션을 전달해도 언제나 결과가 같음을 보장할 수 없습니다.
- 전체 상태 정보를 넘기지 않고도 액션만 있다면 동일한 상태를 만들어낼 수 있습니다. 네트워크 상에서 서로 떨어진 기기를 동일한 상태로 맞출 수 있습니다.

그렇다고 다음과 같은 단점을 완전히 무시할 수는 없습니다:

- 부수 효과 없이 웹 사이트를 개발할 수는 없습니다. 필연적으로 어딘가에서는 네트워크로부터 무언가를 `fetch()`하거나 `Math.random()`으로 랜덤 값을 만들어내야 합니다. 리듀서에서는 부수 효과가 존재할 수 없으니, 대신 바깥에서 `fetch()`나 `Math.random()`을 호출한 뒤 **그 값을 액션에 담아둔 다음 리듀서를 호출하는 번거로운 과정을 거쳐야 합니다**.
- **어떤 코드에 부수 효과가 있는지 없는지 확인하는 것은 대단히 어려운 일입니다.** 자바스크립트 자체가 부수 효과에 대해 민감하게 대응하도록 설게된 언어가 아니기 때문입니다. 당장 `Math`만 봐도 `Math.random()`같이 부수 효과를 일으키는 함수가 있는 반면, `Math.sin()`같이 부수 효과가 없는 것도 있습니다. 정말 부수 효과에 대해 민감하게 처리하고 싶다면 [하스켈](https://en.wikibooks.org/wiki/Haskell)과 같은 함수형 프로그래밍 언어를 사용하는 것이 좋습니다.

## 또다른 장점: 리액트와의 유사성

리액트에는 [상태(state)](https://reactjs.org/docs/glossary.html#state)라는 개념이 존재합니다. 리액트의 상태는 Redux와 마찬가지로 읽기 전용이며, 일정한 방법([setState()](https://reactjs.org/docs/react-component.html#setstate))을 통해서만 상태를 변경할 수 있도록 합니다. 이렇듯 서로 유사한 성질로 인해 Redux는 리액트의 상태 관리 도구로 애용되고 있습니다.

또한 Redux의 핵심 개발자 중 일부는 실제 리액트의 개발에 참여하고 있기도 합니다.

## 주의점: Redux는 개발자의 행위를 제약

리덕스는 일반적인 라이브러리나 프레임워크가 아닙니다. 리덕스만의 설계 철학과 함께, 철학을 쉽게 따를 수 있도록 각종 도구를 지원해주는 개발 도구입니다. 설계 철학을 따르는 건 그냥 라이브러리를 사용하는 것과는 완전히 다른 문제입니다. **개발자가 그 설계 철학에서 요구하는 대로 코딩의 방식을 바꾸어야 합니다.** 실제로는 상태가 읽기 전용이 아니더라도 읽기 전용인 것처럽 취급해야 하며, 상태를 변경할 때([리듀서](https://redux.js.org/glossary#reducer)를 사용할 때) 부수 효과가 없도록 잘 만들어야만 합니다.

리덕스를 사용함으로 인해 강력한 장점을 얻는 것은 사실입니다. 그러나 리덕스의 철학에서 강제하는 방식으로 인하여 **오히려 코드가 복잡해지거나 코딩하기 어려워질** 수도 있습니다. 만약 앞서 언급한 Redux의 장점 중 일부만이 필요하다면 Redux 대신 다른 것을 찾아보시기 바랍니다. 다른 것 다 필요 없고 상태 관리를 중앙화하는 것만 있어도 된다면 [Context](https://reactjs.org/docs/context.html)를 사용하세요[^when-context-replaces-redux] [^redux-not-dead-yet].

[^when-context-replaces-redux]:
    <https://frontarm.com/james-k-nelson/when-context-replaces-redux/>

    > Redux provides a whole toolkit for managing state:
    >
    > - It comes with a time traveling debugger
    > - It provides a middleware API, giving you access to tools like redux-sagas
    > - Its React bindings prevent many unnecessary renders
    >
    > As you can see, context is not a replacement for Redux. Context won’t give you time traveling debugging, configurable middleware, or anything more than a way to get data from one place to another. If you want a tool to help you manage your state, then Redux is a great choice.

[^redux-not-dead-yet]:
    <https://blog.isquaredsoftware.com/2018/03/redux-not-dead-yet/#clearing-the-confusion-1>

    > Context also doesn't give you anything like the Redux DevTools, the ability to trace your state updates, middleware to add centralized application logic, and other powerful capabilities that Redux enables.
