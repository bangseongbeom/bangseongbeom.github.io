[🏠 방성범 블로그](/README.md) > [🛜 IoT](/iot.md)

# MQTT 소개

<time id="published" datetime="2019-08-16">2019. 8. 16.</time>

MQTT의 필요성과 특징에 대해 소개합니다.

## MQTT의 필요성

IoT는 인터넷에 연결되지 않았던 사물을 인터넷에 연결합니다. 전등, 시계, TV, 냉장고, 거울에 이르기까지, 인터넷을 통해 수많은 사물을 제어하고 사물로부터 실시간으로 정보를 얻습니다.

우리가 인터넷 익스플로러나 크롬과 같은 웹 브라우저로 인터넷을 사용하듯, IoT 사물 역시 인터넷을 사용해 데이터를 교환합니다. 하지만 IoT에서 사용하는 인터넷은 우리가 사용하는 인터넷과 달리 다음과 같은 기능을 필요로 합니다:

- **다 대 다 통신**이 필요합니다. 하나의 사물이 여러 사물에게 실시간으로 데이터를 주거나, 여러 사물로부터 데이터를 받아야 합니다.
- 일부 사물은 배터리로 동작합니다. **전력**을 아낄 필요가 있습니다.
- 현관문의 닫힘 상태와 같이 절대 손실되선 안 되는 데이터도 있지만, 방 안의 온도나 습도같이 어느 정도는 손실되어도 괜찮은 데이터도 있습니다. **중요한 데이터**는 더 꼼꼼히 확인하고, **덜 중요한 데이터**는 데이터 도착 확인 시간을 줄여 빠르게 보낼 수 있어야 합니다.
- 도중에 연결이 끊길 수도 있습니다. 연결이 끊겼을 때 **부드럽게 대처**할 수 있어야 합니다.

데이터 교환을 위해 반드시 위와 같은 기능이 필요한 것은 아닙니다. 그러나 저런 기능이 존재한다면 사물 간에 더 효과적으로 통신할 수 있습니다.

---

**MQTT**는 IoT 사물을 제어하는 데 적격인 프로토콜입니다. 프로토콜은 우리말로 **통신 규약**이라 합니다. 통신 규약이란 상호간에 '통신 중 이런 식으로 데이터를 보내고 이런 식으로 받자'같은 것을 정해놓은 일종의 규칙입니다.

MQTT 프로토콜에 따라 통신할 경우 다 대 다 통신, 전력 소모 감소, 연결 중단 시 부드러운 대처 등 다양한 이점을 누릴 수 있습니다.

반대로 우리가 사용하는 인터넷은 **HTTP**라는 프로토콜을 따르고 있습니다. 이 프로토콜을 통해서도 IoT 사물 간에 데이터를 주고받을 수도 있지만, 효율적으로 통신하기 어렵습니다.

(MQTT는 규칙일 뿐 프로그램이 아닙니다. 실제로 MQTT를 사용하기 위해서는 이 규칙에 따라 구현한 프로그램을 사용해야 합니다. 대표적으로 [Mosquitto](https://mosquitto.org), [PubSubClient](https://pubsubclient.knolleary.net/)가 있습니다.)

## 특징

### 최소화된 부가 정보

통신 시 실제로 주고받아야 할 데이터만 교환하는 것은 아닙니다. 데이터를 보내는 시간이라든가, 데이터를 전송하는 사람의 정보 등 눈에 보이지 않는 데이터도 메시지와 함께 전송됩니다.

MQTT는 이러한 부가 정보의 양을 최대한 줄임으로서 통신 시간 및 부가 정보를 해석하는 시간을 줄여, 최종적으로 전력을 덜 소모하도록 합니다.

관련 글:

- <http://www.steves-internet-guide.com/mqtt-protocol-messages-overview/>

### 발행, 구독 체계

사물의 종류가 다양한 만큼, 인터넷에 접속하는 클라이언트의 수도 그만큼 많습니다. 때문에 사물 간에 데이터를 교환하기 위해 일 대 일로 통신하는 것은 비효율적입니다. MQTT에서는 자신이 만들어낼 수 있는 데이터를 메시지에 담아 **발행**하고, 필요한 사물은 이를 **구독**하는 방식을 취합니다.

이를 위해서는 먼저 데이터를 교환하기 위한 중앙 컴퓨터가 필요합니다. 이 컴퓨터를 가리켜 **브로커**라 합니다. 브로커에는 각 사물로부터 들어온 수많은 데이터가 있습니다. 브로커에 데이터를 발행하거나 구독하는 각각의 사물을 **클라이언트**라 칭합니다.

### QoS(서비스 품질)

MQTT에서는 데이터의 중요도에 따라 메시지를 달리 보낼 수 있습니다. 이를 가리켜 QoS(서비스 품질)라 합니다.

중요한 데이터의 경우 데이터가 잘 보내졌나 확인하는 메시지를 내부적으로 여러 번 보냅니다. 확인하는 시간이 늘어나지만, 그만큼 데이터의 전송을 확실히 보장합니다.

반대로 데이터가 별로 중요하지 않다면 별도의 확인 절차 없이 전송합니다. 데이터가 소실될 위험이 있지만, 확인하는 시간을 줄인 만큼 더 빠르게 보낼 수 있습니다.

### 유언 메시지

모든 사물이 항상 정상 작동한다고 보장할 수는 없습니다. 전원 차단, 네트워크 연결 장애, 합선 등으로 인해 언제든 연결이 해제될 수 있습니다.

각 사물은 자신이 죽었을 때(연결이 끊길 때)를 대비해 브로커에게 미리 유언을 남겨둘 수 있습니다. 일정 시간 동안 응답이 없을 경우, 브로커는 유언 메시지를 전송합니다.
