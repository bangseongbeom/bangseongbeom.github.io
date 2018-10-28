---
title: unittest vs pytest
categories: python
---

- [unittest(유닛테스트)][unittest]: 파이썬에 내장된 테스팅 프레임워크입니다. 파이썬 내부 테스트[^python-internal-test], [Django(장고)][django]에서 사용합니다.
- [pytest(파이테스트)][pytest]: 파이썬에서 가장 인기 있는 테스팅 프레임워크입니다. [Flask(플라스크)][flask], [Requests(리퀘스트)][requests], [pip]에서 사용합니다.

비교 대상에서 제외한 프레임워크는 다음과 같습니다:

- [nose(노즈)][nose]: 업데이트가 활발히 이루어지지 않기도 하고, 위의 두 프레임워크의 인기에 못미치므로 비교에서 제외합니다.
- [doctest(독테스트)][doctest]: 파이썬의 독스트링(docstring)에 있는 샘플 코드만을 테스트하기위한 특수 목적의 프레임워크입니다. 이 글에서는 일반 목적의 테스팅 프레임워크만을 비교하려 하기 때문에 제외하였습니다.

[unittest]: https://docs.python.org/3/library/unittest.html

[^python-internal-test]:
    <https://docs.python.org/3/library/test.html>

    > The test package contains all regression tests for Python ...

    > All new tests should be written using the unittest or doctest module.

[django]: https://www.djangoproject.com/

[pytest]: https://docs.pytest.org/en/latest/

[flask]: http://flask.pocoo.org/

[requests]: http://docs.python-requests.org/en/master/

[pip]: https://pip.pypa.io/en/stable/

[nose]: https://nose.readthedocs.io/en/latest/

[doctest]: https://docs.python.org/3/library/doctest.html

## unittest 단점: 장황한 클래스 기반 테스트

unittest는 자바의 [JUnit(J유닛)][junit]이라는 테스팅 프레임워크로부터 강력한 영향을 받았습니다[^strong-influence]. 자바는 클래스 중심적인 언어로, 클래스를 만들지 않으면 함수를 작성할 수 없습니다. unittest 역시 테스트 함수를 작성하기 위해 반드시 클래스를 선언해야 합니다.

다음은 똑같은 테스트를 unittest와 pytest로 작성한 것입니다:

unittest:

```python
from unittest import TestCase


class UpperTestCase(TestCase):
    def test_upper(self):
        self.assertEqual("foo".upper(), "FOO")
```

pytest:

```python
def test_upper():
    assert "foo".upper() == "FOO"
```

몇몇 파이썬 개발자들은 클래스보다는 함수 위주로 개발하는 것을 선호합니다. 파이썬 표준 라이브러리 역시 클래스 방식과 함수 방식을 둘 다 지원하는 경우가 많습니다. [`json.JSONEncoder`][json-jsonencoder]와 [`json.dumps()`][json-dumps]처럼 말입니다. unittest가 클래스 위주의 테스트만 지원하는 것은 합리적이지 못하다고 느껴질 수 있습니다.

[junit]: https://junit.org/junit5/

[^strong-influence]:
    <https://docs.python.org/3/library/unittest.html>

    > The unittest unit testing framework was originally inspired by JUnit ...

[json-jsonencoder]: https://docs.python.org/3/library/json.html#json.JSONEncoder

[json-dumps]: https://docs.python.org/3/library/json.html#json.dumps

## unittest 단점: 카멜 케이스

unittest를 꺼리는 또 다른 이유 중 하나는 unittest가 카멜 케이스를 사용한다는 점입니다. `assertEqual()`, `setUp()`처럼 말입니다. [PEP 8이라고도 불리는 파이썬 스타일 가이드][pep-8]에서는, 메서드의 이름을 지을 때 `assert_equal()`, `set_up()`처럼 언더스코어로 단어를 구분하도록 권장합니다[^use-underscore].

그러나 파이썬 스타일 가이드는 프로젝트의 일관성을 유지하는 것이 더 중요하다고 말합니다[^consistency]. unittest가 처음부터 카멜 케이스로 개발되었다면 이를 바꾸기 보다는 계속 유지하는 게 좋겠죠.

왜 unittest가 처음부터 언더스코어를 사용하지 않았는가에 대해서도 잘못되었다라고 말하기 어렵습니다. unittest는 PyUnit(파이유닛)이라는 이름으로 1999년 시작된 프로젝트인 반면[^pyunit-history], 파이썬 스타일 가이드는 2001년 처음 만들어졌으니까요.

그렇다고 하더라도, 언더스코어를 사용하는 파이썬의 다른 모듈과 카멜 케이스를 사용하는 unittest를 혼용하는 것은 여간 껄끄러운 일이 아닐 수 없습니다.

[pep-8]: https://www.python.org/dev/peps/pep-0008/

[^use-underscore]:
    <https://www.python.org/dev/peps/pep-0008/#method-names-and-instance-variables>

    > Method Names and Instance Variables
    >
    > ... lowercase with words separated by underscores as necessary to improve readability.

