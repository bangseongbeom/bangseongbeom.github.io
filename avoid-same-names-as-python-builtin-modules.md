---
lang: ko
categories: [python]
date: 2020-04-22
redirect_from: [/avoid-python-builtin-module-names.html]
---

# 파이썬 내장 모듈과 동일한 이름 피하기

내장 모듈과 동일한 이름으로 파이썬 파일을 만드는 것은 위험합니다. 파이썬에는 내장 모듈과 동일한 이름의 파이썬 파일이 존재할 경우 내장 모듈 대신 동일한 이름의 파일을 불러오는 현상이 있는데, 이 현상으로 인해 원인을 알기 어려운 오류가 발생할 수 있습니다.

## 문제점

파이썬에는 내장 모듈과 동일한 이름의 파이썬 파일이 존재할 경우 이를 `import`로 불러올 때 내장 모듈 대신 동일한 이름의 파일을 불러오는 현상이 있습니다[^ahead]. 현재 디렉터리에 `enum.py`라는 파일이 존재한다면, `import enum`이라는 코드를 실행했을 경우 [`enum`] 내장 모듈을 불러오는 것이 아니라 현재 디렉터리의 `enum.py`를 불러오게 되는 것이죠.

[^ahead]:
    [The Module Search Path - The Python Tutorial](https://docs.python.org/3/tutorial/modules.html#the-module-search-path)

    > The directory containing the script being run is placed at the beginning of the search path, ahead of the standard library path.

[`enum`]: https://docs.python.org/3/library/enum.htm

이 현상은 언뜻 보기에 별 문제가 없어 보입니다. 해당 내장 모듈이 프로그램 내에서 전혀 쓰이지 않는다면, 내장 모듈 대신 자기가 만든 파이썬 파일을 사용하고 싶을 수도 있으니까요.

하지만 이 현상에는 한 가지 주의해야 할 점이 있습니다. **타인이 작성한 코드(내장 모듈, 외부 라이브러리)가 내장 모듈을 `import`했을 때, 그 파일 안에 있는 `import`에도 이 현상이 적용됩니다.** 우리 코드가 아님에도 내장 모듈과 동일한 이름의 파이썬 파일을 불러오게 되는 것이죠.

실험해봅시다.

먼저 아무 내용도 없는 `enum.py`를 만듭니다:

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

`enum.IntFlag`를 찾을 수 없다는 오류가 발생했습니다. 왜 이 오류가 발생했을까요?

[`re`] 내장 모듈에는 [`import enum`](https://github.com/python/cpython/blob/686d508c26fafb57dfe463c4f55b20013dad1441/Lib/re.py#L124)이란 코드가 있습니다. **여기서 `import enum`은 [`enum`] 내장 모듈을 불러오지 않습니다. 앞에서 만든 아무 내용도 없는 `enum.py`를 불러옵니다.** `enum.py`에는 '당연히' `IntFlag`가 없습니다. 때문에 이를 찾을 수 없다는 오류가 발생하게 되는 것이죠.

> [!NOTE]
> 파이썬 파일을 불러오는 절차에 대한 자세한 내용은 [<sys.path, PYTHONPATH>](/sys-path-pythonpath.html)를 참고하세요.

## 부정확한 오류 메시지

**이 오류가 무서운 점은 오류 메시지로부터 무엇이 문제인지 추론하기가 어렵다는 것입니다.** '내장 모듈이 덮어씌워졌으니 확인해주세요.'같은 친절한 오류를 출력하지 않습니다. 대신 `AttributeError: module 'enum' has no attribute 'IntFlag'`같이 [`AttributeError`]가 발생합니다. [`AttributeError`]는 사용하고자 하는 특정한 메서드나 클래스가 없을 때 발생하는데, 이 정보만 가지고는 내장 모듈이 덮어씌워졌다는 것을 생각하기 어렵죠.

[`AttributeError`]: https://docs.python.org/3/library/exceptions.html#AttributeError

## 일반적인 이름을 가진 내장 모듈

파이썬 내장 모듈 중에는 일반적인 단어로 이름지어진 것이 많다는 것도 이 현상을 회피하기 어렵게 합니다. 많은 내장 모듈이 [`time`](https://docs.python.org/3/library/time.html), [`calendar`](https://docs.python.org/3/library/calendar.html), [`email`](https://docs.python.org/3/library/email.html)처럼 단순한 이름을 가집니다. 심지어는 [`test`](https://docs.python.org/3/library/test.html)라는 이름의 모듈까지 존재합니다. 자기가 만드는 파일 이름이 너무 단순하다면, [파이썬 표준 라이브러리](https://docs.python.org/3/library/index.html)에서 내장 모듈과 이름이 중복되는지 확인해봐야 할 정도입니다.

## 완화 방법: 디렉터리 생성

약간의 번거로움만 감수한다면 이름 중복으로 인한 문제를 어느 정도 해결할 수 있습니다.

방법은 디렉터리를 만들어 작업하는 것입니다. 디렉터리 안에 있는 파이썬 파일을 불러오기 위해서는 불러올 파일 이름 앞에 디렉터리 이름을 붙여주어야 합니다. 이렇게 할 경우 파일 이름이 내장 모듈을 덮어씌우게 되는 지에 대한 여부는 해당 디렉터리의 이름에 대해서만 찾아보면 됩니다.

`mypackage/empty.py`를 만듭니다:

```py
# 아무 것도 없음
```

`mypackage/main.py`를 만듭니다:

```py
import mypackage.empty  # mypackage를 앞에 붙여 empty 불러오기
```

`mypackage` 디렉터리 안에 있는 `empty.py`를 불러오기 위해, `empty` 앞에 `mypackage`를 붙여주었습니다.

이제

### `__main__.py`를 통한 디렉터리 자체 실행

디렉터리를 만드는 식으로 할 때 한 가지 주의해야 할 점이 있습니다. `import`는 처음 `python3` 명령어를 통해 실행된 파일을 기준으로 다른 파이썬 파일을 찾습니다. 이로 인해 **파이썬 파일 실행 시 해당 파일을 직접 실행하면 `import` 문에 문제가 발생합니다.** 해당 디렉터리 안에 들어와 있는 상태에서, 그 디렉터리와 같은 이름으로 된 디렉터리를 찾으려 하기 때문입니다.

대신 디렉터리 '자체'를 실행하도록 하여 이 문제를 해결할 수 있습니다. 디렉터리 안에 `__main__.py` 파일을 만들면 디렉터리 자체를 실행하려 할 때 `__main__.py`가 실행됩니다[^package-main].

[^package-main]:
    [https://docs.python.org/3/library/__main__.html](**main** — Top-level script environment - The Python Standard Library)

    > For a package, the same effect can be achieved by including a `__main__.py` module, the contents of which will be executed when the module is run with `-m`.

`mypackage/__main__.py`를 만듭니다 (내용은 상관 없음):

```py
# ...
```

이제 다음과 같이 **디렉터리를 직접 명시**하여 `python3` 명령어를 실행합니다:

```sh
python3 mypackage
```

디렉터리 안에 있는 `__main__.py` 실행되는 것을 확인하실 수 있습니다.
