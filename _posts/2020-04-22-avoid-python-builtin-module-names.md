---
title: 파이썬 내장 모듈과 동일한 이름 피하기
category: python
---

파이썬 내장 모듈과 동일한 이름으로 파이썬 파일을 만들게 될 경우, 이름이 덮어씌워지는 현상으로 인해 해당 내장 모듈에 의존하고 있는 모든 코드가 제대로 동작하지 않을 수 있습니다.

## 문제점

파이썬에서는 내장 모듈과 동일한 이름의 파이썬 파일을 `import`로 불러올 경우 내장 모듈 대신 우리가 만든 파일이 불러와지는 현상이 있습니다[^ahead]. 현재 디렉터리에 `enum.py`가 존재할 때, `import enum`이라는 코드를 실행하면 [`enum`], 내장 모듈을 불러오는 것이 아니라 현재 디렉터리의 `enum.py`를 불러오게 됩니다.

[^ahead]: [The Module Search Path - The Python Tutorial](https://docs.python.org/3/tutorial/modules.html#the-module-search-path)

    > The directory containing the script being run is placed at the beginning of the search path, ahead of the standard library path.

[`enum`]: https://docs.python.org/3/library/enum.htm

이 현상에는 치명적인 문제점이 있습니다. **현재 디렉터리에 `enum.py`가 존재하는 한, 우리가 다른 내장 모듈이나 외부 패키지 등을 `import`했을 때 그 파일 안에 있는 `import enum`에도 이 현상이 적용된다는 것입니다.**

{% include example.html %}

정말 그런지 실험해봅시다. 먼저 아무 내용도 없는 `enum.py`를 만듭니다:

```py
# 아무 것도 없음
```

이제 같은 디렉터리에 `main.py`를 만들고, [`re`] 내장 모듈을 `import`합니다:

[`re`]: https://docs.python.org/3/library/re.html

```py
import re
```

`main.py`를 실행하면 다음과 같은 오류가 출력됩니다:

```py
Traceback (most recent call last):
  File "main.py", line 1, in <module>
    import re
  File "/usr/lib/python3.6/re.py", line 142, in <module>
    class RegexFlag(enum.IntFlag):
AttributeError: module 'enum' has no attribute 'IntFlag'
```

`enum.IntFlag`를 찾을 수 없어 오류가 발생했습니다.

[`re`] 내장 모듈의 내부에서는 [`import enum`](https://github.com/python/cpython/blob/686d508c26fafb57dfe463c4f55b20013dad1441/Lib/re.py#L124)이란 코드가 있습니다. **파일이 덮어씌워지는 현상으로 인해, 이 코드는 [`enum`] 내장 모듈을 불러오는 게 아니라 앞에서 만든 아무 내용도 없는 `enum.py` 파일을 불러옵니다. 이 `enum.py`에는 '당연히' `IntFlag`가 없기 때문에, 이를 찾을 수 없다는 오류가 발생하게 됩니다.**

{% include endexample.html %}

{% include note.html %}

파이썬 파일을 불러오는 절차에 대한 자세한 내용은 [sys.path, PYTHONPATH](/sys-path-pythonpath.html)를 참고하세요.

{% include endnote.html %}

## 부정확한 오류 메시지

**이 오류가 무서운 점은, 오류 메시지로부터 무엇이 문제인지 추론하기가 어렵다는 것입니다.** 내장 모듈이 덮어씌워졌다고 해서 '내장 모듈이 덮어씌워졌으니 확인해주세요.' 같은 친절한 오류를 출력하지 않습니다. `AttributeError: module 'enum' has no attribute 'IntFlag'`같은 오류가 발생합니다. [`AttributeError`]는 사용하고자 하는 특정한 메서드나 클래스가 없을 때 발생하는데, 이 정보만 가지고는 내장 모듈이 덮어씌워졌다는 것을 생각하기 어렵습니다.

[`AttributeError`]: https://docs.python.org/3/library/exceptions.html#AttributeError

## 일반적인 이름을 가진 내장 모듈

일반적인 단어로 이름지어진 파이썬 내장 모듈이 많다는 것도 이 현상을 회피하기 어렵게 합니다. 많은 내장 모듈이 [`time`](https://docs.python.org/3/library/time.html), [`calendar`](https://docs.python.org/3/library/calendar.html), [`email`](https://docs.python.org/3/library/email.html)처럼 단순한 이름을 가집니다. 심지어는 [`test`](https://docs.python.org/3/library/test.html)라는 이름의 모듈까지 존재합니다. 너무 일반적인 단어로 파이썬 파일을 만들게 된다면 [파이썬 표준 라이브러리](https://docs.python.org/3/library/index.html)에서 내장 모듈과 이름이 중복되는지 확인해볼 필요가 있습니다.

## 완화 방법: 디렉터리 생성

완벽한 해결책은 아니지만, 디렉터리를 만든 뒤 작업하면 이름 중복으로 인한 문제를 어느 정도 해결할 수 있습니다. 같은 디렉터리 내부의 파일을 `import`할 때, 해당 파일의 이름만이 아니라 디렉터리 이름을 함께 명시해야 하기 때문입니다.

{% include example.html %}

`mypackage/empty.py`를 만들어봅시다:

```py
# 아무 것도 없음
```

이제 `mypackage/main.py`를 만듭니다:

```py
import mypackage.empty  # mypackage.를 앞에 붙여 empty 불러오기
```

디렉터리 안에서는 파이썬 파일을 불러오기 위해 언제나 `mypackage.`를 붙여주어야 합니다. `mypackage`라는 이름의 내장 모듈이 존재하지 않는 한, 이름이 덮어씌워지는 현상이 일어나지 않습니다.

{% include endexample.html %}

### `__main__.py`를 통한 디렉터리 자체 실행

디렉터리를 만드는 식으로 할 때 한 가지 주의해야 할 점이 있습니다. **`python3 main.py`처럼, 파이썬 파일을 해당 디렉터리 안에서 직접 실행하면 안 됩니다.** 파이썬 파일 탐색 시 사용할 기준 경로를 디렉터리 바깥에 두어야 `import mypackage.foo`에서 `mypackage/foo` 디렉터리를 탐색할 수 있기 때문입니다.

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
