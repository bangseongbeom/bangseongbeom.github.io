[방성범 블로그](/README.md) > [IoT](/iot.md)

# IoT 플랫폼 업체 비교

<time id="date-published" datetime="2019-08-15">2019. 8. 15.</time>

홈 오토메이션이나 IoT 제품 개발을 위해 어떤 IoT 플랫폼을 사용해야 할까요? [Adafruit IO](https://io.adafruit.com/), [Blynk](https://blynk.io), [ThingSpeak](https://thingspeak.com/), [AWS IoT](https://aws.amazon.com/iot/) 등 여러 업체를 비교해보았습니다.

## 요약 정리

### 가격 정책

|                                                                       | 무료 사용                                                | 가격 정책                                |
| --------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------- |
| [Adafruit IO](https://io.adafruit.com/)                               | 😃 피드 10개 무료 (피드: MQTT의 토픽과 유사)             | 😃 피드 무제한 월 10,000원               |
| [Blynk](https://blynk.io)                                             | 😞 데이터 업로드/다운로드 무제한, UI 위젯 약 5-10개 무료 | 😞 UI 위젯 하나에 500-1,000원            |
| [ThingSpeak](https://thingspeak.com/)                                 | 😞 채널 4개 무료 (채널: MQTT의 토픽과 유사)              | 😞 1년 65만 원 (상용이 아니라면 더 저렴) |
| [dweet.io](http://dweet.io/)<br />[dweetpro.io](https://dweetpro.io/) | 😃 기기 당 5초에 메시지 1개 무료 (대시보드는 유료)       | 😞 기기 당 월 2,000원                    |
| [Mosquitto Test Server](https://test.mosquitto.org/)                  | ⚠️ 무료 (모두가 데이터를 볼 수 있음)                     | ⚠️ 없음                                  |
| [HiveMQ Public Broker](http://www.mqtt-dashboard.com/)                | ⚠️ 무료 (모두가 데이터를 볼 수 있음)                     | ⚠️ 없음                                  |
| [AWS IoT](https://aws.amazon.com/iot/)                                | 😞 12개월 무료                                           | 😐 복잡함                                |
| [CloudMQTT](https://www.cloudmqtt.com/)                               | 😞 동시 연결 5개 무료                                    | 😐 동시 연결 100개 월 20,000원           |
| [Solace PubSub+](https://solace.com/cloud/)                           | 😃 동시 연결 50개 무료                                   | 😞 동시 연결 100개 월 45,000원           |

### 라이브러리 및 프로토콜 지원

|                                                                       | 전용 라이브러리                         | HTTP REST | MQTT                                |
| --------------------------------------------------------------------- | --------------------------------------- | --------- | ----------------------------------- |
| [Adafruit IO](https://io.adafruit.com/)                               | ✔️ ESP8266, ESP32, 파이썬               | ✔️ 지원   | ⚠️ 지원 (정해진 토픽 구조로만 가능) |
| [Blynk](https://blynk.io)                                             | ✔️ ESP8266, ESP32, 파이썬               | ✔️ 지원   | ❌ 미지원                           |
| [ThingSpeak](https://thingspeak.com/)                                 | ❌ 미지원                               | ✔️ 지원   | ⚠️ 지원 (정해진 토픽 구조로만 가능) |
| [dweet.io](http://dweet.io/)<br />[dweetpro.io](https://dweetpro.io/) | ❌ 미지원                               | ✔️ 지원   | ❌ 미지원                           |
| [Mosquitto Test Server](https://test.mosquitto.org/)                  | ❌ 미지원                               | ❌ 미지원 | ✔️ 지원                             |
| [HiveMQ Public Broker](http://www.mqtt-dashboard.com/)                | ❌ 미지원                               | ❌ 미지원 | ✔️ 지원                             |
| [AWS IoT](https://aws.amazon.com/iot/)                                | ⚠️ ESP32, 라즈베리파이 (ESP8266 미지원) | ✔️ 지원   | ✔️ 지원                             |
| [CloudMQTT](https://www.cloudmqtt.com/)                               | ❌ 미지원                               | ✔️ 지원   | ✔️ 지원                             |
| [Solace PubSub+](https://solace.com/cloud/)                           | ❌ 미지원                               | ✔️ 지원   | ✔️ 지원                             |

### 대시보드 지원

|                                                                       | 데스크톱 대시보드                                    | 모바일 대시보드                    |
| --------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------- |
| [Adafruit IO](https://io.adafruit.com/)                               | ✔️ 웹 기반                                           | ✔️ 웹 기반, 모바일 레이아웃 (예시) |
| [Blynk](https://blynk.io)                                             | ❌ 미지원                                            | ✔️ 안드로이드, iOS 기반 (예시)     |
| [ThingSpeak](https://thingspeak.com/)                                 | ✔️ 웹 기반, 버튼과 같은 상호 작용 위젯 미제공 (예시) | ❓                                 |
| [dweet.io](http://dweet.io/)<br />[dweetpro.io](https://dweetpro.io/) | ✔️ 웹 기반, 무료는 지원 안 함 (예시)                 | ❓                                 |
| [Mosquitto Test Server](https://test.mosquitto.org/)                  | ❌ 미지원                                            | ❓                                 |
| [HiveMQ Public Broker](http://www.mqtt-dashboard.com/)                | ❓                                                   | ❓                                 |
| [AWS IoT](https://aws.amazon.com/iot/)                                | ✔️ 웹 기반 (예시)                                    | ❓                                 |
| [CloudMQTT](https://www.cloudmqtt.com/)                               | ❓                                                   | ❓                                 |
| [Solace PubSub+](https://solace.com/cloud/)                           | ❓                                                   | ❓                                 |

## 추천 서비스

### 홈 오토메이션: [Adafruit IO](https://io.adafruit.com/)

전등이나 스위치 제어 등 홈 오토메이션을 위해서는 [Adafruit IO](https://io.adafruit.com/)를 추천합니다.

[Adafruit IO](https://io.adafruit.com/)는 [Adafruit](https://www.adafruit.com/)에서 만든 IoT 플랫폼입니다. Adafruit는 메이커를 위한 강좌나, 아두이노 IDE에서 동작하는 여러 라이브러리를 만듭니다. 그리고 IoT와 관련된 여러 기기를 만드는 제조사로도 유명합니다.

IoT 환경을 집에서 직접 구축하는 데 있어 가장 중요한 것은 편의성입니다. Adafruit IO는 편리한 개발을 위해 **전용 라이브러리를 제공**합니다. MQTT를 배우지 않아도 됩니다.

IoT 기기를 원격으로 제어하기 위한 **대시보드** 역시 드래그 앤 드롭으로 빠르게 만들 수 있습니다. 웹 기반으로 동작하기에 데스크톱, 모바일을 가리지 않고 언제 어디서나 제어할 수 있습니다.

금전적인 부분도 빼놓을 수 없습니다. 규모가 크지 않다면 **무료로 제공하는 [10개의 피드](https://io.adafruit.com/)로도 충분**합니다. (피드는 MQTT의 토픽과 유사한 개념으로, 하나의 데이터 흐름을 뜻합니다) [월 10,000원 정도의 추가금을 지불하면 피드를 무제한](https://io.adafruit.com/plus)으로 사용할 수도 있습니다.

### 상용 서비스: [AWS IoT](https://aws.amazon.com/iot/), [Blynk](https://blynk.io/)

AWS는 여전히 인기 있는 클라우드 제공자입니다. [AWS IoT](https://aws.amazon.com/iot/) 역시 그 명성에 걸맞게 다양한 기능을 제공합니다. 특히 가장 강력한 장점은 **AWS의 다른 서비스들과 손쉽게 연동**할 수 있다는 것입니다. [Amazon Kinesis](https://aws.amazon.com/kinesis/), [Amazon MSK](https://aws.amazon.com/msk/)를 통해 데이터를 실시간으로 분석하거나 가치 있는 정보를 찾아낼 수 있습니다.

[Blynk](https://blynk.io/)는 **모바일 대시보드**를 만드는데 있어 탁월합니다. 아름다운 UI, 실시간 제어, 데이터 시각화를 제공합니다. 사용자에게 멋진 애플리케이션을 제공하고 싶다면 다소 값이 나가더라도 Blynk를 사용하는 것이 좋은 선택일 것입니다.

### MQTT 테스트 용: [Mosquitto Test](https://test.mosquitto.org/), [HiveMQ Public](http://www.mqtt-dashboard.com/), [Solace PubSub+](https://solace.com/cloud/)

MQTT 프로토콜만을 테스트하고 싶다면 [Mosquitto Test Server](https://test.mosquitto.org/), [HiveMQ Public Broker](http://www.mqtt-dashboard.com/), [Solace PubSub+](https://solace.com/cloud/)를 사용하세요. 이들은 무료로도 충분한 규모의 MQTT 브로커를 제공합니다.

[이외에도 다양한 공개 MQTT 브로커가 있습니다.](https://github.com/mqtt/mqtt.github.io/wiki/public_brokers)
