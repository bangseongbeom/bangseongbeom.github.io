---
title: 플라스크 시그널
category: python
---

파이썬 [플라스크(Flask)](https://flask.palletsprojects.com/)에서 프레임워크 내부 동작을 감지하는 방법인 시그널(Signals)에 대해 살펴봅니다.

## 소개

플라스크는 내부적으로 템플릿을 렌더링한다거나 HTTP 요청을 준비하는 등 눈에 보이지 않는 곳에서 다양한 작업을 수행합니다. 일반적인 경우라면 백엔드 웹 개발자가 이러한 과정까지 세세히 신경쓸 필요는 없습니다. 하지만 과정 중간 중간에 로그를 기록한다거나 어떤 코드를 삽입하고 싶다면 어떻게 해야 할까요?

이를 위해, 플라스크는 플라스크 내부의 코드 중간에 백엔드 웹 개발자가 정의한 함수를 실행할 수 있는 기능을 제공합니다. 그중 하나가 바로 **시그널**입니다. 특정 순간에 연결된 함수를 실행하는 것이 마치 신호를 발생시키는 것 같다고 하여, 영어로 **신호**라는 뜻을 가진 시그널이라는 이름이 붙게 되었습니다.

## 시그널 vs 내장 데커레이터

플라스크 내부 동작을 감지하는 방식으로는 시그널만 있는 것이 아닙니다. 플라스크는 **내장 데커레이터**라는 또다른 방식을 제공합니다.

내장 데커레이터로는 [`before_request()`](https://flask.palletsprojects.com/en/1.1.x/api/#flask.Flask.before_request), [`after_request()`](https://flask.palletsprojects.com/en/1.1.x/api/#flask.Flask.after_request), [`teardown_request()`](https://flask.palletsprojects.com/en/1.1.x/api/#flask.Flask.before_request) 등이 있습니다. 내장 데커레이터와 시그널 둘 다 플라스크의 내부 코드 흐름에 백엔드 웹 개발자가 만든 함수를 실행할 수 있도록 해주지만, 내장 데커레이터와 달리 시그널은 다음과 같은 특징을 가지므로 주의해야 합니다:

- 시그널의 종류가 내장 데커레이터의 종류보다 더 다양합니다.
- 시그널 처리 함수에서 **데이터를 수정**하는 것은 권장되지 않습니다. 데이터를 수정하고 싶다면 내장 데커레이터를 사용하세요[^signal-caveat].
- 여러 시그널 처리 함수가 연결되었을 때 **특정 순서대로 함수가 실행되는 것**을 보장하지 않습니다. 순서 보장을 원하는 경우 내장 데커레이터를 사용하세요[^signal-caveat].

[^signal-caveat]: <https://flask.palletsprojects.com/en/1.1.x/signals/>

    > However, there are differences in how they work. The core before_request() handler, for example, is executed in a specific order and is able to abort the request early by returning a response. In contrast all signal handlers are executed in undefined order and do not modify any data.
 

## 설치

시그널을 사용하기 위해서는 먼저 [**Blinker(블링커)**](https://pythonhosted.org/blinker/)라는 추가적인 라이브러리가 필요합니다. 독특하게도, 이 라이브러리는 플라스크를 설치할 때 자동으로 함께 설치되지 않습니다. 시그널을 사용하고 싶다면 Blinker를 직접 설치해야 합니다. 아마 이 라이브러리는 플라스크를 동작시키는 데 반드시 필요하지도 않을 뿐더러, 플라스크의 용량을 줄이기 위해 자동으로 설치되지 않도록 한 것 같습니다.

Linux, macOS라면 `pip install blinker`를, Windows라면 `py -m pip install blinker`를 통해 Blinker를 설치합시다.

만약 Blinker를 설치하지 않고 시그널을 사용하려 하면 다음과 같은 오류가 발생합니다:

> RuntimeError: Signalling support is unavailable because the blinker library is not installed.

## 예제

다음은 `request_started` 시그널을 통해 HTTP 요청이 발생했을 경우 `"Request received!"`를 출력하는 코드입니다:

```py
# 1. 시그널 `import`
from flask import request_started 

# 2. 시그널을 처리할 함수 만들기
def when_request_started(sender, **extra):
    print("Request received!")

# 3. 함수 연결
request_started.connect(when_request_started)
```

1. 먼저 [`request_started`](https://flask.palletsprojects.com/en/1.1.x/api/#flask.request_started)라는 시그널을 `import`로 가져옵니다. 이 시그널은 플라스크 내부에서 HTTP 요청이 처리되기 직전을 감지합니다. 이외에도 [`request_finished`](https://flask.palletsprojects.com/en/1.1.x/api/#flask.request_finished), [`template_rendered`](https://flask.palletsprojects.com/en/1.1.x/api/#flask.template_rendered) 등 [다양한 내장 시그널](https://flask.palletsprojects.com/en/1.1.x/api/#signals)이 있습니다.
2. 시그널을 처리할 함수를 만듭니다. 이때 시그널을 발생시킨 주체인 [`Flask`](https://flask.palletsprojects.com/en/1.1.x/api/#flask.Flask) 객체가 `sender`라는 매개변수로 들어옵니다. 만약 여러 플라스크 애플리케이션 객체를 사용하는 특수한 경우라면, 이 `sender`를 통해 앱 별로 필터링할 수 있습니다.
3. `request_started` 시그널의 [`connect()`](https://pythonhosted.org/blinker/#blinker.base.Signal.connect) 메서드를 통해 시그널 처리 함수를 시그널과 연결합니다. 또는 [**`@connect_via`**](https://pythonhosted.org/blinker/#blinker.base.Signal.connect_via)를 통해 데커레이터 형태로 함수를 등록할 수도 있습니다. 두 메서드의 실질적인 역할은 같습니다.

## 시그널 객체

Blinker에서 신호를 주고받기 위해서는 **시그널 객체**가 필요합니다. 시그널 객체의 [`send()`](https://pythonhosted.org/blinker/#blinker.base.Signal.send) 메서드를 통해 신호를 보낼 수 있으며, [`connect()`](https://pythonhosted.org/blinker/#blinker.base.Signal.connect) 메서드로 신호를 받는 함수를 연결할 수 있습니다.

보통은 플라스크 내장 시그널만을 사용하기 때문에 우리가 직접 시그널 객체를 만들 일은 거의 없을 겁니다. 다만 플라스크의 기능을 확장하는 라이브러리를 만든다면 직접 시그널을 만들어 백엔드 웹 개발자에게 제공해야 할 수도 있습니다.

### 이름 있는 시그널, 이름 없는 시그널

시그널 객체는 이름이 있는 경우와 없는 경우로 나뉘어집니다. **이름이 있는 경우** [`signal()`](https://pythonhosted.org/blinker/#blinker.base.signal)이라는 함수를 호출합니다. 소문자로 시작함에 유의하세요. 이 함수는 내부적으로 [`NamedSignal`](https://pythonhosted.org/blinker/#blinker.base.NamedSignal)이라는 객체를 만듭니다. **이름이 없는 경우** [`Signal()`](https://pythonhosted.org/blinker/index.html#blinker.base.Signal)을 호출해 생성합니다:

```py
from blinker import Signal, signal

named_ready = signal("named-ready")  # 이름 있는 시그널
anonymous_ready = Signal()  # 이름 없는 시그널
```

## 연결과 전송

[`connect()`](https://pythonhosted.org/blinker/#blinker.base.Signal.connect) 메서드를 통해 신호 처리 함수를 `signal` 객체와 연결합니다.

신호를 발생시키기 위해서는 시그널 객체의 [`send()`](https://pythonhosted.org/blinker/#blinker.base.Signal.send) 메서드를 호출해야 합니다. 플라스크 내장 시그널은 플라스크가 직접 신호를 발생시키기에 우리가 직접 `send()`메서드를 호출할 일은 거의 없습니다.

### `sender`

[`send()`](https://pythonhosted.org/blinker/#blinker.base.Signal.send)의 첫 번째 인자인 **`sender`로 누가 이 시그널을 일으켰는지에 대한 정보**를 보낼 수 있습니다. 이 `sender`는 시그널 감지 함수의 첫 번째 매개변수로 들어오는데, 이를 통해 특정 `sender`인 경우에만 신호를 처리하도록 할 수 있습니다.

[`connect()`](https://pythonhosted.org/blinker/#blinker.base.Signal.connect) 메서드에 `sender` 매개변수를 제공하면 특정 `sender`로부터 발생하는 신호만 처리하게 됩니다. 이를 통해 더 편리하게 **특정 `sender`만 처리**할 수 있습니다.

플라스크 내장 시그널은 Flask 객체를 sender로 전송합니다. 따라서 플라스크 앱이 여러 개 있을 경우, 시그널 감지 함수의 인자로 들어온 sender를 통해 앱 별 필터링이 가능합니다:

```py
def when_request_started(sender, **extra):
    print("Sender:", sender)

# 이벤트 등록 시 `app`이 일으킨 신호만 받도록 함
app = Flask(__name__)
request_started.connect(when_request_started, sender=app)
```

## 참고

- 파이썬 공식 문서 시그널: <https://flask.palletsprojects.com/en/1.1.x/signals/>
