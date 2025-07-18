[🏠 방성범 블로그](/README.md) > [🐧 리눅스](/linux.md)

# source, . (점): 셸 스크립트 파일 실행

<time id="published" datetime="2020-04-29">2020. 4. 29.</time>

[배시]\(Bash)에서 `source`와 `.`은 동일한 기능을 하는 명령어로, 셸 스크립트 파일을 실행하는 데 사용합니다.

[배시]: https://linux.die.net/man/1/bash

## 소개

`source`와 `.`은 파일을 실행하는 명령어입니다. 좀 이상하게 생기긴 했지만 `.`도 엄연한 하나의 명령어입니다.

다음과 같이 셸 스크립트 파일을 만듭니다. 여기서는 `asdf.sh`라는 이름으로 만들겠습니다:

```sh
echo Hello
```

다음 명령어로 셸 스크립트를 실행합니다:

```sh
source asdf.sh
. asdf.sh
```

`source`와 `.` 모두 `asdf.sh`를 실행합니다. `Hello`가 두 번 출력되는 것을 확인할 수 있습니다.

## `source` vs `bash`

`source`(또는 `.`)와 유사한 명령어로 `bash`가 있습니다. 인자로 파일 이름을 주면 셸 스크립트 파일을 실행합니다. 다음과 같이 사용 방법도 같습니다:

```sh
source asdf.sh
bash asdf.h
```

이 둘의 차이가 무엇일까요?

### 역할

두 명령어 모두 셸 스크립트 파일을 실행하는 데 사용할 수 있습니다.

### 사용 셸

반면 이 둘은 새로운 셸을 만드는 데 있어 차이를 보입니다.

`source`: **현재 셸**에서 스크립트 파일을 실행합니다.

`bash`: **새로운 셸**을 만들어 스크립트 파일을 실행합니다. 셸에서 선언된 변수나 현재 작업 디렉터리(`cd`를 통해 이동할 수 있는 그것)의 위치는 해당 셸에서만 유효하며, 셸이 종료되면 모두 사라집니다.

이로 인해 몇 가지 차이가 발생합니다. 대표적으로 **환경 변수 유효성**과 **`cd`로 인한 경로 유지**에 관한 차이가 있습니다.

### 환경 변수 유효성

`source`: 스크립트 안에서 선언한 환경 변수를 스크립트 바깥에서 접근할 수 있습니다.

`bash`: 스크립트 안에서 선언한 환경 변수는 스크립트 바깥에서 접근할 수 없으며 스크립트가 끝나면 그대로 소멸합니다. 스크립트 바깥에서의 접근을 원한다면 `export` 명령어를 통해야 합니다.

먼저 `asdf.sh` 파일을 만듭니다:

```sh
TEST_VALUE=123
echo "In file: $TEST_VALUE"
```

이제 이 파일을 다음처럼 실행합니다 (반드시 `bash`가 `source`보다 앞서 등장해야 합니다):

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

### `cd`로 인한 경로 유지

`source`: 스크립트 안에서 `cd`를 실행한 결과가 그대로 유지됩니다.

`bash`: 스크립트 안에서의 `cd`는 스크립트 안에서 유지되지만, 스크립트 바깥에서는 유지되지 않습니다.

