---
title: 자바스크립트 클로저
category: web
---

자바스크립트에서 클로저(closure)란 무엇인지, 그리고 클로저를 사용하는 이유에 대해 알아봅니다.

## 함수 객체

클로저가 무엇인지 알아보기에 앞서, 클로저란 함수 객체의 다른 이름이라는 것을 알아야 합니다.

그렇다면 함수 객체가 뭘까요? **사실, 자바스크립트의 함수라는 것은 일종의 객체이기도 합니다.** 다음과 같이 일반적인 자바스크립트 객체처럼 임의의 키를 추가할 수 있습니다:

```js
function foo() {}
foo.bar = "Hi!"; // 임의의 키 추가
console.log(foo.bar); // 임의의 키 사용
```

## 클로저

클로저는 **함수를 구성하는 코드**와, **함수가 생성될 당시의 스코프 환경**으로 구성됩니다[^functioninitialize].

[^functioninitialize]:
    <http://www.ecma-international.org/ecma-262/6.0/#sec-functioninitialize>
    
    > <p>6. Set the [[Environment]] internal slot of F to the value of Scope.</p>
    > <p>8. Set the [[ECMAScriptCode]] internal slot of F to Body.</p>

함수를 구성하는 코드를 클로저가 가진다는 사실은 특별한 것이 아닙니다. 함수 코드를 알고 있어야 함수를 실행할 수 있겠죠.

중요한 것은 **스코프 환경**(공식적으로 Lexical Environment라고 합니다)입니다. 클로저(함수 객체)는 스코프 환경을 알고 있기 때문에, 함수가 생성될 당시의 모든 변수를 기억해두었다가 함수가 호출될 때 사용할 수 있습니다. 심지어 참조할 수 없는 위치에 있더라도 말입니다. 다음과 같이 말이죠:

```js
function makeHelloFunction() {
  var message = "Hello"; // 참조할 수 없는 스코프의 변수
  return function () { // 익명 함수 객체, 즉 클로저를 반환
    console.log(message);
  };
}
var hello = makeHelloFunction();
hello(); // 참조할 수 없는 위치에 있는 message 변수 사용
```

그렇다면 자바스크립트는 함수가 생성될 당시의 변수들을 어떤 방식으로 기억하고 있을까요? 이를 이해하기 위해서는 먼저 스코프에 대해 알아야 합니다.

## 스코프

**스코프**(scope)란 중괄호(`{}`)로 둘러쌓인 코드의 영역을 뜻합니다. `if`, `for`, `function`같이 중괄호를 필요로 하는 구문이라면 스코프를 형성합니다. (`if`, `for` 등의 경우 `if (true) alert(123);`같은 한 줄 문법으로 인해 중괄호를 사용하지 않고도 스코프를 형성할 수 있습니다.)

특정 스코프 안에서 선언된 변수는 스코프 바깥에서 사용할 수 없습니다.

스코프는 계층 구조를 형성합니다. `function` 안에 `for`가 있다면, `for`의 상위 스코프는 `function`입니다.

## 스코프 환경

내부적으로 각 스코프는 **스코프 환경**(Lexical Environment)이라는 것을 형성합니다. 하나의 스코프 환경은 해당 스코프에 존재하는 변수 목록과 상위 스코프의 스코프 환경을 가집니다. **결국 스코프 환경을 알면 스코프가 만들어질 당시의 사용 가능한 모든 변수를 알 수 있습니다.**

스코프의 다른 성질이 궁금하시다면 [<자바스크립트 var, let 차이점>](2019-07-22-difference-var-let.md)을 참고하세요.

## 클로저의 장점

클로저는 함수 객체의 다른 이름이고, 함수는 일종의 객체라는 것은 말씀드렸죠? 그리고 함수 객체에는 함수가 정의될 당시의 스코프 환경이 들어있다는 것도 말씀드렸습니다. 결과적으로 자바스크립트에서는 내부적으로 이 스코프 환경을 이용하여 **참조할 수 없는 변수**를 사용하는 듯한 효과를 보일 수 있습니다. 앞서 언급했던 예시를 다시 보세요:

```js
function makeHelloFunction() {
  var message = "Hello"; // 참조할 수 없는 스코프의 변수
  return function () { // 익명 함수 객체, 즉 클로저를 반환
    console.log(message);
  };
}
var hello = makeHelloFunction();
hello(); // 참조할 수 없는 위치에 있는 message 변수 사용
```

앞의 코드가 동작하는 이유는 `makeHelloFunction()`에서 반환하는 익명 함수 객체에 스코프 환경이 존재하기 때문입니다. 이 익명 함수가 호출되어 `console.log(message)`를 실행하려 할 때, 자바스크립트는 익명 함수 객체에 존재하는 스코프 환경의 변수 목록 중 `message`를 찾습니다.

이러한 현상이 마치 변수를 붙잡아두는 것처럼 보이므로, 붙잡아둔다는 뜻을 가진 영어 단어 '캡처(capture)'를 사용해 **변수 캡처**라고도 부릅니다.

## 참고

- MDN 클로저: <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures>
