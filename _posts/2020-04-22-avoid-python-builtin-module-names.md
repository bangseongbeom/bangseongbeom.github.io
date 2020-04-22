---
title: 파이썬 내장 모듈과 동일한 이름은 피하기
category: python
---

파이썬 내장 모듈과 동일한 이름으로 파이썬 파일을 만들지 마세요. 이로 인해 무슨 문제인지 추론하기 어려운 오류가 발생할 수 있습니다.

## 문제점

내장 모듈과 동일한 이름의 파이썬 파일을 `import`로 불러올 경우, 내장 모듈 대신 우리가 만든 파일이 불러와집니다[^ahead].

[^ahead]: [The Module Search Path - The Python Tutorial](https://docs.python.org/3/tutorial/modules.html#the-module-search-path)

    > The directory containing the script being run is placed at the beginning of the search path, ahead of the standard library path.

{% include example.html %}

먼저 현재 디렉터리에 `enum.py`을 만듭니다:

```py
# enum.py

# 아무 것도 없음
```

같은 디렉터리에 `main.py`를 만듭니다:

```py
# main.py

import enum  # 내장 모듈이 아니라, 우리가 만든 enum.py를 불러옵니다.
from enum import Enum  # 오류! 우리가 만든 enum.py에는 Enum이 없습니다.
```

`main.py`를 실행하면 `import enum`가 실행되는데, 이때 파이썬 내장 모듈 중 하나인 [`enum`]을 불러오는 것이 아니라 현재 디렉터리의 `enum.py`를 불러오게 됩니다. 그러므로 내장 모듈에 있는 [`enum.Enum`]과 같은 모듈 내의 요소를 불러올 수 없습니다.

[`enum`]: https://docs.python.org/3/library/enum.htm

[`enum.Enum`]: https://docs.python.org/3/library/enum.html#enum.Enum

{% include endexample.html %}

{% include note.html %}

파이썬 파일을 불러오는 절차에 대한 자세한 내용은 [sys.path, PYTHONPATH](/sys-path-pythonpath.html)를 참고하세요.

{% include endnote.html %}

이름 중복으로 인해 내장 모듈이 덮어씌워지는 현상은 **우리가 작성한 코드에만 적용되는 것이 아닙니다.** 우리가 다른 내장 모듈이나 외부 패키지 등을 `import`할 경우, **불러온 파일 내부에 존재하는 `import`에도 이 현상이 적용됩니다.**

그러니까, 우리 디렉터리에 `enum.py`가 존재하기만 한다면, 내가 `import`로 다른 파이썬 파일을 불러올 경우 해당 파이썬 파일 내부에서의 `import enum`들이 모두 우리가 만든 `enum.py`를 불러오게 되는 것이죠.

말로 하기에는 조금 어려우니 아래의 예시를 참고해주세요.

{% include example.html %}

아까와 동일하게 빈 `enum.py`를 만듭니다:

```py
# enum.py

# 아무 것도 없음
```

이제 같은 디렉터리에 `main.py`를 만들고, [`re`] 내장 모듈을 `import`합니다:

[`re`]: https://docs.python.org/3/library/re.html

```py
# main.py

import re
```

[`re`] 내장 모듈 내부에서는 [`import enum`](https://github.com/python/cpython/blob/686d508c26fafb57dfe463c4f55b20013dad1441/Lib/re.py#L124)을 통해 [`enum`] 내장 모듈에 의존하고 있습니다.

`main.py`를 실행하면 다음과 같은 오류가 출력됩니다:

```py
Traceback (most recent call last):
  File "main.py", line 1, in <module>
    import re
  File "/usr/lib/python3.6/re.py", line 142, in <module>
    class RegexFlag(enum.IntFlag):
AttributeError: module 'enum' has no attribute 'IntFlag'
```

이 오류가 발생하는 이유는, [`re`](https://docs.python.org/3/library/re.html) 내장 모듈 내부의 `import enum`이 [`enum`] 내장 모듈을 불러오는 게 아니라 우리가 만든 `enum.py`를 불러왔기 때문입니다. [`re`]는 [`enum.IntFlag`]에 의존하고 있는데, 우리가 만든 `enum.py`에는 `IntFlag`가 없으므로 발생한 오류입니다.

[`enum.IntFlag`]: https://docs.python.org/3/library/enum.html#enum.IntFlag

{% include endexample.html %}

## 왜 이 오류가 무서운가: 부정확한 오류 메시지

**이 오류가 무서운 점은, 오류 메시지로부터 무엇이 문제인지를 추론하기가 어렵다는 것입니다.** 내장 모듈이 덮어씌워졌다고 해서 '내장 모듈이 덮어씌워졌으니 확인해주세요.'와 같은 친절한 오류가 아니라, `AttributeError: module 'enum' has no attribute 'IntFlag'`처럼 [`AttributeError`]가 발생합니다.

[`AttributeError`]: https://docs.python.org/3/library/exceptions.html#AttributeError

## 왜 이 오류가 무서운가: 일반적인 이름을 가진 내장 모듈

파이썬 내장 모듈은 일반적인 단어로 된 이름을 가진 것들이 매우 많습니다. [`time`](https://docs.python.org/3/library/time.html), [`calendar`](https://docs.python.org/3/library/calendar.html), [`email`](https://docs.python.org/3/library/email.html), 심지어는 [`test`](https://docs.python.org/3/library/test.html)라는 이름의 모듈까지 존재합니다.

이로 인해 너무 일반적인 단어로 이름지을 때는 [파이썬 표준 라이브러리](https://docs.python.org/3/library/index.html)에서 내장 모듈과 이름이 중복되는지 확인해볼 필요가 있습니다.

## 완화 방법: 디렉터리 생성

완벽한 해결책은 아니지만, 디렉터리를 만든 뒤 작업하면 이름 중복으로 인한 문제를 어느 정도 해결할 수 있습니다. 같은 디렉터리 내부의 파일을 `import`할 때, 해당 파일의 이름만이 아니라 디렉터리 이름을 함께 명시해야 하기 때문입니다.

{% include example.html %}

`mypackage`라는 디렉터리를 만든 뒤, `mypackage/empty.py`를 만들어봅시다:

```py
# empty.py

# 아무 것도 없음
```

이제 `mypackage/main.py`를 만듭니다. 여기서 `mypackage/emtpy.py`를 `import`하기 위해서는 `import mypackage.empty`처럼 디렉터리 이름을 함께 명시해야 합니다:

```py
# main.py

import mypackage.empty
```

`mypackage`라는 이름의 내장 모듈이 존재하지 않는 한, 이름이 덮어씌워지는 현상이 일어나지 않습니다.

{% include endexample.html %}

많은 라이브러리들도 이러한 디렉터리 구조를 가지고 있습니다.

### `__main__.py`를 통한 디렉터리 자체 실행

디렉터리를 만들 경우 `python3 main.py`처럼 파이썬 파일을 실행하면 안 됩니다. 파이썬 파일 탐색 시 사용할 기준 경로를 디렉터리 바깥에 두어야 `import mypackage.foo`에서 `mypackage/foo` 디렉터리를 탐색할 수 있기 때문입니다.

{% include note.html %}

파이썬 파일을 탐색할 때 사용하는 기준 경로에 대한 자세한 내용은 [sys.path, PYTHONPATH](/sys-path-pythonpath.html)를 참고하세요.

{% include endnote.html %}

대신 디렉터리 자체를 실행하도록 하면 됩니다. 디렉터리 안에 `__main__.py` 파일을 만들면 디렉터리 자체를 실행할 때 `__main__.py`가 실행됩니다[^package-main].

[^package-main]: [https://docs.python.org/3/library/__main__.html](__main__ — Top-level script environment - The Python Standard Library)

    > For a package, the same effect can be achieved by including a `__main__.py` module, the contents of which will be executed when the module is run with `-m`.

{% include example.html %}

`mypackage`라는 디렉터리를 기반으로 예를 들어보겠습니다.

먼저 `mypackage/__main__.py`를 만듭니다. 저는 `/home/ubuntu`에 만들겠습니다:

```py
print("__main__.py")
```

`cd /home/ubuntu`를 통해 `/home/ubuntu`로 이동합니다. 이제 다음과 같이 디렉터리를 직접 명시하여 실행할 수 있습니다:

```sh
python3 mypackage
```

{% include endexample.html %}
