---
title: 배시 배열
category: linux
redirect_from: /shell-arrays.html
---

배열을 통해 여러 값을 효과적으로 다룰 수 있습니다.

---

[배시](https://www.gnu.org/software/bash/manual/html_node/index.html)(Bash)는 여느 프로그래밍 언어와 같이 배열 기능을 제공합니다. 배열은 여러 값을 하나의 변수에 보관할 수 있도록 해줍니다. 새로운 값을 추가하거나 이미 존재하는 값을 수정 또는 삭제할 수 있습니다.

## 배열 생성

`변수이름=(값1 값2 값3)` 형태로 배열을 생성합니다[^way-1]. **배열의 값을 띄어쓰기로 구분함에 주의하세요.**

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

{% include example.html invalid=true %}

다른 프로그래밍 언어와 달리, 배시에서는 `=` 좌우에 띄어쓰기가 있으면 안 됩니다:

```sh
ASDF = (100 200 Hello) # 잘못됨!
```

위 코드를 실행하면 다음과 같이 오류를 출력합니다:

```
-bash: syntax error near unexpected token `('
```

{% include endexample.html %}

## 인덱스와 값 얻기

배열을 만들었으니 배열로부터 값을 얻을 수도 있어야겠죠? 배열로부터 값을 얻기 위해서는 먼저 얻고 싶은 값이 몇 번째에 존재하는지 알아야 합니다. 이를 가리켜 **인덱스**라 합니다.

이 인덱스는 특이하게도 1이 아니라 **0부터 시작합니다[^starts-at-zero].** 인덱스가 **5**라면 이는 **6번째**를 뜻하며, 인덱스가 **0**이라면 이는 **1번째**를 뜻합니다.

[^starts-at-zero]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > Indexing starts at zero.

---

배열로부터 값을 얻기 위해서는 `${변수이름[인덱스]}` 형태를 사용합니다.

{% include example.html %}

다음은 배열에 `100`, `200`, `300`을 넣은 뒤 순서대로 출력하는 코드입니다:

```sh
ASDF=(100 200 300)

echo ${ASDF[0]}
echo ${ASDF[1]}
echo ${ASDF[2]}
```

출력 결과:

```
100
200
300
```

{% include endexample.html %}

### [특이한 성질] 중괄호가 필요한 이유

값을 얻기 위해서는 `echo ${ASDF[2]}`처럼 중괄호를 반드시 붙여야 합니다. `echo $ASDF[2]`처럼 중괄호를 빼면 안 됩니다. 중괄호를 붙이지 않으면 배시는 `ASDF[2]`를 통째로 변수로서 인식하지 않고 `ASDF`까지만 인식합니다.

그 이유는 배시에 대괄호를 사용하는 연산자가 이미 있기 때문입니다[^braces-are-required]. 대괄호 없이 `$ASDF[2]`처럼 한다면 배시는 `$ASDF`와 `[2]`로 나누어 인식합니다.

[^braces-are-required]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > The braces are required to avoid conflicts with the shell’s filename expansion operators.

{%include note.html %}

특이하게도 `echo $ASDF[2]`처럼 한다고 해서 오류가 발생하지는 않습니다. 이는 배시에서 `$ASDF`같이 **배열 이름 자체에 접근**하는 것을 허용하고 있기 때문인데요, 자세한 것은 잠시 뒤에 알아보겠습니다.

{%include endnote.html %}

## 값 변경 및 추가

`변수이름[인덱스]=값` 형태로 특정 인덱스에 존재하는 값을 변경합니다. 인덱스에 값이 존재하지 않는다면 새 값을 추가합니다[^way-2].

[^way-2]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > each value is of the form `[subscript]=string`.

{% include example.html %}

다음은 배열에 `100`, `200`, `300`을 넣은 뒤, `100`을 `99999`로 **변경**하는 코드입니다:

```sh
ASDF=(100 200 300)
ASDF[0]=99999
```

{% include endexample.html %}

{% include example.html %}

다음은 `Hello`라는 값 하나만 들어간 배열을 만든 뒤, 여기에 `Linus`와 `Torvalds`를 **추가**하는 코드입니다:

```sh
ASDF=(Hello)
ASDF[1]=Linus
ASDF[2]=Torvalds
```

{% include endexample.html %}

### [특이한 성질] 배열 생성: 암시적 배열 생성

다른 프로그래밍 언어와 달리 [배시]는 배열이 존재하지 않아도 해당 변수에 값을 추가할 수 있습니다. **변수가 배열이 아니라면 배시는 이를 배열로 만듭니다[^created-automatically].**

[^created-automatically]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > An indexed array is created automatically if any variable is assigned to using the syntax
    >
    > ```
    > name[subscript]=value
    > ```

```sh
ASDF[0]=100 # 문제 없음
ASDF[1]=200
```

대부분의 프로그래밍 언어에서는 배열을 먼저 만들어두어야 값을 추가할 수 있습니다. 파이썬이라는 프로그래밍 언어의 경우 다음과 같이 합니다:

```py
asdf = []  # 배열 선언
asdf[0] = 100
asdf[1] = 200
asdf[2] = "Hello"
```

## [특이한 성질] 순서대로 값이 존재하지 않아도 된다

배열에 값을 추가할 때 인덱스 0부터 순서대로 값을 넣지 않아도 됩니다[^nor-contiguously].

[^nor-contiguously]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > nor any requirement that members be indexed or assigned contiguously.

{% include example.html %}

다음은 인덱스 12345에 `99999`를 추가하는 코드입니다:

```sh
ASDF=(100 200 300)
ASDF[12345]=99999
```

{% include endexample.html %}

### 배열 생성: 인덱스 명시

배열을 생성할 때 인덱스 0부터 순서대로 값을 넣기 싫은 경우, `배열이름=([인덱스]=값 [인덱스]=값)` 형태로 인덱스를 지정하여 생성하는 것도 가능합니다[^subscript-is-supplied].

[^subscript-is-supplied]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > where each value is of the form [subscript]=string. ... if the optional subscript is supplied, that index is assigned to;

{% include example.html %}

다음은 인덱스 12345에 `99999`를 추가하는 코드입니다:

```sh
ASDF=(100 200 300)
ASDF[12345]=99999
```

{% include endexample.html %}

## 배열 끝에 추가

`배열이름+=(값1 값2 값3)` 형태로 배열에 값을 추가할 수 있습니다.

{% include example.html %}

다음은 배열을 생성한 뒤 `123`과 `456`을 추가하는 코드입니다:

```sh
ASDF=(Alpha Beta Theta Gamma)
ASDF+=(123 456)
```

{% include endexample.html %}

## 전체 값 얻기

`"${배열이름[@]}"` 형태로 배열에 존재하는 모든 값을 얻을 수 있습니다. **큰따옴표(`"`)에 주의하세요.**

{% include example.html %}

```sh
ASDF=(111 222 333)
echo "${ASDF[@]}"
```

{% include endexample.html %}

### 다른 형태와 비교

`"${배열이름[@]}"`같은 형태 말고도 `@` 대신 `*`를 사용할 수도 있고, 큰따옴표를 빼버릴 수도 있습니다. 이들은 다음과 같은 특징을 가집니다[^at-or-asterisk]:

[^at-or-asterisk]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > If the subscript is ‘@’ or ‘*’, the word expands to all members of the array name. These subscripts differ only when the word appears within double quotes. If the word is double-quoted, ${name[*]} expands to a single word with the value of each array member separated by the first character of the IFS variable, and ${name[@]} expands each element of name to a separate word. When there are no array members, ${name[@]} expands to nothing.

| 명령어 | 중간 결과 | 출력 | 특징 |
|---|---|---|---|
| `echo "${ASDF[@]}"` | `echo "A A" "B   B"` | `A A B   B` | 각 값을 개별적인 문자열로서 취급 |
| `echo "${ASDF[*]}"` | `echo "A A B   B"` | `A A B   B` |  모든 값을 하나의 문자열로서 취급 |
| `echo ${ASDF[@]}` | `echo A A B   B` | `A A B B` | 값이 가진 공백이 무시됨 |
| `echo ${ASDF[*]}` | `echo A A B   B` | `A A B B` | 값이 가진 공백이 무시됨 |

## 배열 순회

`for` 명령어를 통해 배열의 값 하나 하나에 동일한 연산을 수행할 수 있습니다. 값을 대량으로 변경하거나 모든 값을 출력할 때 사용합니다.

## 값 제거

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

## [특이한 성질] 음수 인덱스

## [특이한 성질] 배열 이름 자체로 접근

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

## [특이한 성질] 명시적 선언

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