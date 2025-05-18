---
category: linux
redirect_from: /shell-arrays.html
---

# 배시 배열

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

```sh
ASDF=(100 200 Hello)
```

**공백을 포함한 문자열**은 [배시]의 문법 상 큰따옴표나 작은따옴표로 묶어야 합니다:

```sh
ASDF=("H e l l o" 'w o r l d')
```

다른 프로그래밍 언어와 달리, 배시에서는 `=` 좌우에 띄어쓰기가 있으면 안 됩니다:

```sh
ASDF = (100 200 Hello) # 잘못됨!
```

위 코드를 실행하면 다음과 같이 오류를 출력합니다:

```
-bash: syntax error near unexpected token `('
```

## 값 얻기, 인덱스

배열로부터 값을 하나 얻기 위해서는 `${변수이름[인덱스]}` 형태를 사용합니다.

**인덱스**는 값이 배열의 어디에 위치해있는지를 가리키는 수입니다. 배열을 만들 때 나열한 순서대로 인덱스가 지정됩니다. 인덱스가 **0**이라면 **1번째** 값을, 인덱스가 **1**이라면 **2번째** 값을 의미합니다. (인덱스는 1이 아니라 **0부터 시작**합니다[^starts-at-zero])

[^starts-at-zero]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > Indexing starts at zero.

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

### [특이한 성질] 중괄호가 필요한 이유

값을 얻기 위해서는 `echo ${ASDF[2]}`처럼 중괄호를 **반드시** 붙여야 합니다. `echo $ASDF[2]`처럼 중괄호를 붙이지 않으면, 배시는 `ASDF[2]`를 통째로 변수로서 인식하지 않고 `ASDF`까지만 인식합니다.

그 이유는 대괄호가 특별한 값으로 먼저 취급되기 때문입니다[^braces-are-required]. 대괄호 없이 `$ASDF[2]`처럼 한다면 배시는 `$ASDF`와 `[2]`로 나누어 인식합니다.

[^braces-are-required]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > The braces are required to avoid conflicts with the shell’s filename expansion operators.

{% include note.html %}

`echo $ASDF[2]`처럼 한다고 해서 오류가 발생하지는 않습니다. 이는 배시에서 `$ASDF`같이 **배열 이름 자체에 접근**하는 것을 허용하고 있기 때문인데요, 자세한 내용은 잠시 뒤에 알아보겠습니다.

{% include note.html end=true %}

## 전체 값 얻기

전체 값을 얻는 방법은 다음과 같이 4가지 형태가 있습니다[^at-or-asterisk]:

[^at-or-asterisk]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > If the subscript is ‘@’ or ‘*’, the word expands to all members of the array name. These subscripts differ only when the word appears within double quotes. If the word is double-quoted, ${name[*]} expands to a single word with the value of each array member separated by the first character of the IFS variable, and ${name[@]} expands each element of name to a separate word. When there are no array members, ${name[@]} expands to nothing.

- `${변수이름[@]}`: 인덱스가 들어갈 자리에 `@`
- `${변수이름[*]}`: 인덱스가 들어갈 자리에 `*`
- `"${변수이름[@]}"`: 큰따옴표(`""`)로 묶은 뒤 인덱스가 들어갈 자리에 `@`
- `"${변수이름[*]}"`: 큰따옴표(`""`)로 묶은 뒤 인덱스가 들어갈 자리에 `*`

다음과 같은 배열이 존재한다고 했을 때:

```sh
ASDF[0]="A A"
ASDF[1]="B   B"
```

각 형태 별로 다양한 결과를 보입니다:

| 명령어 | 중간 결과 | 출력 | 공백 | 위험성 | 특징 |
|---|---|---|---|---|---|
| `echo ${ASDF[@]}` | `echo A A B   B` | `A A B B` | 무시됨 | ⚠️ 존재 | 하나의 값에서 공백으로 구분된 각 부분을 개별적인 문자열로서 취급 |
| `echo ${ASDF[*]}` | `echo A A B   B` | `A A B B` | 무시됨 | ⚠️ 존재 | 하나의 값에서 공백으로 구분된 각 부분을 개별적인 문자열로서 취급 |
| `echo "${ASDF[@]}"` | `echo "A A" "B   B"` | `A A B   B` | 보존됨 | 없음 | 각 값을 개별적인 문자열로서 취급 |
| `echo "${ASDF[*]}"` | `echo "A A B   B"` | `A A B   B` | 보존됨 | ⚠️ 존재 | 배열에 존재하는 모든 값을 하나의 문자열로서 취급 |

{% include note.html %}

배시는 개별적으로 취급하는 문자열과 문자열 사이의 공백을 하나로 합치는 성질이 있습니다. 이 성질에 관해서는...

{% include note.html end=true %}

**결론 1:** 배열의 값에 공백이 들어가지 않음을 보장할 수 있다면 `echo ${ASDF[@]}`나 `echo ${ASDF[*]}`을 사용해도 무방합니다.

**결론 2:** 그렇지 않고 얼마든지 공백이 들어갈 수 있다면 각 값을 개별적인 문자열로서 취급하는 `echo "${ASDF[@]}"` 형태를 사용해야 합니다.

## 값 변경 및 추가

`변수이름[인덱스]=값` 형태로 특정 인덱스에 존재하는 값을 변경합니다. 인덱스에 값이 존재하지 않는다면 새 값을 추가합니다[^way-2].

[^way-2]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > each value is of the form `[subscript]=string`.

다음은 배열에 `100`, `200`, `300`을 넣은 뒤, `100`을 `99999`로 **변경**하는 코드입니다:

```sh
ASDF=(100 200 300)
ASDF[0]=99999
```

다음은 `Hello`라는 값 하나만 들어간 배열을 만든 뒤, 여기에 `Linus`와 `Torvalds`를 **추가**하는 코드입니다:

```sh
ASDF=(Hello)
ASDF[1]=Linus
ASDF[2]=Torvalds
```

**공백을 포함한 문자열**은 [배시]의 문법 상 큰따옴표나 작은따옴표로 묶어야 합니다:

```sh
ASDF[0]="Brian Fox"
ASDF[1]='Stephen Bourne'
```

## [특이한 성질] 암시적 배열 생성

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

대부분의 프로그래밍 언어에서는 배열을 먼저 만들어두어야 값을 추가할 수 있습니다. 파이썬이라는 프로그래밍 언어의 경우 다음과 같이 배열을 먼저 선언해야 합니다:

```py
asdf = []  # 배열 선언
asdf[0] = 100
asdf[1] = 200
asdf[2] = "Hello"
```

## [특이한 성질] 순서대로 값이 존재하지 않아도 된다

배시는 다른 몇몇 프로그래밍 언어와 달리 배열에 값을 추가할 때 인덱스 0부터 연속적으로 값을 채워나가지 않아도 됩니다[^nor-contiguously]. 인덱스 0, 인덱스 1, 인덱스 2같이 연속적으로 채우지 않고 인덱스 0, 인덱스 5, 인덱스 123같이 불연속적으로 채울 수도 있습니다.

[^nor-contiguously]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > nor any requirement that members be indexed or assigned contiguously.

다음은 인덱스 12345에 `99999`를 추가하는 코드입니다:

```sh
ASDF=(100 200 300)
ASDF[12345]=99999
```

## [특이한 성질] 인덱스 명시 배열 생성

배열을 생성할 때 `배열이름=([인덱스]=값 [인덱스]=값)` 형태로 인덱스를 지정하여 생성하는 것도 가능합니다[^subscript-is-supplied].

[^subscript-is-supplied]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > where each value is of the form [subscript]=string. ... if the optional subscript is supplied, that index is assigned to;

```sh
ASDF=([10]=100 [0]=200 [2]=300)
```

{% include note.html %}

`(값1 [인덱스]=값2 값3)`처럼 인덱스를 지정하는 것과 지정하지 않는 것을 혼용할 수도 있습니다.

인덱스를 명시하지 않을 경우의 규칙은 언제나 **왼쪽보다 1 더 큰 인덱스**입니다. 다음 코드를 보세요:

```sh
# [3]=Global [4]=World
ASDF=([10]=Welcome [2]=Hello Global World [50]=Bye)
echo ${ASDF[10]}
echo ${ASDF[2]}
echo ${ASDF[3]}
echo ${ASDF[4]}
echo ${ASDF[50]}
```

`Global`은 `[2]=Hello`의 왼쪽에 있으므로 인덱스 3에 할당됩니다. `World`는 `Global`의 인덱스보다 1 더 큰 인덱스 4에 할당됩니다.

실행 결과:

```sh
Welcome
Hello
Global
World
Bye
```

{% include note.html end=true %}

## 배열 끝 값 추가

`배열이름+=(값1 값2 값3)` 형태로 배열에 값을 추가합니다.

다음은 배열을 생성한 뒤 배열 끝에 값을 추가하는 코드입니다:

```sh
ASDF=(Alpha Beta Theta Gamma)
ASDF+=(123)
ASDF+=(456 789)
```

`123`과 `456`, `789`를 추가했습니다.

**단 하나의 값**을 추가한다고 해도 반드시 괄호를 붙여야 합니다. 다음 코드를 보세요:

```sh
ASDF=(Alpha Beta Theta Gamma)
ASDF+=123 # 잘못됨!

echo ${ASDF[0]}
```

배시의 인덱스 없이 배열 이름만으로 배열에 접근하려 하면 배열의 첫 번째 값처럼 해석하는 성질로 인해 `ASDF+=123`은 `ASDF[0]+=123`같이 해석됩니다. `+=`을 배열이 아닌 변수에 사용하면 문자열을 붙이는 방식으로 동작합니다. 

실행 결과:

```sh
Alpha123
```

`ASDF[0]`에 존재하는 `Alpha`와 `123`이 붙어 `Alpha123`이라는 결과가 나왔습니다.

## 배열 합치기

`${ASDF[@]}`를 응용해 두 개의 배열을 하나로 합치는(결합하는) 데 사용할 수도 있습니다.

```sh
AAA=(123 456 789)
BBB=(1 4 7)

CCC=(${AAA[@]} ${BBB[@]})

echo ${CCC[@]}
```

출력 결과:

```
123 456 789 1 4 7
```

앞서 말씀드렸듯 **배열의 값이 공백을 포함할 수도 있다면** `${변수이름[@]}` 대신 큰따옴표가 들어간 `"${변수이름[@]}"`를 사용해야 합니다. 그렇지 않을 경우 여러 공백을 하나로 묶는 배시의 성질로 인해 공백이 모두 무시되며 여러 가지 예기치 않은 결과가 일어날 수 있습니다.

{% include note.html %}

배시는 개별적으로 취급하는 문자열과 문자열 사이의 공백을 하나로 합치는 성질이 있습니다. 이 성질에 관해서는...

{% include note.html end=true %}

다음은 배열의 값이 공백을 포함함에도 불구하고 `${변수이름[@]}`을 사용한 잘못된 코드입니다:

```sh
AAA=("1   1" "2   2")
BBB=("b   b" "B   B")

CCC=(${AAA[@]} ${BBB[@]}) # 잘못됨!

echo ${CCC[@]} # 잘못됨!
```

출력 결과:

```
1 1 2 2 b b B B
```

여러 공백을 하나로 묶는 배시의 성질로 인해 공백이 모두 무시된 것을 확인할 수 있습니다.

다음은 공백을 포함하는 값을 가진 배열에 대해, 제대로 `"${변수이름[@]}"`을 사용한 코드입니다:

```sh
AAA=("1   1" "2   2")
BBB=("b   b" "B   B")

CCC=("${AAA[@]}" "${BBB[@]}")

echo "${CCC[@]}"
```

출력 결과:

```
1   1 2   2 b   b B   B
```

예상 대로 공백이 출력됨을 확인할 수 있습니다.

## 배열 크기 얻기

`${#변수이름[@]}` (`변수이름` 앞에 `#`이 있습니다) 형태로 배열에 들어 있는 값의 개수를 구합니다[^length-of-array].

[^length-of-array]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > ${#name[subscript]} expands to the length of ${name[subscript]}. If subscript is ‘@’ or ‘*’, the expansion is the number of elements in the array.

```sh
ASDF=(123 456 789)
ZXCV=(A B C D E F G)

echo ${#ASDF[@]}
echo ${#ZXCV[@]}
```

실행 결과:

```
3
7
```

배열의 크기는 시작 인덱스부터 마지막 인덱스까지의 길이를 구하는 것이 **아닙니다.** 순전히 배열에 들어 있는 값의 개수를 구합니다.

```sh
ASDF=(123 456 [100]=789)

echo ${#ASDF[@]}
```

실행 결과:

```
3
```

시작 인덱스부터 마지막 인덱스까지의 길이를 구하는 것이었다면 `100`을 출력해야 합니다. `3`을 출력하는 것으로 보아 배열에 들어있는 값의 개수를 구한다는 것을 알 수 있습니다. 

{% include note.html %}

`${#변수이름[1]}`과 같이 길이를 구할 때 `@` 대신 인덱스를 넣을 경우, 배열에 존재하는 값의 개수를 구하는 게 아니라 해당 값의 문자열 길이를 얻습니다:

```sh
ASDF=(Short LongLongLong "  ")
echo ${#ASDF[0]}
echo ${#ASDF[1]}
echo ${#ASDF[2]}
```

실행 결과:

```
5
12
2
```

`Short`는 5글자, `LongLongLong`은 12글자, `"  "`은 2글자이므로 각각 `5`, `12`, `2`가 출력되었습니다.

{% include note.html end=true %}

## 배열 전체 인덱스 얻기

`${!변수이름[@]}` (`변수이름` 앞에 `!`가 있습니다) 형태로 배열이 가진 전체 인덱스 목록을 얻을 수 있습니다[^obtain-the-keys].

[^obtain-the-keys]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > It is possible to obtain the keys (indices) of an array as well as the values. ${!name[@]} and ${!name[*]} expand to the indices assigned in array variable name. The treatment when in double quotes is similar to the expansion of the special parameters ‘@’ and ‘*’ within double quotes.

```sh
ASDF=(123 456 789 [777]=TripleSeven)
echo ${!ASDF[@]}
```

출력 결과:

```
0 1 2 777
```

## 배열 순회

`for` 명령어를 통해 배열의 값 하나 하나에 동일한 연산을 수행할 수 있습니다. 값을 대량으로 변경하거나 모든 값을 출력할 때 사용합니다.

```sh
ASDF=(111 222 333)
for V in "${ASDF[@]}"
do
    echo $V
done
```

출력 결과:

```
111
222
333
```

{% include note.html %}

`for` 명령어에 관한 자세한 내용은...

{% include note.html end=true %}

## 값 제거

`unset` 명령어를 통해 배열의 값을 제거할 수 있습니다. `unset 변수이름[0]`, `unset 변수이름[1]` 형태입니다. `unset 변수이름` 형태로 배열 전체를 제거할 수도 있습니다[^unset].

[^unset]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > The unset builtin is used to destroy arrays. `unset name[subscript]` destroys the array element at index subscript. Negative subscripts to indexed arrays are interpreted as described above. Unsetting the last element of an array variable does not unset the variable. `unset name`, where name is an array, removes the entire array.

다음 코드는 배열의 값을 하나 제거합니다:

```sh
A[5]=123
unset A[5]
```

다음 코드는 배열 전체를 제거합니다:

```sh
A=(123 456 789)
unset A
```

### 값 제거 vs 빈 문자열 대입

배시는 배열에 빈 문자열(길이가 0인 문자열)이 들어가는 것을 정상적인 값의 설정으로 취급합니다[^null-string].

[^null-string]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > The null string is a valid value.

```sh
ASDF=(123 456 789)
ASDF[2]= # 빈 문자열 대입
```

그러므로 빈 문자열을 대입하는 것은 배열에 있는 값을 **제거**하는 게 아니라 그저 빈 문자열로 덮어쓸 뿐입니다.

```sh
ASDF=(123 456 789)
echo "Count:" ${#ASDF[@]}
echo "Get all:" ${ASDF[@]}
ASDF[1]=
echo "Count:" ${#ASDF[@]}
echo "Get all:" ${ASDF[@]}
```

출력 결과:

```
Count: 3
Get all: 123 456 789
Count: 3
Get all: 123  789
```

값이 제거되지 않고 그대로 남아있는 것을 확인할 수 있습니다.

## 음수 인덱스

`ASDF[-1]`과 같이 인덱스 자리에 음수를 사용하면 배열이 가진 마지막 인덱스에서부터 거꾸로 접근합니다. `ASDF[-1]`이 마지막 인덱스입니다[^negative-number].

[^negative-number]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > When assigning to an indexed array, if name is subscripted by a negative number, that number is interpreted as relative to one greater than the maximum index of name, so negative indices count back from the end of the array, and an index of -1 references the last element.

```sh
ASDF=(100 200 300)
echo ${ASDF[-1]} # ASDF[2]와 같음
echo ${ASDF[-2]} # ASDF[1]과 같음
echo ${ASDF[-3]} # ASDF[0]과 같음
```

출력 결과:

```
300
200
100
```

음수 인덱스는 가장 마지막 인덱스부터 거꾸로 접근하기 때문에, 값이 들어있지 않은 인덱스는 아무런 값도 출력하지 않습니다.

다음은 인덱스 9부터 거꾸로 값들을 출력하는 코드입니다:

```sh
ASDF=(100 200 300)
ASDF[9]=1000
echo ${ASDF[-1]} # ASDF[9]와 같음
echo ${ASDF[-2]} # ASDF[8]과 같음
echo ${ASDF[-3]} # ASDF[7]과 같음
```

출력 결과:

```
1000


```

보시는 바와 같이 `${ASDF[-2]}`, `${ASDF[-3]}`은 아무 것도 출력되지 않은 것을 확인할 수 있습니다. 

## [특이한 성질] 배열 이름 자체로 접근

배시에서는 인덱스 없이 배열 이름만으로 배열에 접근하려 하면 **배열의 첫 번째 값처럼 취급합니다[^without-a-subscript].** `ASDF=100`을 `ASDF[0]=100`처럼 처리한다는 소리죠.

[^without-a-subscript]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > Referencing an array variable without a subscript is equivalent to referencing with a subscript of 0.

| 입력 코드 | 처리 코드 |
|---|---|
| `ASDF=100` | `ASDF[0]=100` |
| `echo ${ASDF}` | `echo ${ASDF[0]}` |
| `ASDF=100`<br>`ASDF[1]=200` | `ASDF[0]=100`<br>`ASDF[1]=200` |

배열의 값을 수정할 때, 배열의 값을 출력할 때 모두 적용됩니다. 심지어는 배열이 아직 생성되지 않았을 때의 값 또한 배열의 첫 번째 값처럼 취급합니다.

## [특이한 성질] 명시적 선언

`declare` 명령어와 `-a` 옵션을 통해 특정 변수를 배열로 선언할 수 있습니다. 이를 **명시적 선언**이라 합니다. `-a`는 "A"rray의 "A"에서 따왔습니다.

```sh
declare -a ASDF
```

```sh
# 선언과 동시에 초기화도 가능
declare -a QWER=(100 200 300)
```

{% include note.html %}

명시적으로 배열을 선언하면 컴퓨터로 하여금 해당 변수를 최적화할 수 있는 여지를 줍니다. 이로 인해 속도가 향상될 수도 있습니다[^may-speed-up].

[^may-speed-up]: [Arrays - Advanced Bash-Scripting Guide](https://tldp.org/LDP/abs/html/arrays.html)

    > Adding a superfluous declare -a statement to an array declaration may speed up execution of subsequent operations on the array.

{% include note.html end=true %}

## 연관 배열, 인덱스 배열, 키

2009년 출시된 배시 4.0부터 **연관 배열**(associative array)이라는 새로운 문법이 추가되었습니다[^new-goodies].

[^new-goodies]: [Bash, version 4 - Advanced Bash-Scripting Guide](https://tldp.org/LDP/abs/html/bashver4.html)

    > Chet Ramey announced Version 4 of Bash on the 20th of February, 2009.
    > Among the new goodies:
    >
    > - Associative arrays.

기존 배열과 달리, 연관 배열에는 인덱스가 들어갈 자리에 **문자열**이 들어갑니다. 이 문자열을 가리켜 **키**라고 합니다.

기존의 인덱스를 사용하던 배열은 연관 배열과 구분할 필요가 있으므로 따로 **인덱스 배열**(indexed array)이라고 부릅니다.

## 인덱스 배열 vs 연관 배열

연관 배열의 기본적인 동작 방식은 인덱스 배열과 매우 유사합니다. 다음은 인덱스 배열과 연관 배열에서 제공하는 기능을 비교하는 표입니다:

|| 변경 | 얻기 | 전체 얻기 | 배열 크기 | 제거 |
|---|---|---|---|---|
| **인덱스 배열** | `ASDF[3]=Hello` | `${ASDF[3]}` | `${ASDF[@]}` | `${#ASDF[@]}` | `unset ASDF[3]` |
| **연관 배열** | `ASDF[greeting]=Hello` | `${ASDF[greeting]}` | `${ASDF[@]}` | `${#ASDF[@]}` | `unset ASDF[greeting]` |

다만 연관 배열은 인덱스 배열과는 다른 두 가지 차이점이 존재합니다:

### 명시적 선언 필수

연관 배열과 인덱스 배열에는 한 가지 중요한 차이점이 있습니다. 명시적 선언을 해도 되고 안 해도 되는 인덱스 배열과 달리, 연관 배열을 사용하기 위해서는 반드시 **명시적으로 선언**해야만 합니다[^the-subscript-is-required]. 다음과 같이 선언합니다:

[^the-subscript-is-required]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > When assigning to an associative array, the subscript is required.

```sh
declare -A 변수이름
```

연관 배열 역시 인데스 배열처럼 배열 생성과 함께 값을 추가할 수 있습니다. 다만 인덱스 배열과 달리 **키를 자동으로 지정해주지 않습니다.** 그러므로 다음과 같이 언제나 키를 명시해야 합니다 (앞서 설명한 '인덱스 배열을 생성하면서 인덱스를 명시하는 방법'과 동일한 형태입니다):

```sh
declare -A 변수이름=([키]=값 [키]=값 [키]=값)
```

키를 지정하지 않으면 오류가 발생합니다.

다음은 연관 배열을 생성하면서 키를 명시하지 않는 잘못된 코드입니다:

```sh
declare -A ASDF=(123 456 789) # 잘못됨!
```

출력 결과:

```
-bash: ASDF: 123: must use subscript when assigning associative array
-bash: ASDF: 456: must use subscript when assigning associative array
-bash: ASDF: 789: must use subscript when assigning associative array
```

예상대로 오류가 발생한 것을 확인할 수 있습니다.

### 키에는 순서가 없다

인덱스 배열의 인덱스와 달리, 연관 배열의 키에는 **순서가 없습니다.** 그렇기 때문에 전체 값을 얻을 때에도 어떤 순서로 얻게 될지 알 수 없습니다.

다음은 연관 배열의 키에 순서가 없음을 확인하는 코드입니다:

```sh
declare -A ASDF=([aaa]=111 [bbb]=222 [ccc]=333 [ddd]=444 [eee]=555)
echo ${ASDF[@]}
```

출력 결과:

```
111 555 333 222 444
```

연관 배열의 키에는 순서가 없으므로 출력 결과는 실행 환경마다 다를 수 있습니다.

## 2차원 배열

배시는 공식적으로 1차원 배열만을 지원합니다[^one-dimensional]. 2차원 배열을 위한 문법은 제공하지 않습니다.

[^one-dimensional]: [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)

    > Bash provides one-dimensional indexed and associative array variables.

## 참고

- [Arrays - Bash Reference Manual](https://www.gnu.org/software/bash/manual/html_node/Arrays.html)
- [Arrays - Advanced Bash-Scripting Guide](https://tldp.org/LDP/abs/html/arrays.html)
