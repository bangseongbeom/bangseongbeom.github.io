[🏠 방성범 블로그](/README.md) > [🐍 파이썬](/python.md)

# sys.path, PYTHONPATH: 파이썬 파일 탐색 경로

<time id="published" datetime="2020-04-19">2020. 4. 19.</time>

`import` 문을 통해 다른 파이썬 파일을 불러올 때, 파이썬은 내부적으로 파일을 찾기 위해 [`sys.path`]와 [`PYTHONPATH`]에 있는 경로를 탐색합니다. 이 두 변수를 적절히 수정해 임의의 디렉터리에 있는 파이썬 파일을 손쉽게 불러올 수 있습니다.

[`sys.path`]: https://docs.python.org/3/library/sys.html#sys.path
[`PYTHONPATH`]: https://docs.python.org/3/using/cmdline.html#envvar-PYTHONPATH

## `sys.path`에 `append()`로 경로 추가

[`sys.path`]는 디렉터리의 경로들이 기록된 문자열 리스트입니다. 이 리스트에 경로를 추가하면 해당 경로에 있는 파이썬 파일을 `import` 문으로 불러올 수 있습니다.

먼저 아무 파이썬 파일을 하나 만듭시다. 내용은 상관 없습니다. 이 예시에서는 `/opt/common.py`에 만들겠습니다:

```py
# 아무 내용도 없음
```

이제 `/home/ubuntu/example.py`를 만듭니다:

```py
import sys
sys.path.append("/opt")
import common
```

예시에서 `sys.path.append("/opt")`를 통해 `/opt` 디렉터리를 추가했습니다. 이로 인해 `/opt/common.py`를 `import`할 수 있게 됩니다.

## `sys.path`의 기본값

[`sys.path`]에는 파이썬에 의해 기본적으로 몇 가지 경로가 미리 추가되어 있습니다.

### `.py` 파일이 속한 디렉터리의 절대 경로

[`sys.path`]에는 가장 먼저 `.py` 파일이 속한 디렉터리의 절대 경로가 추가됩니다[^input-script].

