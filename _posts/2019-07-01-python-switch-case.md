---
title: 파이썬에서 switch/case 문이 없는 이유
category: python
---

`switch`/`case`(스위치/케이스) 문의 구현 방식에 대한 합의가 이루어지지 않아 구현되지 못했습니다. 그냥 `if...elif` 쓰세요.

## switch/case 문을 추가하려 했으나 복잡한 논의점으로 인한 실패

파이썬을 개발한 [귀도 반 로섬](https://ko.wikipedia.org/wiki/%EA%B7%80%EB%8F%84_%EB%B0%98_%EB%A1%9C%EC%84%AC) 역시 파이썬에 `switch`/`case` 가 없어 불편해하는 사람이 있다는 것을 알고 있었습니다. 귀도는 파이썬에서 `switch`/`case` 문을 어떻게 구현할지에 대해 [PEP 3103](https://www.python.org/dev/peps/pep-3103/)에서 논의하기 시작했습니다.

귀도는 다음과 같은 논의점을 지적했습니다:

- [문법](https://www.python.org/dev/peps/pep-3103/#basic-syntax)
- [`if`/`elif` 방식 vs `dict` 기반 방식](https://www.python.org/dev/peps/pep-3103/#if-elif-chain-vs-dict-based-dispatch)
- [`dict` 기반 방식의 추가적인 문제점](https://www.python.org/dev/peps/pep-3103/#when-to-freeze-the-dispatch-dict)

이러한 방식의 차이는 각자 장단점이 있기 때문에 결정하기가 쉽지 않습니다. 귀도는 [무언가 결정하기에 이미 늦었다고 말합니다](https://www.python.org/dev/peps/pep-3103/#conclusion). [파이콘(PyCon) 2007 에서 이 기능에 관한 설문 조사를 했지만 좋은 반응을 얻지 못했습니다. 이로서 switch/case 문과 관련된 논의는 폐기됩니다.](https://www.python.org/dev/peps/pep-3103/#rejection-notice)

## 대안: if...elif 또는 dict

그렇다면 파이썬에서는 `switch`/`case` 대신 무엇을 권장하고 있을까요? 파이썬 공식 문서인 [Design and History FAQ](https://docs.python.org/3/faq/design.html#why-isn-t-there-a-switch-or-case-statement-in-python)를 살펴보면:

- 일반적인 경우: `if...elif`
- 많은 경우 중에서 하나를 택해야 하는 경우: 딕셔너리와 함수를 매핑

    예시:

    <figure>
    
    ```py
    def function_1(...):
        ...

    functions = {'a': function_1,
                 'b': function_2,
                 'c': self.method_1, ...}

    func = functions[value]
    func()
    ```
    
    <figcaption>출처: <a href="https://docs.python.org/3/faq/design.html#why-isn-t-there-a-switch-or-case-statement-in-python">Design and History FAQ</a></figcaption>
    <figure>
