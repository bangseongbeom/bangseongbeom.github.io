---
title: 자바스크립트 var, let 차이점
category: web
---

자바스크립트에서 변수를 선언할 때 사용하는 `var`과 `let`의 차이를 알아봅시다.

## 요약 정리

| 성질 | `var` | `let` |
|---|---|---|
| 스코프 | 가장 가까운 `function` 내부 | 가장 가까운 `function`, `if`, `for`, `while`, `switch` 내부 |
| 호이스팅 | 호이스팅됨 (변수의 선언이 함수 맨 윗부분으로 올라감) | 호이스팅되지 않음 |
| IE 지원 | 모든 버전 | [IE11](https://en.wikipedia.org/wiki/Internet_Explorer_11)에서 사용 가능하지만 `for` 문에서 치명적 버그 존재[^caniuse-let] |

[^caniuse-let]:
    <https://caniuse.com/#feat=let>
    
    > let variables are not bound separately to each iteration of for loops

## 스코프

스코프(scope)란 변수를 사용할 수 있는 영역을 뜻합니다.

**`let`:** 자신이 속한 `function`, `if`, `for`, `while`, `switch` 안에서만 사용할 수 있습니다. 이를 벗어나면 더 이상 그 변수를 사용할 수 없습니다. 주로 **중괄호(`{}`)가 스코프 형성의 기준**이 됩니다. 별로 쓸 일은 없긴 한데, [자바스크립트에서는 그냥 중괄호만 써도 스코프를 형성할 수 있습니다.](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/block)
  
**주의:** `for`의 괄호 부분에서 `let`으로 선언한 변수 역시 `for`의 스코프에 속합니다. `for (let i = 0; i < 10 ; i++)`에서 `let i`은 `for`의 스코프에 속합니다.

**`var`:** 자신이 속한 `function` 안에서만 사용할 수 있습니다. 함수의 중괄호를 벗어나면 더 이상 그 변수를 사용할 수 없습니다. **함수가 스코프 형성의 기준**이 됩니다.

`let`, `var` 둘 다 맨 바깥(전역)에 존재한다면 영원히 살아있습니다.

### 스코프 예제

`if` 내부에 선언된 `let`은 `if` 바깥에서 사용할 수 없습니다:

```js
if (100 > 50) {
  let letVariable = 123;
}
console.log(letVariable); // 오류: ReferenceError
```

`if` 내부에 선언된 `var`는 `if` 바깥에서도 사용할 수 있습니다 (여기서 `var`는 맨 바깥(전역)에 속합니다):

```js
if (100 > 50) {
  var varVariable = 456;
}
console.log(varVariable); // 출력: 456
```

`function` 내부에 선언된 `var`는 바깥에서 사용할 수 없습니다. `let`도 마찬가지입니다:

```js
function func() {
  let letVariable = 123;
  var varVariable = 456;
}
console.log(letVariable); // 오류: ReferenceError
console.log(varVariable); // 오류: ReferenceError
```

### `for`에서 `var`를 사용하면 안 되는 이유

다음 코드는 `i`를 3번 출력합니다(`setTimeout()`으로 출력을 약간 지연시키고 있습니다):

```js
for (var i = 1; i <= 3; i++) { // var 사용
  setTimeout(function () {
    console.log(i); // 출력: ???
  }, 100);
}
```

언뜻 보기에는 `1 2 3`이 출력될 것처럼 보입니다. 하지만 실제로 실행해보면 `4 4 4`가 출력됩니다.

이런 이상한 결과가 나타나는 이유는, 함수 안(여기서는 익명 함수 안)에서 외부에 있는 변수(`i`)를 가져올 때 독특한 절차를 거치기 때문입니다:

- 우리의 상식과는 달리, 함수는 **함수가 실제로 실행될 때에만 변수의 존재를 검증**합니다. 함수가 실행되지 않고 그냥 선언만 되어있을 경우, 없는 변수를 사용해도 아무런 오류가 발생하지 않습니다.
  
  다음 코드는 `foo`라는 변수가 존재하지 않지만, `dontCallMe()` 함수를 실행하지 않기 때문에 오류가 일어나지 않습니다:
  
  ```js    
  function dontCallMe() {
    console.log(foo);
  }
  ```
- 함수가 실행되는 도중 변수를 만나면 그 변수가 어디있는지 차근차근 살펴나갑니다. 먼저 자기 자신에서 변수가 선언되었는지 찾고, 그게 아니면 자기를 감싸는 스코프(중괄호)에서 변수가 선언되었는지 찾고, 이를 계속해서 맨 바깥(전역)까지 찾아본 다음 그래도 없으면 오류를 일으킵니다.
- 앞의 예제에서, 익명 함수는 `i`를 찾을 수 없으니 `for`가 돌아가던 순간의 스코프에서 `i`를 찾아봅니다. 그래도 찾을 수 없습니다. **`i`는 `var`로 선언되었기 때문에 `for`에 존재하는 것이 아니라 맨 바깥(전역)에 존재하기 때문입니다.** 그래서 결국 전역에서 `i`를 발견합니다. 이때 `i`는 `4`인 상태입니다. (`3`이 아닌 이유는 `for`문을 탈출하기 직전 **`i++`에 의해 `4`가 되기 때문**입니다.)

반면 `let`은 `for`가 돌아가던 순간의 스코프에 존재합니다. 다음 코드에서는 `var`를 `let`으로 바꿔 우리가 예상했던 결과인 `1 2 3`을 얻을 수 있습니다:

```js
for (let i = 1; i <= 3; i++) { // let 사용
  setTimeout(function () {
    console.log(i); // 출력: 1 2 3
  }, 100);
}
```

(`let`을 사용하는 것 말고도 [익명 함수를 선언한 뒤 곧바로 호출해 강제로 `var`를 위한 스코프를 만들어 해결하는 방법](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures#Creating_closures_in_loops_A_common_mistake)도 있습니다.)

## 호이스팅

**`let`:** `let`이 등장하는 순간에 변수가 태어나 스코프의 끝에서 죽음을 맞이합니다. `let`이 나오기 전에는 스코프 안이라 할지라도 변수를 사용할 수 없습니다.

**`var`:** `var`가 등장하는 순간에 변수가 태어나는 게 아니라, **`var`가 속한 함수에 이미 그 변수가 태어나 있습니다.** `var`가 등장하기 전에도 스코프 안이라면(함수 안이라면) `var`로 선언된 변수를 사용할 수 있습니다. 이 동작이 마치 변수를 함수의 맨 위로 끌어올리는 것 같다고 하여, 영어로 **'끌어올리기'**라는 뜻을 가진 호이스팅(hoisting)이라 부릅니다.

**주의:** `var`이 등장하기 전에 변수가 태어나는 것은 맞지만, 값까지 초기화가 이루어지는 건 아닙니다. `var varVariable = 456`이라고 할 경우 `var varVariable` 부분만 함수의 맨 위로 끌어올려지고 `variable = 456`은 그 자리에 그대로 남게 됩니다. 

### 호이스팅 예제

`let`은 `let`이 등장하기 전에 사용할 수 없습니다:

```js
console.log(letVariable); // 오류: ReferenceError
let letVariable = 123;
console.log(letVariable); // 출력: 123
```

`var`는 `var`가 등장하기 전에도 사용할 수는 있지만, 초기화가 진행되지 않고 `undefined`만 출력됩니다:

```js
console.log(varVariable); // 출력: undefined
var varVariable = 456;
console.log(varVariable); // 출력: 456
```

### 호이스팅이 존재하는 이유

호이스팅이 존재하는 이유는 **함수 선언** 때문입니다. 호이스팅이 없다면 A 함수에서 B 함수를 호출할 때 B 함수가 코드 순서 상 반드시 먼저 나와야 합니다. 반대로 A함수가 먼저 나오게 되면 B함수를 찾을 수 없으므로 오류가 나오게 됩니다. 호이스팅으로 인해 모든 함수 선언이 코드의 첫부분에 존재하는 것처럼 여겨지므로 우리는 **코드 순서에 상관 없이 함수를 선언할 수 있습니다[^avoid-painful-order].**

[^avoid-painful-order]:
    <https://twitter.com/brendaneich/status/33403701100154880>
    
    자바스크립트의 제작자 Brendan Eich의 트윗
    
    > function declaration hoisting is for mutual recursion & generally to avoid painful bottom-up ML-like order

함수 호이스팅이 없다면 다음 코드는 제대로 동작하지 않을 것입니다:

```js
function a() {
  b();
}
function b() {}
```

함수 호이스팅과 달리 `var` 호이스팅은 별다른 장점이 없습니다. 변수에 초기값이 들어가지도 않았는데 다짜고짜 사용할 수는 없겠죠. 그럼에도 `var`가 호이스팅되는 이유는 초기 자바스크립트가 이러한 점에 대해서 크게 신경쓰지 않고 개발되었기 때문입니다[^implementation-artifact].

[^implementation-artifact]:
    <https://twitter.com/brendaneich/status/562313394431078400>
    
    자바스크립트의 제작자 Brendan Eich의 트윗
    
    > A bit more history: `var` hoisting was an implementation artifact. `function` hoisting was better motivated: ...

이러한 `var`의 호이스팅 문제로 인하여 새로운 버전의 자바스크립트는 `let`을 도입하게 되었습니다.

## IE 지원

인터넷 익스플로러 10(IE10) 이하는 `let`을 지원하지 않습니다. IE11에서 `let`을 지원하기는 하지만, `for` 문에서 루프를 돌 때마다 변수가 만들어지지 않는 치명적인 문제[^caniuse-let]가 있습니다. 

IE에서 `let`을 제대로 사용하기 위해서는 `let`을 `var`로 바꿔주는 변환기가 필요합니다. 유명한 변환기로 [바벨(Babel)](https://babeljs.io/)이 있습니다. [온라인에서 직접 변환해보세요.](https://babeljs.io/repl#?babili=false&browsers=&build=&builtIns=false&spec=false&loose=false&code_lz=GYewTgBAFANgpgFwgSwgXggBgNwogHggEYcUBqMgSggG8AoCCYAVwDsBjBZEViABzDJWCKNXqNG7HgGcQ8AHQwQAcyjJK2BhAC-dLQKEiNdXUA&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=false&fileSize=false&timeTravel=false&sourceType=module&lineWrap=true&presets=es2015%2Creact%2Cstage-2&prettier=false&targets=&version=7.5.5&externalPlugins=)

## `let`과 `const`의 차이

`let`과 `const`의 차이는 변수냐 상수냐의 차이를 제외하고는 완전히 같습니다. `let`은 값을 바꿀 수 있지만 `const`는 그럴 수 없습니다.

다만 객체나 배열같이 값 스스로가 변형될 수 있는 경우 `const`라 할지라도 값이 변형될 수 있습니다. `const foo = {}`라고 해도 `foo.abc = "Hi!"`는 허용됩니다. 완전히 값을 변경할 수 없게 하기 위해서는 [Immutable.js](https://immutable-js.github.io/immutable-js/)같은 라이브러리를 사용해야 합니다.

## 참고

- <https://www.quora.com/Why-does-JavaScript-hoist-variables#wr0IyCg98>
