---
title: sys.path, PYTHONPATH
category: python
---

파이썬에서는 모듈을 찾기 위한 기반 디렉터리 목록으로 [`sys.path`]와 [`PYTHONPATH`] 환경 변수를 사용합니다. 이 두 변수를 적절히 수정해 다른 디렉터리에 있는 파이썬 파일을 손쉽게 불러올 수 있습니다.

[`sys.path`]: https://docs.python.org/3/library/sys.html#sys.path

[`PYTHONPATH`]: https://docs.python.org/3/using/cmdline.html#envvar-PYTHONPATH

## `sys.path`

[`sys.path`]는 디렉터리의 경로들이 기록된 문자열 리스트입니다. 이 리스트에 [`append()`] 메서드로 경로를 추가하면 해당 경로에 있는 파이썬 파일을 `import` 문으로 불러올 수 있습니다.

[`append()`]: https://docs.python.org/3/tutorial/datastructures.html#more-on-lists

<div markdown="1" class="example">

<figure markdown="1">

<figcaption markdown="1">

`/opt/common.py` 파일:

</figcaption>
    
```py
print("Hello, world!")
```

</figure>

<figure markdown="1">

<figcaption markdown="1">

`/home/ubuntu/example.py` 파일. [`sys.path`]에 `/opt` 디렉터리를 추가해 `common.py`를 `import`할 수 있도록 합니다:

</figcaption>

```py
import sys
sys.path.append("/opt")
import common
```

</figure>

실행:

```sh
python3 example.py
```

결과:

```
Hello, world!
```

</div>

## `sys.path`의 기본 구성과 `PYTHONPATH`

[`sys.path`]에는 파이썬에 의해 기본적으로 몇 가지 경로가 미리 추가되어 있습니다.

1. **실행하는데 사용한 `.py` 파일이 속한 디렉터리의 절대 경로[^the-module-search-path-1]**

   <div markdown="1" class="example">

   `/home/ubuntu/example.py` 파일:
    
    ```py
   import sys
   print(sys.path)
    ```
    
    실행 결과 (일부 생략). 리스트의 첫 번째 값으로 `'/home/ubuntu'`가 들어있는 것을 확인할 수 있습니다:
    
    ```
   [`'/home/ubuntu'`, ...]
    ```
    
    </div>

    <div markdown="1" class="note">
    
    특정 파이썬 파일을 실행하는 것 대신, 파이썬 인터프리터에서 **직접 `print(sys.path)`를 입력**하면 어떻게 될까요? 이때는 파이썬 파일이 존재하지 않으므로, `.py` 파일이 속한 디렉터리의 절대 경로 대신 인터프리터를 실행할 당시의 경로(현재 작업 디렉터리)가 [`sys.path`]에 추가됩니다. 실제로 인터프리터에서 실행해보면 `'/home/ubuntu'`같은 절대 경로 대신 `''`(빈 문자열은 유효한 상대 경로로, 현재 디렉터리를 의미)이 추가되는 것을 확인할 수 있습니다[^the-module-search-path-1-current-directory].
    
    </div>
  
2. **`PYTHONPATH` 환경 변수**

    파이썬 코드 내부에서 [`sys.path`]를 조작하는 것뿐만 아니라, 파이썬 코드 밖에서도 [`PYTHONPATH`] 환경 변수를 조작해 [`sys.path`]에 경로를 추가할 수 있습니다.

    [`PYTHONPATH`]에는 [`sys.path`]에 추가할 여러 경로들이 들어갑니다. 리눅스에서는 `/foo:/bar`처럼 `:`로 두 경로를 구분하고, 윈도우에서는 `/foo;/bar`처럼 `;`로 두 경로를 구분합니다. (`PATH` 환경 변수와 동일한 방식)[^pythonpath-format]
    
    <div markdown="1" class="example">

    `/home/ubuntu/example.py` 파일:
    
    ```py
   import sys
   print(sys.path)
    ```

    실행 명령어. [`PYTHONPATH`] 환경 변수에 `/foo`와 `/bar`를 추가한 뒤, 파이썬 파일을 실행합니다:

    ```sh
   PYTHONPATH=/foo:/bar python3 example.py
    ```

    실행 결과 (일부 생략). [`sys.path`]에 `'/foo'`, `'/bar'`가 추가된 것을 확인할 수 있습니다:

    ```
   [..., '/foo', '/bar', ...]
    ```
    
    </div>

3. **파이썬의 설치 환경에 따라 자동으로 추가되는 경로[^the-module-search-path-2]**

    <div markdown="1" class="example">

    `/home/ubuntu/example.py` 파일:
    
    ```py
   import sys
   print(sys.path)
    ```

    실행 결과 (일부 생략). `'/usr/lib/python36.zip'`, `'/usr/lib/python3.6'`, `'/usr/lib/python3.6/lib-dynload'`, `'/usr/local/lib/python3.6/dist-packages'`, `'/usr/lib/python3/dist-packages'`를 확인할 수 있습니다:

    ```
   [..., `'/usr/lib/python36.zip'`, `'/usr/lib/python3.6'`, `'/usr/lib/python3.6/lib-dynload'`,
   `'/usr/local/lib/python3.6/dist-packages'`, `'/usr/lib/python3/dist-packages'`]
    ```
    
    </div>

    <div markdown="1" class="note">
    
    [`sys.path`]에는 디렉터리 경로뿐만 아니라 `'/usr/lib/python36.zip'`처럼 압축 파일도 추가할 수 있습니다. 자세한 내용은 [`zipimport`](https://docs.python.org/3/library/zipimport.html) 모듈을 참고하세요.
    
    </div>
    
[^the-module-search-path-1]: [The Module Search Path - The Python Tutorial](https://docs.python.org/3/tutorial/modules.html#the-module-search-path)

    > - The directory containing the input script
    

[^the-module-search-path-1-current-directory]: [The Module Search Path - The Python Tutorial](https://docs.python.org/3/tutorial/modules.html#the-module-search-path)

    > (or the current directory when no file is specified)

[^pythonpath-format]: [PYTHONPATH - Python Setup and Usage](https://docs.python.org/3/using/cmdline.html#envvar-PYTHONPATH)

    > The format is the same as the shell’s PATH: one or more directory pathnames separated by os.pathsep (e.g. colons on Unix or semicolons on Windows).

[^the-module-search-path-2]: [The Module Search Path - The Python Tutorial](https://docs.python.org/3/tutorial/modules.html#the-module-search-path)

    > - The installation-dependent default.
