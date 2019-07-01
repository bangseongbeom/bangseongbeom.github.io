---
title: 파이썬에 switch/case 문이 없는 이유
category: python
---

`switch`/`case`(스위치/케이스) 문의 구현 방식에 대한 합의가 이루어지지 않아 구현되지 못했습니다. 그냥 `if...elif` 쓰세요.

## 이유: 구현 방식의 다양성으로 인한 결정의 어려움 + 저조한 인기

파이썬을 개발한 [귀도 반 로섬](https://ko.wikipedia.org/wiki/%EA%B7%80%EB%8F%84_%EB%B0%98_%EB%A1%9C%EC%84%AC)은 [PEP 3103](https://www.python.org/dev/peps/pep-3103/)에서 `switch`/`case` 문을 어떻게 구현할지에 대해 논의했던 적이 있습니다.

이때 `switch`/`case` 문의 형태나 구현하는 방법에 대한 여러 가지 방식을 제안했습니다:

- [문법](https://www.python.org/dev/peps/pep-3103/#basic-syntax): `switch`와 `case`의 들여쓰기 방식

    방식 1:
    
    ```py
    switch EXPR:
        case EXPR:
            SUITE
    ```
    
    방식 2 (`case`는 들여쓰기하지 않음):
    
    ```
    switch EXPR:
    case EXPR:
        SUITE
    ```

- [`if`/`elif` 방식 vs `dict` 기반 방식](https://www.python.org/dev/peps/pep-3103/#if-elif-chain-vs-dict-based-dispatch): 내부적으로 `switch`를 `if`/`elif`처럼 다루기 vs 딕셔너리를 만들어 매핑하는 방식으로 처리하기
- [`dict` 기반 방식의 추가적인 문제점](https://www.python.org/dev/peps/pep-3103/#when-to-freeze-the-dispatch-dict)

각각 장단점이 있기 때문에 어느 한 방식을 결정하기가 쉽지 않습니다. 귀도는 [무언가 결정하기에 이미 늦었다고 말합니다](https://www.python.org/dev/peps/pep-3103/#conclusion).

[파이콘(PyCon) 2007 에서 `switch`/`case`에 관한 설문 조사도 했지만, 사람들은 이 기능에 큰 관심을 보이지도 않았습니다. 이로서 switch/case 문과 관련된 논의는 폐기됩니다.](https://www.python.org/dev/peps/pep-3103/#rejection-notice)

## 대안: if...elif 또는 dict

그렇다면 파이썬에서는 `switch`/`case` 대신 무엇을 권장하고 있을까요? 파이썬 공식 문서인 [Design and History FAQ](https://docs.python.org/3/faq/design.html#why-isn-t-there-a-switch-or-case-statement-in-python)를 살펴보면:

- 일반적인 경우: `if...elif`
- 많은 경우 중에서 하나를 택해야 하는 경우: 딕셔너리와 함수를 매핑

    예시:
    
    ```py
    def function_1(...):
        ...

    functions = {'a': function_1,
                 'b': function_2,
                 'c': self.method_1, ...}

    func = functions[value]
    func()
    ```
    
    출처: <a href="https://docs.python.org/3/faq/design.html#why-isn-t-there-a-switch-or-case-statement-in-python">Design and History FAQ</a>
