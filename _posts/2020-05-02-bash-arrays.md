---
title: 배시 배열
category: linux
redirect_from: /shell-arrays.html
---

배열을 통해 여러 값을 효과적으로 다룰 수 있습니다.

---

[배시](https://www.gnu.org/software/bash/manual/html_node/index.html)(Bash)는 여느 프로그래밍 언어와 같이 배열 기능을 제공합니다. 배열은 여러 값을 하나의 변수에 보관할 수 있도록 해줍니다. 새로운 값을 추가하거나 이미 존재하는 값을 수정 또는 삭제할 수 있습니다.

## 생성

배열을 생성하는 방법은 **두 가지**가 있습니다.

**방법 1:** 괄호를 통한 방법입니다. `변수이름=(값1 값2 값3)` 형태를 가집니다[^way-1]. **배열의 값을 띄어쓰기로 구분함에 주의하세요.** 이 방법은 여러 값을 한 줄로 집어넣을 때 편리합니다.

[^way-1]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > Arrays are assigned to using compound assignments of the form

    > ```sh
    > name=(value1 value2 … )
    > ```

{% include example.html %}

```sh
ASDF=(100 200 Hello)
```

{% include endexample.html %}

{% include note.html %}

다른 프로그래밍 언어와 달리, 배시에서는 `=` 좌우에 띄어쓰기가 있으면 안 됩니다:

```sh
ASDF = (100 200 Hello)  # 잘못됨!
```

위 코드를 실행하면 다음과 같이 오류를 출력합니다:

```
-bash: syntax error near unexpected token `('
```

{% include endnote.html %}

**방법 2:** 값을 여러 줄에 걸쳐 집어넣는 방법입니다. `변수이름[0]=값1`, `배열이름[1]=값2` 형태를 가집니다[^way-2].

배열의 값들은 순서를 가지고 있으므로 값들의 순서를 변수 이름 오른쪽 대괄호(`[]`) 안에 넣습니다. **0부터 시작합니다.** 1번째는 `ASDF[0]`, 12번째는 `ASDF[11]`입니다.

[^way-2]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > each value is of the form `[subscript]=string`.

{% include example.html %}

```sh
ASDF[0]=100
ASDF[1]=200
ASDF[2]=Hello
```

{% include endexample.html %}

다른 프로그래밍 언어와 달리, 배시는 **방법 2**와 같이 값을 여러 줄에 걸쳐 배열에 집어넣을 때 **이것이 배열임을 선언할 필요가 없습니다.** `ASDF`가 아예 존재하지 않는 경우  배시는`ASDF`를 배열로 만듭니다.

{% include note.html %}

파이썬이라는 프로그래밍 언어에서는 값을 여러 줄에 걸쳐 배열에 집어넣을 때 다음처럼 배열을 사용하기 전에 미리 선언해야 합니다:

```py
asdf = []  # 배열 선언
asdf[0] = 100
asdf[1] = 200
asdf[2] = "Hello"
```

(방법 1과 같이 여러 값을 한 줄에 집어넣는 경우라면 파이썬도 배시와 유사하게 할 수 있습니다. 파이썬은 선언과 값 추가를 동시에 한 줄로 할 수 있는 기능을 제공합니다.)

{% include endnote.html %}

## 변경

`ASDF[0]=123`처럼 배열의 특정 순서에 존재하는 값을 다른 값으로 변경할 수 있습니다.

{% include example.html %}

```sh
ASDF[3]=Hello
ASDF[3]=World # Hello를 World로 변경
```

{% include endexample.html %}

## 배열 끝 추가

...

## 획득

`${ASDF[0]}`, `${ASDF[1]}` 처럼 `${}`를 붙여 배열에 들어있는 값 중 하나를 얻을 수 있습니다.

{% include example.html %}

```sh
ASDF=(100 200 Hello)

echo $ASDF[0]
echo $ASDF[2]
echo $ASDF[2]
echo $ASDF[1]
```

출력 결과:

```
100
Hello
Hello
200
```

{% include endexample.html %}

### 중괄호를 붙여야 하는 이유

`$ASDF[0]`처럼 중괄호를 빼면 안 됩니다. 반드시 `${ASDF[0]}`처럼 중괄호(`{}`)를 붙여 **값 획득의 적용 대상이 대괄호(`[]`)까지**라는 것을 명시해주어야 합니다. 배시에는 대괄호를 사용하는 연산자가 이미 있습니다[^braces-are-required]. 대괄호 없이 `$ASDF[0]`처럼 한다면 배시는 `$ASDF`와 `[0]`으로 나누어 인식합니다.

[^braces-are-required]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > The braces are required to avoid conflicts with the shell’s filename expansion operators.

## 특수 성질: `ASDF`는 `ASDF[0]`과 같다

배시에서는 `ASDF`처럼 대괄호(`[]`) 없이 배열에 접근하려 하면 **배열의 첫 번째 값처럼 취급합니다[^without-a-subscript].**

[^without-a-subscript]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > Referencing an array variable without a subscript is equivalent to referencing with a subscript of 0.

이는 배열의 값을 수정할 때, 배열의 값을 출력할 때 모두 적용됩니다. 심지어는 배열이 아직 생성되지 않았을 때의 값 또한 배열의 첫 번째 값처럼 취급합니다.

{% include example.html %}

다음은 배열의 값을 수정할 때 대괄호 없이 접근하는 경우 배열의 첫 번째 값처럼 취급함을 보이는 코드입니다:

```sh
ASDF[0]=123
ASDF[1]=456
ASDF=Hello
echo ${ASDF[0]}
```

`Hello`가 출력됩니다.

{% include endexample.html %}

{% include example.html %}

다음은 배열의 값을 출력할 때 대괄호 없이 접근하는 경우 배열의 첫 번째 값처럼 취급함을 보이는 코드입니다:

```sh
ASDF[0]=11111
ASDF[1]=22222
echo $ASDF
```

`11111`이 출력됩니다.

{% include endexample.html %}

{% include example.html %}

다음은 배열이 아직 생성되지 않았을 때에도 배열의 첫 번째 값처럼 취급함을 출력하는 코드입니다:

```sh
ASDF=123
echo ${ASDF[0]}
```

`123`이 출력됩니다.

{% include endexample.html %}

## 전체 값 획득: 왜 `"${ASDF[@]}"`처럼 해야 하는가

`"${ASDF[@]}"`

## 순회

`for` 명령어를 통해 배열의 값 하나 하나에 동일한 연산을 수행할 수 있습니다. 값을 대량으로 변경하거나 모든 값을 출력할 때 사용합니다.

## 제거

`unset` 명령어를 통해 배열의 값을 제거할 수 있습니다. `unset 변수이름[0]`, `unset 변수이름[1]` 형태입니다. `unset 변수이름` 형태로 배열 전체를 제거할 수도 있습니다[^unset].

[^unset]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > The unset builtin is used to destroy arrays. `unset name[subscript]` destroys the array element at index subscript. Negative subscripts to indexed arrays are interpreted as described above. Unsetting the last element of an array variable does not unset the variable. `unset name`, where name is an array, removes the entire array.

{% include example.html %}

다음 코드는 배열의 값을 하나 제거합니다:

```sh
A[5]=123
unset A[5]
```

{% include endexample.html %}

{% include example.html %}

다음 코드는 배열 전체를 제거합니다:

```sh
A=(123 456 789)
unset A
```

{% include endexample.html %}

## 명시적 선언

`declare` 명령어와 `-a` 옵션을 통해 특정 변수를 배열로 선언할 수 있습니다. 이를 **명시적 선언**이라 합니다. `-a`는 "A"rray의 "A"에서 따왔습니다.

{% include example.html %}

```sh
declare -a ASDF
```

```sh
# 선언과 동시에 초기화도 가능
declare -a QWER=(100 200 300)
```

{% include endexample.html %}

{% include note.html %}

명시적으로 배열을 선언하면 컴퓨터로 하여금 해당 변수를 최적화할 수 있는 여지를 줍니다. 이로 인해 속도가 향상될 수도 있습니다[^may-speed-up].

[^may-speed-up]: [Arrays - Advanced Bash-Scripting Guide](https://tldp.org/LDP/abs/html/arrays.html)

    > Adding a superfluous declare -a statement to an array declaration may speed up execution of subsequent operations on the array.

{% include endnote.html %}

## 특수 성질: 음수 순서

## 특수 성질: 값 없는 순서 허용

## 배열의 종류: 인덱스 배열과 연관 배열

배열에는 두 가지 종류가 있습니다.

**인덱스 배열:** 배열의 각 값을 0번부터 순차적으로 접근하는 배열입니다. 앞서 설명했던 모든 내용은 이 인덱스 배열에 대한 설명이었습니다. 일반적으로 '배열'이라고 하면 인덱스 배열을 뜻하는 경우가 많습니다.

**연관 배열:** 배열의 각 값을... 배시 4.0에 새로 추가된...

## 연관 배열 선언

인덱스 배열과 달리, 연관 배열을 사용하기 위해서는 반드시 명시적으로 선언해야 합니다[^the-subscript-is-required].

[^the-subscript-is-required]: [Arrays - Advanced Bash-Scripting Guide](https://tldp.org/LDP/abs/html/arrays.html)

    > When assigning to an associative array, the subscript is required.

## 연관 배열 획득

연관 배열에 들어있는 값 중 하나를 얻습니다.

## 연관 배열 추가

## 연관 배열 수정

연관 배열에 들어있는 값 중 하나를 수정합니다.

## 연관 배열 삭제

## 2차원 배열

배시는 1차원 배열만을 지원합니다. 2차원 배열부터는 

## 참고

- [Arrays - Advanced Bash-Scripting Guide](https://tldp.org/LDP/abs/html/arrays.html)