[^input-script]:
    [The Module Search Path - The Python Tutorial](https://docs.python.org/3/tutorial/modules.html#the-module-search-path)

    > The directory containing the input script

특정 파이썬 파일을 실행하는 것 대신, **파이썬 인터프리터에서 직접 `print(sys.path)`를 실행**하면 인터프리터를 실행할 당시의 경로(현재 작업 디렉터리)가 [`sys.path`]에 추가됩니다[^current-directory].

[^current-directory]:
    [The Module Search Path - The Python Tutorial](https://docs.python.org/3/tutorial/modules.html#the-module-search-path)

    > (or the current directory when no file is specified)

먼저 테스트 용 파일을 만듭니다. 여기서는 `/home/ubuntu`에 `example.py`라는 이름으로 만들겠습니다:

```py
import sys
print(sys.path)
```

실행 결과:

```
[`'/home/ubuntu'`, ...]
```

리스트의 첫 번째 값으로 `'/home/ubuntu'`가 들어있는 것을 확인할 수 있습니다.

`python3`을 실행해 파이썬 인터프리터에서 다음 내용을 입력합니다:

```py
>>> import sys
>>> print(sys.path)
```

실행 결과 (일부 생략):

```
[`''`, ...]
```

앞의 예시와 달리 빈 문자열인 `''`이 리스트 맨 앞에 존재하는 것을 확인할 수 있습니다. 빈 문자열은 유효한 상대 경로로, 현재 디렉터리를 의미합니다.

### `PYTHONPATH` 환경 변수

[`PYTHONPATH`] 환경 변수에 경로를 추가하면, 파이썬은 이 경로들을 [`sys.path`]에 추가해줍니다.

이를 통해 파이썬 코드 내부에서 뿐만 아니라 파이썬 코드 밖에서도 [`sys.path`]를 조작할 수 있습니다.

[`PYTHONPATH`]에는 [`sys.path`]에 추가할 여러 경로들이 들어갑니다. 리눅스에서는 `/foo:/bar`처럼 `:`로 두 경로를 구분하고, 윈도우에서는 `/foo;/bar`처럼 `;`로 두 경로를 구분합니다. (`PATH` 환경 변수와 동일한 방식)[^pythonpath-format]

[^pythonpath-format]:
    [PYTHONPATH - Python Setup and Usage](https://docs.python.org/3/using/cmdline.html#envvar-PYTHONPATH)

    > The format is the same as the shell’s PATH: one or more directory pathnames separated by os.pathsep (e.g. colons on Unix or semicolons on Windows).

테스트 용 파일을 하나 만듭니다:

```py
import sys
print(sys.path)
```

다음과 같이 [`PYTHONPATH`] 환경 변수에 `/foo`와 `/bar`를 넣은 채로 `python3` 명령어를 실행합니다:

```sh
PYTHONPATH=/foo:/bar python3 example.py
```

실행 결과 (일부 생략):

```
[..., '/foo', '/bar', ...]
```

`'/foo'`, `'/bar'`가 추가된 것을 확인할 수 있습니다.

### 기타 기본 경로

이외에도 [`sys.path`]에는 파이썬에 포함된 여러 내장 모듈 등을 탐색하기 위한 기본 경로가 들어갑니다. 이 경로들은 운영 체제나 파이썬 버전에 따라 다릅니다[^installation-dependent].

[^installation-dependent]:
    [The Module Search Path - The Python Tutorial](https://docs.python.org/3/tutorial/modules.html#the-module-search-path)

    > The installation-dependent default.

테스트 용 파일을 하나 만듭니다:

```py
import sys
print(sys.path)
```

실행 결과 (일부 생략):

```
[..., `'/usr/lib/python36.zip'`, `'/usr/lib/python3.6'`, `'/usr/lib/python3.6/lib-dynload'`,
`'/usr/local/lib/python3.6/dist-packages'`, `'/usr/lib/python3/dist-packages'`]
```

`'/usr/lib/python36.zip'`, `'/usr/lib/python3.6'`, `'/usr/lib/python3.6/lib-dynload'` 등 내장 모듈을 위한 여러 경로들을 확인할 수 있습니다.

> [!NOTE]
> [`sys.path`]에는 디렉터리 경로뿐만 아니라 `'/usr/lib/python36.zip'`처럼 압축 파일도 추가할 수 있습니다. 자세한 내용은 [`zipimport`](https://docs.python.org/3/library/zipimport.html) 모듈을 참고하세요.

## 주의: `sys.path`의 순서

`import`는 [`sys.path`] 리스트에 들어있는 경로들을 탐색하며 불러올 파이썬 파일을 찾습니다. 리스트에 들어있는 맨 처음 경로부터 탐색을 시작합니다. 특정 경로에서 불러올 파일을 찾았다면 남은 경로를 더 찾아보지 않고 탐색을 중지합니다[^ahead].

[^ahead]:
    [The Module Search Path - The Python Tutorial](https://docs.python.org/3/tutorial/modules.html#the-module-search-path)

    > The directory containing the script being run is placed at the beginning of the search path, ahead of the standard library path.

[`sys.path`]의 기본값은 이 문서에서 언급한 순서대로 추가됩니다[^order]:

[^order]:
    [The Module Search Path - The Python Tutorial](https://docs.python.org/3/tutorial/modules.html#the-module-search-path)

    > - The directory containing the input script (or the current directory when no file is specified).
    > - PYTHONPATH (a list of directory names, with the same syntax as the shell variable PATH).
    > - The installation-dependent default.

1. `.py` 파일이 속한 디렉터리의 절대 경로
2. `PYTHONPATH` 환경 변수
3. 기타 기본 경로

만약 내장 모듈과 같은 이름으로 로컬 파일을 만들게 되면, 위의 순서로 인해 로컬 파일을 우선하여 불러옵니다[^error].

[^error]:
    [The Module Search Path - The Python Tutorial](https://docs.python.org/3/tutorial/modules.html#the-module-search-path)

    > This means that scripts in that directory will be loaded instead of modules of the same name in the library directory. This is an error unless the replacement is intended.

> [!NOTE]
> 내장 모듈을 덮어쓰는 현상으로 인해 발견하기 어려운 오류가 발생할 수 있습니다. 자세한 내용은 [<파이썬 내장 모듈과 동일한 이름 피하기>](/avoid-python-builtin-module-names.html)를 참고하세요.
