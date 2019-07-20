---
title: Redux의 장점과 주의점
category: web
---

[Redux(리덕스)](https://redux.js.org/)를 쓰면 얻을 수 있는 장점 및 사용 시 주의할 점에 대해 살펴봅니다.

## 장점 1: 상태 관리의 편의성

Redux는 전역 자바스크립트 변수([스토어(Store)](https://redux.js.org/glossary#store))를 통해 상태를 한 곳에서 관리하는데, 이를 **중앙화**라 합니다. 중앙화로 인해 상태를 한 곳에서 편리하게 관리할 수 있습니다.

**상태**는 웹 사이트에서 현재를 위해 필요한 정보를 뜻합니다. 현재 로그인한 사용자 정보라든가, 현재 사용자가 보고 있는 [탭](https://react-bootstrap.github.io/components/tabs/)이 어떤 것인지에 대한 정보가 이에 해당합니다. 상태는 그저 값에 불과하기 때문에 숫자, 문자열, 객체 등 어떠한 타입으로도 표현할 수 있습니다. 상태의 위치 또한 제한이 없습니다. 변수, HTML 엘리먼트의 [`data-*` 애트리뷰트](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes), (리액트(React)를 쓴다면) 리액트의 [state](https://reactjs.org/docs/glossary.html#state) 등 어느 곳에서나 존재할 수 있습니다.

상태를 중앙화하는 것으로 인해 다음과 같은 이점을 얻을 수 있습니다:

- **더 이상 웹 사이트의 상태를 어디에 둘지 고민하지 않아도 됩니다.** 가령 로그인한 사용자의 레벨을 상단 메뉴에도 출력하고 본문에도 출력해야 할 때 상태 정보를 어디에 둘지 생각해봅시다. 상단 메뉴 엘리먼트와 본문 엘리먼트에 각각 `data-*` 애트리뷰트로 둘까요? 아니면 전역 변수? 리액트를 쓴다면 문제는 더 복잡해지는데, 부모 컴포넌트로부터 [props](https://reactjs.org/docs/glossary.html#props)를 통해 단계 별로 물려받도록 구성해야 합니다.
- 웹 사이트에 다시 접속했을 때를 대비해 **쉽게 상태를 저장하거나 불러올** 수 있습니다. 상태 정보가 여기저기 흩어져 있다면, 각 상태마다 저장하는 기능을 구현해야 하는 불편함이 있습니다.
- 디버깅 시 웹 사이트의 모든 상태를 한눈에 확인할 수 있습니다. 상태를 중앙화하지 않을 경우 웹 사이트의 현재 상태가 어떤지를 한눈에 확인하기 어렵습니다. 상태 데이터를 하나 하나 뒤져야 합니다. 

## 장점 2: 변경 과정 기록 및 실행 취소

Redux는 **상태를 읽기 전용으로 취급**하며, **액션과 리듀서라는 일정한 방법을 통해서만 상태 변경을 허용**합니다. 액션과 리듀서만 상태를 변경할 수 있으므로 이들의 동작을 계속 주시한다면 **상태가 변경되는 과정을 모두 추적**할 수 있고, 원한다면 이전 상태로 돌아가 현재까지 했던 상태의 변경을 취소할 수도 있습니다.

이로 인해 다음과 같은 이점을 얻을 수 있습니다:

- 라이브러리([Redux Undo](https://redux.js.org/recipes/implementing-undo-history#using-redux-undo))만 적용하면 실행 취소 기능을 힘들이지 않고 구현할 수 있습니다.

## 장점 3: 재실행 시 동일 결과 보장

Redux는 상태를 변경하는 과정([리듀서(Reducer)](https://redux.js.org/glossary#reducer))에서 **부수 효과(side effect)가 일어나지 않도록 코딩하기를 요구**하며, 이와 함께 상태를 어떻게 변경할지에 대한 정보([액션(Action)](https://redux.js.org/glossary#action)) 또한 언제든지 다시 만들어낼 수 있도록 **JSON 형태로 구성하기를 강제**합니다. 이를 통해 상태 변경([액션](https://redux.js.org/glossary#action))을 재실행하는 경우에도 JSON으로 저장해둔 상태 변경 정보만 있으면 동일한 결과가 나오게 됩니다.

**부수 효과**란, 함수가 실행될 때 함수의 매개변수가 아닌 다른 값에 따라 값이 바뀔 수 있는 것을 의미합니다. 바꿔 말하면, 부수 효과가 없는 함수는 매개 변수가 바뀌지 않는 한 언제나 동일한 결과를 반환해야 합니다. 함수 내부에서 [`XMLHttpRequest`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest), [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)를 사용할 경우 가져오는 데이터가 바뀌거나, 그 사이에 서버가 죽어 최종적으로 함수의 반환값이 바뀔 수 있으므로 부수 효과가 있다고 여깁니다. [`Math.random()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random), [`Date.now()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now)를 사용하는 것 역시 함수를 언제 호출하냐에 따라 다른 결과를 반환하기 때문에 부수 효과가 있습니다[^side-effects].

[^side-effects]:
    <https://redux.js.org/recipes/structuring-reducers/prerequisite-concepts#note-on-immutability-side-effects-and-mutation>
    
    > Other side effects like generating unique IDs or timestamps in a reducer also make the code unpredictable and harder to debug and test.

Redux는 부수 효과가 일어나지 않음을 보장하므로 다음과 같은 이점을 얻을 수 있습니다:

- **상태 변경 과정의 일부를 제외하고서도 재실행할 수 있습니다.** 특히 [Redux DevTools Extension(리덕스 개발자 도구)](http://extension.remotedev.io/)의 Skip 기능이 그러합니다.
- 네트워크 상에서 두 상태를 동일한 상태로 맞추려 할 때, 전체 상태 정보를 넘기지 않고도 여태까지 동작했던 정보(액션)만 넘긴다면 동일한 상태를 만들어낼 수 있습니다. 
- 부수 효과가 일어나지 않는 함수는 유닛 테스팅이 편해집니다[^side-effects].

## 또다른 장점: 리액트와의 유사성

리액트 내부에도 상태라는 개념이 존재하는데, 이 상태 또한 Redux와 마찬가지로 읽기 전용으로 취급하며 일정한 방법([setState()](https://reactjs.org/docs/react-component.html#setstate))을 통해서만 상태를 변경할 수 있도록 합니다. 이러한 성질로 인해 Redux는 리액트의 상태 관리 도구로 애용되고 있습니다.

또한 Redux의 핵심 개발자 중 일부는 실제 리액트의 개발에 참여하고 있기도 합니다.

## 주의점: 개발자의 행위를 제약

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
