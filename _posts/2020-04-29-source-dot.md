---
title: "source, . (점): 셸 스크립트 실행 명령어"
category: linux
---

[배시](https://linux.die.net/man/1/bash)(Bash)에서 `source`와 `.`는 동일한 기능을 하는 명령어로, 셸 스크립트를 실행하는 데 사용합니다.

{% include example.html %}

다음과 같이 셸 스크립트 파일을 만듭니다. 여기서는 `asdf.sh`라는 이름으로 만들겠습니다:

```sh
echo Hello
```

다음 명령어로 셸 스크립트를 실행합니다:

```
source asdf.sh
# 한 번 더 실행
. asdf.sh
```

`source`와 `.` 모두 `asdf.sh`를 실행합니다. `Hello`가 두 번 출력되는 것을 확인할 수 있습니다.

{% include endexample.html %}

### `source`와 `.`의 기원: C 셀과 본 셸

C 셸(csh)은 `source`, 본 셸(sh)은 `.` 명령어만 지원합니다.

배시가 제공하는 `source`와 `.`은 본 셸과 C 셸로부터 유래한 것으로 보입니다. 이를 통해 배시는 오래된 셸들과의 호환성을 확보할 수 있습니다.

### 왜 `source`가 `.`에 비해 더 권장되는가: fish 셸

[fish 셸](https://fishshell.com/)은 다양한 부가 기능을 가진 현대적인 셸입니다.

이 셸의 개발자는 `.`이라는 명령어에 대해 **다른 명령어와 혼동되고, 발견하기 어려우며, `.`이라는 명령어를 모르는 사람으로 하여금 `.`을 지칭할 수 없다**는 문제가 있음을 지적했습니다. 이와 함께 아예 `.`을 폐기하고 `source`만을 지원하기로 했습니다[^fish-issuecomment].

[^fish-issuecomment]: <https://github.com/fish-shell/fish-shell/issues/310#issuecomment-22645318>

    > I think fish simply shouldn't ever have `.`, considering it's confusing (with auto-cd), non-discoverable, and cryptic (if I would see it in code, without knowing about it, I simply couldn't say anything about it). But considering changing `.` to `source` would break lots of scripts, I decided to go with soft deprecation - the `.` command still works, ...

### `source`와 `.`의 기능이 다른 셸: Z 셸

[Z 셸](http://zsh.sourceforge.net/)(zsh)은 조금 독특합니다. `source`는 우선 현재 작업 디렉터리를 살핀 뒤, 현재 작업 디렉터리에서 스크립트 파일을 찾을 수 없다면 `PATH` 환경 변수에 존재하는 경로들로부터 스크립트 파일을 찾습니다[^zsh-source]. `.`의 경우 `source`와 동일한 동작을 하지 않고, `source`와 반대 순서로 먼저 `PATH` 환경 변수를 찾고 그 다음 현재 작업 디렉터리에서 스크립트 파일을 찾습니다[^zsh-dot].

[^zsh-source]: [17 Shell Builtin Commands - zsh](http://zsh.sourceforge.net/Doc/Release/Shell-Builtin-Commands.html)

    > source file [ arg ... ]
    > Same as ‘.’, except that the current directory is always searched and is always searched first, before directories in $path.

[^zsh-dot]: [17 Shell Builtin Commands - zsh](http://zsh.sourceforge.net/Doc/Release/Shell-Builtin-Commands.html)

    > . file [ arg ... ]
    > If file does not contain a slash, or if PATH_DIRS is set, the shell looks in the components of $path to find the directory containing file. Files in the current directory are not read unless ‘.’ appears somewhere in $path.

## `source` vs `bash`

공통점: `source`(또는 `.`)와 `bash` 명령어 모두 다음과 같이 셸 스크립트 파일을 실행할 수 있습니다.

```sh
source asdf.sh
bash asdf.h
```

반면 이 둘은 새로운 셸을 만드는 데 있어 차이를 보입니다.

`source`: 현재 셸에서 스크립트를 실행합니다.

`bash`: **새로운 셸을 만들어 스크립트를 실행합니다.** 셸에서 선언된 변수나 현재 작업 디렉터리(`cd`를 통해 이동할 수 있는 그것)의 위치는 해당 셸에서만 유효하며, 셸이 종료되면 모두 사라집니다.

이로 인해 다음과 같은 세부적인 차이가 발생합니다.

`source`: 스크립트 안에서 선언한 환경 변수를 스크립트 바깥에서 접근할 수 있습니다.

`bash`: 스크립트 안에서 선언한 환경 변수는 스크립트 바깥에서 접근할 수 없습니다. 스크립트 바깥에서의 접근을 원한다면 `export` 명령어를 통해야 합니다.

{% include example.html %}

먼저 `asdf.sh` 파일을 만듭니다:

```sh
TEST_VALUE=123
echo "In file: $TEST_VALUE"
```

이제 이 파일을 다음처럼 실행합니다 (반드시 `bash` 먼저 실행해야 합니다):

```sh
bash asdf.sh
echo "bash asdf.sh: $TEST_VALUE"
source asdf.sh
echo "source asdf.sh: $TEST_VALUE"
```

출력 결과:

```
In file: 123
bash asdf.sh:
In file: 123
source asdf.sh: 123
```

`bash`는 `123`이 출력되지 않은 반면, `source`는 `123`이 출력되었습니다. 여기서 우리는 `bash`로 인해 실행한 `asdf.sh`의 경우, 실행이 끝나면 더 이상 변수가 유효하지 않음을 확인할 수 있습니다.

{% include endexample.html %}

`source`: 스크립트 안에서 `cd`를 실행한 결과가 그대로 유지됩니다.

`bash`: 스크립트 안에서의 `cd`는 스크립트 안에서 유지되지만, 스크립트 바깥에서는 유지되지 않습니다.

{% include example.html %}

먼저 `asdf.sh` 파일을 만듭니다. 이 예시에서는 `/home/ubuntu`에 만들겠습니다. ([`pwd`](https://linux.die.net/man/1/pwd)는 현재 작업 디렉터리를 출력하는 명령어입니다):

```sh
echo "In file 1: $(pwd)"
cd ..
echo "In file 2: $(pwd)"
```

이제 이 파일을 다음처럼 실행합니다. (반드시 `bash` 먼저 실행해야 합니다):

```sh
pwd
bash asdf.sh
pwd
source asdf.sh
pwd
```

출력 결과:

```
/home/ubuntu
In file 1: /home/ubuntu
In file 2: /home
/home/ubuntu
In file 1: /home/ubuntu
In file 2: /home
/home
```

`bash asdf.sh`는 스크립트 내부의 현재 작업 디렉터리를 바꾸었지만, 스크립트 파일 바깥은 연향을 받지 않았습니다. 반면, `source`는 스크립트 파일 바깥에서도 현재 작업 디렉터리에 영향을 주었습니다.

{% include endexample.html %}

### `./asdf.sh`

`./asdf.sh`와 `. asdf.sh`를 혼동하지 마세요. `./asdf.sh`는 `bash asdf.sh`와 동일합니다.

## 참고

- [What is the difference between “source” and “.”? - Ask Ubuntu](https://askubuntu.com/questions/25488/what-is-the-difference-between-source-and): 관련 스택오버플로 질문
- [Bash: using dot or “source” calling another script - what is difference? - Stack Overflow](https://stackoverflow.com/questions/20094271/bash-using-dot-or-source-calling-another-script-what-is-difference): 관련 스택오버플로 질문
- [running script with “. ” and with “source ” - Unix & Linux](https://unix.stackexchange.com/questions/17815/running-script-with-and-with-source): 관련 스택오버플로 질문