[^consistency]:
    <https://www.python.org/dev/peps/pep-0008/#a-foolish-consistency-is-the-hobgoblin-of-little-minds>
    
    > ... Consistency with this style guide is important. Consistency within a project is more important. ...

[^pyunit-history]:
    <http://pyunit.sourceforge.net/>

    > In production use on many sites since the first release in late 1999

## pytest 장점: 독특하지만 강력한 픽스처 문법

pytest는 기존의 여러 테스팅 프레임워크와는 다른 방식으로 픽스처를 제공합니다. 일단 픽스처를 반환하는 함수를 하나 만듭니다. 여기에 `@pytest.fixture` 를 붙여줍니다. 이제 이 픽스처 함수의 이름과 똑같은 이름을 가지는 인자를 테스트 함수에 추가합니다. 이제 테스트 함수가 실행되면 인자와 같은 이름을 가지는 픽스처 함수가 실행되고,  그 반환 결과가 인자에 주입됩니다. 다음은 pytest 문서에서 제공하는 픽스처 예시입니다:

<https://docs.pytest.org/en/latest/fixture.html>

```python
# content of ./test_smtpsimple.py
import pytest

@pytest.fixture
def smtp_connection():
    import smtplib
    return smtplib.SMTP("smtp.gmail.com", 587, timeout=5)

def test_ehlo(smtp_connection):
    response, msg = smtp_connection.ehlo()
    assert response == 250
    assert 0 # for demo purposes
```

pytest에서는 어떤 테스트가 어떤 픽스처를 사용하는지 쉽게 파악할 수 있습니다. 각 테스트마다 꼭 필요한 픽스처만 명시하기 때문에, 사용하지 않는 픽스처를 만드는데 걸리는 시간을 아낄 수도 있고요.

pytest 공식 문서에서는 이러한 픽스처 사용 방식이 다음과 같은 장점을 가져다 준다고 말합니다:

<https://docs.pytest.org/en/latest/fixture.html>

> pytest 픽스처는 고전적인 xUnit 스타일의 setUp/tearDown과 같은 함수를 극적으로 개선하였습니다:
>
> - 픽스처는 명시적인 이름을 가지며 테스트 함수에서의 선언을 통해 이를 활성화시킬 수 있습니다.
> - 픽스처는 모듈화된 방식으로 구현되어 있습니다. 각 픽스처 이름은 트리거 함수를 호출하고, 또 그 픽스처 역시 다른 픽스처를 사용할 수 있습니다. 
> - 픽스처 관리를 통해 단순한 유닛 테스트부터 복잡한 기능 테스트에 이르기까지 테스트 규모를 확장할 수 있습니다. 환경 설정이나 컴포넌트 설정에 따라 매개변수화된 픽스처를 정의하는 것도 가능합니다. 픽스처를 함수, 모듈, 또는 전체 테스트 세션 영역에 걸쳐 재사용할 수 있도록 돕기도 합니다.

## pytest 단점: 기존 파이썬 흐름과 다른 픽스처

pytest의 픽스처는 파이썬에서 쓰이는 일반적인 코드의 흐름과 완전히 다릅니다. 이런 독특한 문법으로 인해, 초보 파이썬 개발자는 물론 pytest를 접해보지 못한 숙련된 파이썬 개발자에게 있어서도 당혹감을 안겨줍니다.

사람이 아닌 기계가 픽스처를 이해해야 한다면 문제는 더욱 복잡해집니다. [Pylint(파이린트)][pylint]를 예로 들어봅시다. Pylint는 파이썬 코드를 분석해 문제가 될만한 부분을 찾아 경고 메시지를 출력해주눈 도구입니다. 일반적으로, 바깥 영역에 선언된 이름과 동일한 이름으로 무언가를 선언하는 것은 위험할 수 있습니다. 이런 경우에 대해 Pylint는 [redefined-outer-name (W0621)][w0621]이라는 경고 메시지를 출력합니다.

pytest에서는 픽스처를 사용하기 위해 바깥의 함수 이름과 동일한 이름으로 테스트 함수의 매개 변수를 선언해야 합니다. 하지만 Pylint는 pytest의 픽스처 문법을 이해하지 못하므로 앞서 말했던 경고 메시지를 출력할 것입니다.

[pylint]: https://www.pylint.org/

[w0621]: https://pylint.readthedocs.io/en/latest/technical_reference/features.html

## pytest 장점: assert 문 재작성으로 인한 편리함

언어에서 기본적으로 제공하는 [assert 문(`assert 1 == 2`)][assert-statement]을 그대로 사용하는 것 대신 테스팅 프레임워크가 추가적으로 지원하는 [assert 메서드(`assertEqual(1, 2)`)][assert-method]를 사용해야 하는 이유는, 테스트 실패 시 좀 더 정확한 실패 메시지를 얻기 위함입니다.