먼저 `asdf.sh` 파일을 만듭니다. 이 예시에서는 `/home/ubuntu`에 만들겠습니다. ([`pwd`](https://linux.die.net/man/1/pwd)는 현재 작업 디렉터리를 출력하는 명령어입니다):

```sh
echo "In file 1: $(pwd)"
cd ..
echo "In file 2: $(pwd)"
```

이제 이 파일을 다음처럼 실행합니다. (반드시 `bash`가 `source`보다 앞서 등장해야 합니다):

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

`bash asdf.sh`는 스크립트 파일 내부의 현재 작업 디렉터리를 바꾸었지만, 스크립트 파일 바깥은 연향을 받지 않았습니다. 반면, `source`는 스크립트 파일 바깥에서도 현재 작업 디렉터리에 영향을 주었습니다.

### 요약

|          | 역할               | 사용 셸       | 환경 변수 유효성           | `cd`로 인한 경로 유지       |
| -------- | ------------------ | ------------- | -------------------------- | --------------------------- |
| `source` | 스크립트 파일 실행 | **현재 셸**   | ✔️ 파일 바깥에서 접근 가능 | ✔️ 파일 바깥에서 유지됨     |
| `bash`   | 스크립트 파일 실행 | **새로운 셸** | ❌ 파일 바깥에서 접근 불가 | ❌ 파일 바깥에서 유지 안 됨 |

## `source` vs `.`

### 두 명령어의 기원: C 셸과 본 셸

C 셸(csh)과 본 셸(sh)은 각각 1978년, 1979년 만들어진 오래된 셸입니다. C 셸은 `source`, 본 셸은 `.` 명령어만 지원합니다.

[배시]의 두 명령어는 본 셸과 C 셸로부터 유래한 것으로 보입니다. 이를 통해 [배시]는 오래된 셸들과의 호환성을 확보할 수 있습니다.

### 왜 `source`가 더 권장되는가: fish 셸

[fish 셸](https://fishshell.com/)의 개발자는 `.` 명령어에 대해 **다른 명령어와 혼동되고, 발견하기 어려우며, `.`이라는 명령어를 모르는 사람으로 하여금 `.`을 지칭하거나 소리내어 읽을 수 없다**는 문제가 있음을 지적했습니다. 이로 인해 아예 `.`을 폐기하고 `source`만을 지원하기로 했습니다[^fish-issuecomment].

[^fish-issuecomment]:
    <https://github.com/fish-shell/fish-shell/issues/310#issuecomment-22645318>

    > I think fish simply shouldn't ever have `.`, considering it's confusing (with auto-cd), non-discoverable, and cryptic (if I would see it in code, without knowing about it, I simply couldn't say anything about it). But considering changing `.` to `source` would break lots of scripts, I decided to go with soft deprecation - the `.` command still works, ...

### 두 명령어의 기능이 다른 셸: Z 셸

[Z 셸](http://zsh.sourceforge.net/)(zsh)은 조금 독특합니다.

`source` 명령어의 경우 [배시]처럼 현재 작업 디렉터리에서만 스크립트 파일을 찾는 것에서 끝나지 않습니다. 스크립트 파일을 찾을 수 없다면 `PATH` 환경 변수에 존재하는 경로들로부터도 스크립트 파일을 찾습니다[^zsh-source].

특이하게도 `.`는 `source`와 동일한 동작을 하지 않고 약간 차이가 있습니다. `source`와 반대 순서로 먼저 `PATH` 환경 변수를 찾고 그 다음 현재 작업 디렉터리에서 스크립트 파일을 찾습니다[^zsh-dot].

[^zsh-source]:
    [17 Shell Builtin Commands - zsh](http://zsh.sourceforge.net/Doc/Release/Shell-Builtin-Commands.html)

    > source file [ arg ... ]
    > Same as ‘.’, except that the current directory is always searched and is always searched first, before directories in $path.

[^zsh-dot]:
    [17 Shell Builtin Commands - zsh](http://zsh.sourceforge.net/Doc/Release/Shell-Builtin-Commands.html)

    > . file [ arg ... ]
    > If file does not contain a slash, or if PATH_DIRS is set, the shell looks in the components of $path to find the directory containing file. Files in the current directory are not read unless ‘.’ appears somewhere in $path.

## 혼동 주의: `./asdf.sh`와 `. asdf.sh`

`./asdf.sh`와 `. asdf.sh`를 혼동하지 마세요. `./asdf.sh`는 `bash asdf.sh`와 동일합니다.

## 참고

- [Dot (command) - Wikipedia](<https://en.wikipedia.org/wiki/Dot_(command)>)
- [What is the difference between “source” and “.”? - Ask Ubuntu](https://askubuntu.com/questions/25488/what-is-the-difference-between-source-and): 관련 스택오버플로 질문
- [Bash: using dot or “source” calling another script - what is difference? - Stack Overflow](https://stackoverflow.com/questions/20094271/bash-using-dot-or-source-calling-another-script-what-is-difference): 관련 스택오버플로 질문
- [running script with “. ” and with “source ” - Unix & Linux](https://unix.stackexchange.com/questions/17815/running-script-with-and-with-source): 관련 스택오버플로 질문
