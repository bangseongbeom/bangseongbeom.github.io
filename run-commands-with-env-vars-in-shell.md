---
categories: [linux]
date_published: 2020-04-25
redirect_from:
  - /run-command-env-vars.html
  - /shell-command-env-vars.html
---

# 셸에서 환경 변수와 함께 명령어를 실행하는 법

`ABC=123 bash asdf.sh`처럼 명령어 앞에 환경 변수를 선언할 수 있습니다. 이렇게 선언된 환경 변수는 해당 명령어를 실행하는 동안에만 유효합니다.

## 선언

명령어 뒤에 `ABC=123`같이 환경 변수들을 배치하는 식으로 선언합니다[^simple-command].

[^simple-command]:
    [bash(1) - Linux manual page](http://man7.org/linux/man-pages/man1/bash.1.html#SHELL_GRAMMAR)

    > A simple command is a sequence of optional variable assignments followed by blank-separated words and redirections, ...

`asdf.sh`를 만듭니다:

```sh
echo $ABC
```

다음 명령어를 실행합니다:

```sh
ABC=123 bash asdf.sh
```

`123`이 출력되는 것을 확인할 수 있습니다.

## 유효 범위

이렇게 선언한 환경 변수는 실행 대상 프로그램 내에서만 유효합니다[^current-shell]. 다음 명령어에서는 이전 명령어와 함께 선언한 환경 변수를 사용할 수 없습니다.

[^current-shell]:
    [bash(1) - Linux manual page](http://man7.org/linux/man-pages/man1/bash.1.html#SIMPLE_COMMAND_EXPANSION)

    > If no command name results, the variable assignments affect the current shell environment.

`asdf.sh`를 만듭니다:

```sh
echo $ABC
```

다음 명령어를 실행합니다:

```sh
ABC=123 bash asdf.sh
```

`123`이 출력되는 것을 확인할 수 있습니다.

이후 입력할 명령어에서도 `ABC`를 계속 사용할 수 있는지 확인해봅시다.

다음 명령어를 실행합니다:

```sh
echo $ABC
```

아무 것도 출력되지 않습니다.

## 주의: 명령어 내에서 환경 변수 사용 불가능

명령어 텍스트 내에서는 함께 선언한 환경 변수를 사용할 수 없습니다. `ABC=123`이라는 환경 변수 선언과 함께 `echo $ABC`를 실행한다고 해서 `$ABC`가 `123`으로 해석되지 않습니다. 함께 선언한 환경 변수는 우선 내부적으로 보관한 뒤, 실행 대상 프로그램을 실행할 때가 되서야 환경 변수를 추가되는 식으로 동작하기 때문입니다[^environment-executed]. 즉 '환경 변수 보관' → '환경 변수 해석' → '대상 프로그램 실행' 순으로 진행합니다.

[^environment-executed]:
    [bash(1) - Linux manual page](http://man7.org/linux/man-pages/man1/bash.1.html#SIMPLE_COMMAND_EXPANSION)

    > 1. The words that the parser has marked as variable assignments (those preceding the command name) and redirections are saved for later processing.
    > 2. The words that are not variable assignments or redirections are expanded.
    >
    > ... the variables are added to the environment of the executed command ...

다음 명령어를 실행합니다:

```sh
ABC=456 echo $ABC
```

위의 명령어는 아무 것도 출력하지 않습니다. `ABC` 환경 변수의 할당은 `$ABC`에 대한 해석이 완료된 후에야 진행하기 때문입니다.

환경 변수 할당 이후에 명령어를 실행하고 싶다면 다음과 같이 해야 합니다:

```sh
ABC=456 bash -c 'echo $ABC'
```

앞의 예시와 달리 `$ABC`가 바로 해석되지 않고, 그저 `bash` 프로그램을 실행하면서 `'echo $ABC'`라는 문자열을 함께 전달합니다. `bash`에 `ABC` 환경 변수가 전달되므로 `bash`는 `echo $ABC`를 실행하면서 `ABC`의 값인 456을 출력합니다.

## 주의: 실행 대상 없이 환경 변수만 선언

별다른 실행 대상 프로그램 없이 환경 변수만을 선언할 경우, 즉 `ABC=123 bash asdf.sh`가 아니라 `ABC=123`만 입력할 경우, 이 환경 변수는 해당 실행 대상에서만 유효한 게 아니라 현재 셸 환경 **전체**에서 유효하게 됩니다[^current-shell-environment-executed].

[^current-shell-environment-executed]:
    [bash(1) - Linux manual page](http://man7.org/linux/man-pages/man1/bash.1.html#SIMPLE_COMMAND_EXPANSION)

    > If no command name results, the variable assignments affect the current shell environment. Otherwise, the variables are added to the environment of the executed command and do not affect the current shell environment.

`asdf.sh`를 만듭니다:

```sh
echo $ABC
```

다음 명령어를 실행합니다:

```sh
ABC=123 bash asdf.sh
```

`123`이 출력되는 것을 확인할 수 있습니다.

이제 다음 명령어를 실행합니다:

```sh
echo $ABC
```

아무 것도 출력되지 않습니다. `ABC`는 `bash asdf.sh`를 실행하는 동안만 유효하기 때문입니다.

이번에는 `bash asdf.sh` 없이 `ABC=123`만 입력합니다:

```sh
ABC=123
```

이제 `ABC`는 현재 셸에서라면 계속 유효합니다.

정말 그런지 확인해봅시다. 다음 명령어를 실행합니다:

```sh
echo $ABC
```

`123`이 출력됩니다. `ABC`가 셸 환경 전체에서 유효하도록 선언되었으므로, `ABC`를 출력할 수 있습니다.

### 유효 범위와 제어 연산자

`;`, `&&`, `||`같은 제어 연산자로 인해 여러 부분 명령어로 나뉘어질 수 있는 경우, 환경 변수는 각 부분 명령어(매뉴얼에서는 단순 명령어라고 합니다)에만 적용됩니다[^simple-command-variables].

환경 변수 선언 부분과 실행 대상 프로그램을 잘못 분리하면 자칫 **실행 대상 없이 환경 변수만 선언**한 것처럼 해석될 수도 있습니다.

[^simple-command-variables]:
    [bash(1) - Linux manual page](http://man7.org/linux/man-pages/man1/bash.1.html#SIMPLE_COMMAND_EXPANSION)

    > When a simple command is executed, ...
    >
    > ... the variables are added to the environment of the executed command ...

아래 두 명령어는 서로 다른 명령어입니다:

```sh
ABCDEF=123 echo $ABCDEF
```

```sh
ABCDEF=123; echo $ABCDEF
```

위 명령어는 아무 것도 출력되지 않는 반면, 아래 명령어는 `123`이 출력됩니다.

첫 번째 명령어와 달리 두 번째 명령어는 `;`이라는 제어 연산자로 분리되어 있습니다. 이로 인해 셸은 `ABCDEF=123`과 `echo $ABCDEF`를 각각 별개의 명령으로 바라봅니다. `ABCDEF=123`의 경우 별다른 실행 대상 프로그램 없이 환경 변수만을 선언한 것이므로, 이 환경 변수는 셸 환경 전체에서 유효하게 됩니다. 그러므로 다음 명령인 `echo $ABCDEF`에서도 `ABCDEF`를 출력할 수 있습니다.

`ABCDEF`는 이후에도 계속 유효하니, `echo $ABCDEF`를 실행하면 또다시 `123`을 출력합니다.

> [!NOTE]
> 앞 예시에 `ABCDEF=123 || echo $ABCDEF`같이 `;`(세미콜론) 대신 `||`(OR 제어 연산자)를 사용하면 **아무 것도 출력되지 않습니다.** 다음 두 이유 때문입니다:
>
> - 실행 대상 없이 환경 변수만 선언한 경우 해당 명령은 성공한 것으로 간주합니다[^status-of-zero].
> - `||` 제어 연산자는 첫 번째 명령의 실행에 성공할 경우 두 번째 명령을 아예 실행조차 하지 않습니다[^or-list].
>
> 물론 `echo $ABCDEF`가 실행되지 않은 것일 뿐, `ABCDEF=123`은 제대로 셸 전체 영역에 선언된 것이 맞습니다. 이후 다시 `echo $ABCDEF`를 실행하면 `123`이 출력됩니다.

[^status-of-zero]:
    [bash(1) - Linux manual page](http://man7.org/linux/man-pages/man1/bash.1.html#SIMPLE_COMMAND_EXPANSION)

    > If there were no command substitutions, the command exits with a status of zero.

[^or-list]:
    [bash(1) - Linux manual page](http://man7.org/linux/man-pages/man1/bash.1.html#SHELL_GRAMMAR)

    > An OR list has the form
    >
    >     command1 || command2
    >
    > command2 is executed if, and only if, command1 returns a non-zero exit status.

> [!NOTE]
> 앞 예시에 `ABCDEF=123 | echo $ABCDEF`같이 `;`(세미콜론) 대신 `|`(파이프)를 사용하면 **아무 것도 출력되지 않습니다.** `|`로 인해 쪼개진 부분 명령어들은, 이들이 모두 현재 셸 환경에서 실행되는 것이 아니라 각각 개별적인 환경에서 실행되기 때문입니다[^pipeline].
>
> 즉 `ABCDEF=123`은 개별 환경에 선언된 것이지 현재 셸에 선언된 것이 아닙니다. 이후 `echo $ABCDEF`를 실행해도 아무런 결과가 나오지 않습니다.

[^pipeline]:
    [bash(1) - Linux manual page](http://man7.org/linux/man-pages/man1/bash.1.html#SHELL_GRAMMAR)

    > Each command in a pipeline is executed as a separate process (i.e., in a subshell).

## 참고

- [Why is setting a variable before a command legal in bash?](https://unix.stackexchange.com/questions/126938/why-is-setting-a-variable-before-a-command-legal-in-bash): 관련 스택오버플로 질문