assert 문은 `assert` 다음에 나오는 표현식의 성공/실패 여부만 확인할 수 있습니다. 우리는 `1 == 2`가 같음을 비교하는 것이고 `1 > 2`가 대소를 비교하는 것이라는 걸 알지만 assert 문은 알지 못합니다. assert 실패 메시지에 표현식의 의도를 담기 위해서는, 앞서 말한 assert 메서드와 같은 추가적인 방법을 통해야 합니다.

pytest를 사용한다면 더 이상 여러 종류의 assert 메서드를 번갈아 사용할 필요가 없습니다. assert 문 하나로 모든 것을 해결할 수 있습니다. pytest는 사용자가 작성한 파이썬 코드에서 assert 문을 분석한 뒤, 상세한 실패 메시지를 띄우도록 내부적으로 코드를 재작성합니다. 이를 통해 assert 문만을 사용하고도 풍부한 실패 메시지를 출력할 수 있습니다. 자세한 내용은 [Behind the scenes of pytest’s new assertion rewriting][assertion-rewriting]을 참고하세요.

[assert-statement]: https://docs.python.org/3/reference/simple_stmts.html#the-assert-statement

[assert-method]: https://docs.python.org/3/library/unittest.html#assert-methods

[assertion-rewriting]: http://pybites.blogspot.com/2011/07/behind-scenes-of-pytests-new-assertion.html

## pytest 단점: assert 문 재작성의 한계

assert 문 재작성은 편리한 기능이지만, unittest의 [`assertRegex()`][assertregex]같은 복잡한 assert 메서드를 대신할 수는 없습니다. 다음은 unittest의 `assertRegex()`와 pytest의 `assert re.search()`를 이용해 정규 표현식으로 문자열을 검색하는 테스트와 그 결과입니다. `assertRegex()`를 사용한 쪽의 실패 메시지가 더 명확하다는 것을 확인할 수 있습니다:

```
    def test_regex_unittest(self):
>       self.assertRegex("foobar", "var")
E       AssertionError: Regex didn't match: 'var' not found in 'foobar'
```

```
    def test_regex_pytest():
>       assert search("var", "foobar")
E       AssertionError: assert None
E        +  where None = search('var', 'foobar')
```

또다른 문제점은 pytest가 발견할 수 있는 범위 내에서만 assert 재작성 기능이 이루어진다는 것입니다. 외부 파이썬 코드에서 assert 문을 사용할 경우 [`register_assert_rewrite()`][register-assert-rewrite]를 호출하여 파일을 등록해야 재작성이 이루어집니다.

[assertregex]: https://docs.python.org/3/library/unittest.html#unittest.TestCase.assertRegex

[register-assert-rewrite]: https://docs.pytest.org/en/latest/assert.html#advanced-assertion-introspection

## pytest 장점: 고급 기능

- 매개변수화된 픽스처: 매개 변수를 다르게 해 동일한 픽스처나 테스트를 여러 번 수행하도록 만듭니다. [Parametrizing fixtures and test functions][parametrize]를 참고하세요.
- 병렬 테스트: 테스트를 병렬적으로 수행할 수 있도록 합니다. 하나의 테스트가 끝나지 않아도 다른 테스트를 수행할 수 있어 테스트 시간이 단축됩니다. [pytest-xdist]를 참고하세요.

[parametrize]: https://docs.pytest.org/en/latest/parametrize.html

[pytest-xdist]: https://github.com/pytest-dev/pytest-xdist

## 결론

이럴 때 unittest를 사용하세요:

- pytest의 독특한 테스트 방식이 정말 생산성을 향상시킬 수 있는지 의심스럽다. 다른 언어의 테스팅 프레임워크와 비슷한 정도만으로도 충분하다.
- 픽스처 주입이나 assert 문 재작성으로 인한 잠재적인 문제를 떠안고 싶지 않다. 예기치 못한 동작으로 인해 고생을 하느니 차라리 코드 몇 줄 더 치는 게 현명한 선택이다.

이럴 때 pytest를 사용하세요:

- 간결하고 아름다운 코드가 무엇보다 중요하다. 테스트 코드를 작성하기 위해 클래스를 사용하는 건 파이썬스럽지 못하다.
- 매개변수화된 픽스처나 병렬 테스트와 같은 고급 기능이 필요하다.

unittest 기반으로 테스트를 작성하되, assert 문 재작성이나 병렬 테스트, 테스트 실패 디버깅과 같은 pytest의 기능이 필요한 경우도 있습니다. 이럴 때 unittest를 쓸지 pytest를 쓸지 고민하지 않아도 됩니다. pytest는 unittest로 작성한 테스트 코드를 돌릴 수 있는 기능을 제공하고 있습니다[^pytest-unittest].

[^pytest-unittest]: <http://doc.pytest.org/en/latest/unittest.html>

## 참고

- <https://cournape.github.io/why-i-am-not-a-fan-of-pytest.html>
