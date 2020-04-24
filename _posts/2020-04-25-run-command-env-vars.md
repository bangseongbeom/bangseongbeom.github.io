---
title: 환경 변수 선언과 함께 명령어를 실행하는 법
category: linux
---

`FOO=123 bash bar.sh`처럼 명령어 앞에 환경 변수를 선언해 환경 변수와 함께 명령어를 실행할 수 있습니다.

[`bash 매뉴얼`](http://man7.org/linux/man-pages/man1/bash.1.html)에서는 기본적으로 변수 할당과 함께 명령어를 실행할 수 있음[^simple-command]을 언급하고 있습니다.

[^simple-command]: [bash(1) - Linux manual page](http://man7.org/linux/man-pages/man1/bash.1.html#SHELL_GRAMMAR)

    > A simple command is a sequence of optional variable assignments followed by blank-separated words and redirections, ...

{% include example.html %}

`bar.sh`를 만듭니다:

```sh
echo $FOO
```

다음 명령어를 실행합니다:

```sh
FOO=123 bash bar.sh
```

`123`이 출력되는 것을 확인할 수 있습니다.

{% include endexample.html %}

## 주의: 명령어 내에서 환경 변수 바로 사용

상식적으로는 동작할 것 같지만, 의외로 명령어 텍스트 내에서는 환경 변수를 사용할 수 없습니다. 함께 선언한 환경 변수는 우선 내부적으로 보관한 뒤, 변수를 해석해야 하는 부분을 모두 해석하고, 실행 대상 프로그램을 실행할 때가 되서야 환경 변수를 추가되는 식으로 동작하기 때문입니다[^environment-executed]. 즉 '환경 변수 보관' → '환경 변수 해석' → '대상 프로그램 실행' 순으로 진행합니다.

[^environment-executed]: [bash(1) - Linux manual page](http://man7.org/linux/man-pages/man1/bash.1.html#SIMPLE_COMMAND_EXPANSION)

    > 1. The words that the parser has marked as variable assignments (those preceding the command name) and redirections are saved for later processing.
    > 2. The words that are not variable assignments or redirections are expanded.
    >
    > ... the variables are added to the environment of the executed command ...

{% include example.html %}

다음 명령어를 실행합니다:

```sh
ABC=456 echo $ABC
```

위의 명령어는 아무 것도 출력하지 않습니다. `ABC` 환경 변수의 할당은 `$ABC`에 대한 해석이 완료된 후에야 진행하기 때문입니다.

{% include endexample.html %}

{% include example.html %}

환경 변수 할당 이후에 명령어를 실행하고 싶다면 다음과 같이 해야 합니다:

```sh
ABC=456 bash -c 'echo $ABC'
```

앞의 예시와 달리 `$ABC`가 바로 해석되지 않고, 그저 `bash` 프로그램을 실행하면서 `'echo $ABC'`라는 문자열을 함께 전달합니다. `bash`에 `ABC` 환경 변수가 전달되므로 `bash`는 `echo $ABC`를 실행하면서 `ABC`의 값인 456을 출력합니다.

{% include endexample.html %}

## 주의: 실행 대상 없이 환경 변수만 선언

별다른 실행 대상 프로그램 없이 환경 변수만을 선언할 경우, 즉 `FOO=123 bash bar.sh`가 아니라 `FOO=123`만 입력할 경우, 이 환경 변수는 해당 실행 대상에서만 유효한 게 아니라 현재 셸 환경 전체에서 유효하게 됩니다[^current-shell].

[^current-shell]: [bash(1) - Linux manual page](http://man7.org/linux/man-pages/man1/bash.1.html#SIMPLE_COMMAND_EXPANSION)

    > If no command name results, the variable assignments affect the current shell environment.  Otherwise, the variables are added to the environment of the executed command and do not affect the current shell environment.

{% include example.html %}

`bar.sh`를 만듭니다:

```sh
echo $FOO
```

다음 명령어를 실행합니다:

```sh
FOO=123 bash bar.sh
```

`123`이 출력되는 것을 확인할 수 있습니다.

이제 다음 명령어를 실행합니다:

```sh
echo $FOO
```

아무 것도 출력되지 않습니다. `FOO`는 `bash bar.sh`를 실행하는 동안만 유효하기 때문입니다.

이번에는 `bash bar.sh` 없이 `FOO=123`만 입력합니다:

```sh
FOO=123
```

이제 `FOO`는 현재 셸에서라면 계속 유효합니다.

정말 그런지 확인해봅시다. 다음 명령어를 실행합니다:

```sh
echo $FOO
```

`123`이 출력됩니다. `FOO`가 셸 환경 전체에서 유효하도록 선언되었으므로, `FOO`를 출력할 수 있습니다.

{% include endexample.html %}

## 환경 변수의 유효 범위

명령어와 함께 하는 환경 변수는 `|`, `;`, `&&`같은 제어 연산자의 사이를 뛰어넘지 못합니다. 제어 연산자 없는 단순 명령어 내에서만 적용되기 때문입니다[^simple-command-variables].

[^simple-command-variables]: [bash(1) - Linux manual page](http://man7.org/linux/man-pages/man1/bash.1.html#SIMPLE_COMMAND_EXPANSION)

    > When a simple command is executed, ...
    >
    > ... the variables are added to the environment of the executed command ...

{% include example.html %}

아래 두 명령어는 서로 다른 명령어입니다:

```sh
FOOBAR=123 echo $FOOBAR
```

```sh
FOOBAR=123; echo $FOOBAR
```

위 명령어는 아무 것도 출력되지 않는 반면. 아래 명령어는 `123`이 출력됩니다.

첫 번째 명령어와 달리 두 번째 명령어는 `;`이라는 제어 연산자로 분리되어 있습니다. 이로 인해 셸은 `FOOBAR=123`과 `echo $FOOBAR`를 각각 별개의 명령으로 바라봅니다. `FOOBAR=123`의 경우 별다른 실행 대상 프로그램 없이 환경 변수만을 선언한 것이므로, 이 환경 변수는 셸 환경 전체에서 유효하게 됩니다. 그러므로 다음 명령인 `echo $FOOBAR`에서도 `FOOBAR`를 출력할 수 있습니다.

`FOOBAR`는 이후에도 계속 유효하니, `echo $FOOBAR`를 실행하면 또다시 `123`을 출력합니다.

{% include endexample.html %}

## 참고

- [Why is setting a variable before a command legal in bash?](https://unix.stackexchange.com/questions/126938/why-is-setting-a-variable-before-a-command-legal-in-bash): 관련 스택오버플로 질문
