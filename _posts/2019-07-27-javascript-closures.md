---
title: 자바스크립트 클로저
category: web
---

자바스크립트에서 클로저(closure)란 무엇인지, 그리고 클로저를 사용하는 이유에 대해 알아봅니다.

## 클로저가 뭐야

클로저는 다음과 같이 표현할 수 있습니다:

**클로저 = 함수 객체 = 함수 코드 + 함수 생성 시의 스코프 정보**

클로저는 함수 객체의 다른 이름입니다. 함수 객체가 뭘까요? **사실, 함수는 일종의 객체입니다.** 다음과 같이 객체처럼 새로운 값을 추가할 수 있습니다:

```js
function foo() {}
foo.bar = "Hi!";
console.log(foo.bar); // 출력: Hi!
```

이 함수 객체 안에는 다양한 정보가 들어있습니다. 우선 함수가 호출되면 실행할 함수 코드를 가집니다. 특이하게도, 함수 객체 안에는 함수가 생성되었을 당시의 스코프 정보도 있습니다[^functioninitialize]. (함수 코드와 스코프 정보는 보안 상 코드에서 직접 읽거나 쓸 수 없습니다.)

[^functioninitialize]:
    <http://www.ecma-international.org/ecma-262/6.0/#sec-functioninitialize>
    
    > 6. Set the [[Environment]] internal slot of F to the value of Scope.
    > 8. Set the [[ECMAScriptCode]] internal slot of F to Body.

**스코프(scope)란 중괄호(`{}`)로 둘러쌓인 코드의 영역을 뜻합니다.** (몇몇 경우 중괄호가 필요하지 않습니다.) 함수 코드는 중괄호로 둘러쌓여 있으므로 스코프를 형성합니다.

스코프 정보 내부에는 스코프가 가지는 변수 목록에 대한 정보와 스코프를 감싸는 상위 스코프가 들어있습니다. 그러므로 **스코프 정보만 알고 있다면, 스코프 정보가 만들어질 당시의 모든 변수를 알 수 있습니다.**

원래 자바스크립트는 어떤 변수를 만났을 때 스코프 정보를 이용해 변수가 어디 있는지 찾습니다.

스코프와 관련된 추가적인 성질은 [<자바스크립트 var, let 차이점>](2019-07-22-difference-var-let.md)을 참고하세요.

## 클로저가 있으면 좋은 점

클로저는 함수 객체의 다른 이름이고, 함수는 일종의 객체라는 것은 말씀드렸죠? 함수 객체를 가지고 있다는 말은, 곧 함수가 정의될 당시의 스코프 정보를 가지고 있다는 말과 같습니다. 이 스코프 정보를 통해 **참조할 수 없는 위치의 변수를 사용할 수 있습니다:**

```js
function makeHelloFunction() {
  var message = "Hello"; // 참조할 수 없는 위치의 변수
  return function () { // 익명 함수 객체, 즉 클로저를 반환
    console.log(message);
  };
}
var hello = makeHelloFunction();
hello(); // 참조할 수 없는 위치에 있는 message 변수 사용
```

이러한 현상이 마치 변수를 붙잡아두는 것처럼 보이므로, 붙잡아둔다는 뜻을 가진 영어 단어 '캡처(capture)'를 사용해 변수 캡처라고도 부릅니다.

## 참고

- <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures>
