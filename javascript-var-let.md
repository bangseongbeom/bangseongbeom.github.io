---
lang: ko
categories: [web]
date: 2019-07-22
redirect_from: [/difference-var-let.html]
---

[방성범](/README.md) / [웹](/web.md)

# 자바스크립트 var, let 차이점

자바스크립트에서 변수를 선언할 때 사용하는 `var`, `let`, `const`의 차이와 스코프, 호이스팅에 대해 알아봅시다.

## 요약 정리

| 성질     | `var`                       | `let`                                                                                |
| -------- | --------------------------- | ------------------------------------------------------------------------------------ |
| 스코프   | 가장 가까운 `function` 내부 | 가장 가까운 중괄호 내부                                                              |
| 호이스팅 | 호이스팅됨                  | 호이스팅되지 않음                                                                    |
| IE 지원  | 모든 버전                   | [IE11](https://en.wikipedia.org/wiki/Internet_Explorer_11) (버그 존재[^caniuse-let]) |

[^caniuse-let]: <https://caniuse.com/#feat=let>

    > let variables are not bound separately to each iteration of for loops

## 스코프

스코프(scope)란 **중괄호(`{}`)로 둘러쌓인 코드의 영역**을 뜻합니다. 반드시 중괄호만 스코프를 형성하는 것은 아닙니다. `function`의 경우 괄호 안에 존재하는 매개변수도 스코프에 포함됩니다. `if`나 `for`는 한 줄의 코드만 가질 경우 중괄호 없이 사용할 수도 있습니다.

스코프 안에서 선언된 변수는 스코프 바깥에서 사용할 수 없습니다. 다만 `let`이냐 `var`냐에 따라 기준이 되는 스코프가 다릅니다.

**`let`:** 자신으로부터 가장 가까운 블록 스코프 안에서만 사용할 수 있습니다. 블록 스코프는 `function`, `if`, `for`, `while`, `switch` 등 자바스크립트의 모든 스코프를 의미합니다. 별로 쓸 일은 없긴 하지만, [자바스크립트에서는 그냥 중괄호만 써도 블록 스코프를 형성할 수 있습니다.](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/block)

**`var`:** 자신으로부터 가장 가까운 `function` 스코프 안에서만 사용할 수 있습니다. 함수의 중괄호를 벗어나면 더 이상 그 변수를 사용할 수 없습니다. `function` 스코프 이외의 스코프에는 영향을 받지 않기 때문에, 같은 `function`이기만 하면 `if`나 `for` 안에서 선언된 변수를 밖에서 사용하는 것도 가능합니다.

`let`, `var` 둘 다 맨 바깥(전역)에 존재한다면 어디서든 사용할 수 있습니다.

### 스코프 예제

`function` 내부에 선언된 `var`는 바깥에서 사용할 수 없습니다. `let`도 마찬가지입니다:

```js
function func() {
  let letVariable = 123;
  var varVariable = 456;
}
console.log(letVariable); // 오류: ReferenceError
console.log(varVariable); // 오류: ReferenceError
```

`if` 내부에 선언된 `var`는 `if` 바깥에서도 사용할 수 있습니다 (여기서 `var`는 맨 바깥(전역)에 속합니다):

```js
if (100 > 50) {
  var varVariable = 456;
}
console.log(varVariable); // 출력: 456
```

`for`의 괄호 부분(초기식)에서 `let`으로 선언한 변수는 `for` 스코프에 속합니다. `for` 바깥에서 사용할 수 없습니다:

```js
for (let i = 0; i < 3; i++) {
  console.log(i); // 출력: 0 1 2
}
console.log(i); // 오류: ReferenceError
```

`for`의 괄호 부분(초기식)에서 `var`로 선언한 변수는 `for` 스코프가 아니라 맨 바깥(전역) 스코프에 속합니다. 그러므로 `for` 바깥에서도 사용할 수 있습니다:

```js
for (let i = 0; i < 3; i++) {
  console.log(i); // 출력: 0 1 2
}
console.log(i); // 출력: 3
```

### `for`에서 `var`를 사용하면 안 되는 이유

다음 코드는 `i`를 출력하는 익명 함수를 3개 보관합니다:

```js
var functions = [];

for (var i = 0; i < 3; i++) {
  // var 사용
  functions.push(function () {
    console.log(i);
  });
}

functions[0](); // 출력: 3
functions[1](); // 출력: 3
functions[2](); // 출력: 3
```

언뜻 보기에는 `0 1 2`가 출력될 것처럼 보입니다. 정말 그럴까요? 아닙니다. 실제로 실행해보면 `3 3 3`이 출력됩니다.

반면 `var` 대신 `let`을 경우 예상했던대로 `0 1 2`가 출력됨을 확인할 수 있습니다:

```js
var functions = [];

for (let i = 0; i < 3; i++) {
  // let 사용
  functions.push(function () {
    console.log(i);
  });
}

functions[0](); // 출력: 0
functions[1](); // 출력: 1
functions[2](); // 출력: 2
```

이런 이상한 결과가 나타나는 이유는, 변수를 사용할 때 독특한 절차를 거치기 때문입니다.

먼저, 함수는 함수가 정의될 때의 **변수 자체만 기억**하고 있을 뿐 실제 변수로부터 값을 꺼내오지는 않습니다.

`var i`: `i`가 `var`로 선언되었으므로 `function` 스코프에 하나만 존재합니다. 모든 익명 함수는 `function` 스코프에 존재하는 하나의 `i`만을 가리킬 것입니다.

`let i`: `for` 문의 초기식(`for (a; b; c)` 중 `a` 부분)에 존재하는 `let`의 경우 특수한 작용이 일어납니다. **이 작용은 `for` 루프가 돌 때마다 새로운 `i`를 만들고, 여기에 이전 `i`의 값을 대입합니다[^create-per-iteration-environment].** 이로 인해 각각의 익명 함수는 저마다 다른 `i`를 가리킬 것입니다.

[^create-per-iteration-environment]:
    <http://www.ecma-international.org/ecma-262/6.0/#sec-createperiterationenvironment>

    1.d. 새 루프 스코프(전문 용어로 Lexical Environment)를 생성하고, 1.e. `let` 또는 `const`로 선언된 변수들에 대하여, 1.e.iii. 이전 루프 스코프로부터 변수를 받아온 뒤, 1.e.v. 새 루프 스코프에 넣습니다.

`let`의 이 특수한 작용은 오직 `for` 문의 초기식 안에서만 일어납니다. 다음 코드는 `i`가 하나만 존재하므로 `var`와 똑같이 `3 3 3`이 출력됩니다:

```js
var functions = [];

let i = 0; // for 문 바깥에서 let 사용
for (; i < 3; i++) {
  // 초기식을 비워 둠
  functions.push(function () {
    console.log(i);
  });
}

functions[0](); // 출력: 3
functions[1](); // 출력: 3
functions[2](); // 출력: 3
```

(여기서는 `let`을 통해 동일한 이름의 변수를 여러 개 만드는 식으로 해결했습니다. `let`을 사용하는 것 말고도 [익명 함수를 사용해 강제로 `var`를 여러 개 만들어 해결하는 방법](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures#Creating_closures_in_loops_A_common_mistake)도 있습니다.)

## 호이스팅

변수 선언 이전에도 변수를 사용할 수 있는 현상을 호이스팅(hoisting)이라 합니다.

마치 변수를 스코프의 맨 위로 끌어올리는 것 같다고 하여, 영어로 '끌어올리기'라는 뜻을 가진 호이스팅(hoisting)이라는 이름이 붙었습니다.

**`let`:** 호이스팅이 일어나지 않습니다. `let` 선언 이전에 `let`으로 선언된 변수를 사용하는 것은 불가능합니다.

**`var`:** 호이스팅이 일어납니다. `var` 선언 전에도 스코프 안이라면(함수 안이라면) `var`로 선언된 변수를 사용할 수 있습니다.

### 호이스팅 예제

`let`은 `let`이 등장하기 전에 사용할 수 없습니다:

```js
console.log(letVariable); // 오류: ReferenceError
let letVariable;
letVariable = 123;
console.log(letVariable); // 출력: 123
```

`var`는 `var`가 등장하기 전에도 사용할 수 있습니다:

```js
console.log(varVariable); // 출력: undefined
var varVariable;
varVariable = 456;
console.log(varVariable); // 출력: 456
```

### 주의: 값 초기화

호이스팅으로 인해 값까지 초기화가 이루어지는 건 아닙니다.

`var varVariable = 456`이라고 할 경우, 내부적으로 `var varVariable` 부분만 함수의 맨 위로 끌어올려지고 `variable = 456`은 그 자리에 그대로 남는 식으로 동작합니다:

```js
console.log(varVariable); // 출력: undefined
var varVariable = 456;
console.log(varVariable); // 출력: 456
```

### 호이스팅이 일어나는 이유

왜 호이스팅이 일어날까요? 호이스팅이 있든 없든간에 어차피 변수를 사용하지 못하는 건 똑같은데 말이죠.

우선 알아두어야 하는 사실이 있습니다. `var`로 선언한 변수뿐만 아니라, **함수 역시 호이스팅됩니다.** 그리고 이 호이스팅이라는 기능은 함수를 순서에 상관 없이 선언할 수 있도록 해줍니다.

함수 호이스팅이 없다면 A 함수에서 B 함수를 호출할 때 B 함수가 코드 순서 상 반드시 먼저 나와야 합니다. 반대로 A함수가 먼저 나오게 되면 B함수를 찾을 수 없으므로 오류가 나오게 됩니다. 호이스팅으로 인해 모든 함수 선언이 코드의 첫부분에 존재하는 것처럼 여겨지므로 우리는 **코드 순서에 상관 없이 함수를 선언할 수 있습니다[^avoid-painful-order].**

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

**호이스팅은 변수가 아니라 함수를 위해 존재하는 기능입니다.** 다만 초기 자바스크립트를 설계할 당시 `var`로 변수를 만드나 `function`으로 함수를 선언하나 그냥 대충 뭉뚱그려 처리했기에, `var`를 통한 변수 선언도 호이스팅이 일어나게 되었습니다[^implementation-artifact]. 이러한 `var`의 호이스팅 문제로 인해 새로운 버전의 자바스크립트는 `let`을 도입합니다.

[^implementation-artifact]:
    <https://twitter.com/brendaneich/status/562313394431078400>

    자바스크립트의 제작자 Brendan Eich의 트윗

    > A bit more history: `var` hoisting was an implementation artifact. `function` hoisting was better motivated: ...

## IE 지원

IE10(인터넷 익스플로러 10) 이하는 `let`을 지원하지 않습니다. IE11에서 `let`을 지원하기는 하지만, `for` 문에서 루프를 돌 때마다 변수가 만들어지지 않는 치명적인 문제[^caniuse-let]가 있습니다.

IE에서 `let`을 제대로 사용하기 위해서는 `let`을 `var`로 바꿔주는 변환기가 필요합니다. 유명한 변환기로 [바벨(Babel)](https://babeljs.io/)이 있습니다. [온라인에서 직접 변환해보세요.](https://babeljs.io/repl#?babili=false&browsers=&build=&builtIns=false&spec=false&loose=false&code_lz=GYewTgBAFANgpgFwgSwgXggBgNwogHggEYcUBqMgSggG8AoCCYAVwDsBjBZEViABzDJWCKNXqNG7HgGcQ8AHQwQAcyjJK2BhAC-dLQKEiNdXUA&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=false&fileSize=false&timeTravel=false&sourceType=module&lineWrap=true&presets=es2015%2Creact%2Cstage-2&prettier=false&targets=&version=7.5.5&externalPlugins=)

## `let`과 `const`의 차이

`let`과 `const`는 변수냐 상수냐의 차이를 제외하고는 완전히 같습니다. `let`은 값을 바꿀 수 있지만 `const`는 그럴 수 없습니다.

다만 객체나 배열같이 값 스스로가 변형될 수 있는 경우 `const`라 할지라도 값이 변형될 수 있습니다. `const foo = {}`라고 해도 `foo.abc = "Hi!"`는 허용됩니다. 완전히 값을 변경할 수 없게 하기 위해서는 [Immutable.js](https://immutable-js.github.io/immutable-js/)같은 라이브러리를 사용해야 합니다.

## 참고

- `for`에서의 `let`: <https://noraesae.net/2017/09/14/lexical-scope-in-js-for-loop/>
- `for`에서의 `let`: <https://tailes.tistory.com/30>
- 호이스팅: <https://www.quora.com/Why-does-JavaScript-hoist-variables#wr0IyCg98>
