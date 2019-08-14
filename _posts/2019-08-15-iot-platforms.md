---
title: IoT 플랫폼 업체 비교
category: maker
---

IoT 센서로부터 데이터를 얻거나 IoT 기기에 명령을 내리기 위해서는 먼저 데이터를 교환할 서버가 필요합니다. 라즈베리파이 등을 이용해 IoT 기기를 제어하는 서버로서 사용할 수도 있지만, 기기를 따로 마련해야 할 뿐더러 직접 손으로 구축, 관리해야 한다는 부담이 있습니다.

IoT 플랫폼 업체를 통한다면 힘들여 서버를 구축하지 않아도 됩니다. 기기를 제어하기 위한 대시보드, 다른 서비스와의 연동 기능을 몇 번의 클릭만으로 적용할 수 있어 무척 편리합니다.

## 요약 정리

| | [Adafruit IO](https://io.adafruit.com/) | [Blynk](https://blynk.io) | [ThingSpeak](https://thingspeak.com/) | [dweet.io](http://dweet.io/)<br />[dweetpro.io](https://dweetpro.io/) | [Mosquitto Test Server](https://test.mosquitto.org/) | [HiveMQ Public Broker](http://www.mqtt-dashboard.com/) | [AWS IoT](https://aws.amazon.com/iot/) | [CloudMQTT](https://www.cloudmqtt.com/) | [Solace PubSub+](https://solace.com/cloud/) |
|---|---|---|---|---|---|---|---|---|---|
| 종류 | IoT 플랫폼 | IoT 플랫폼 | IoT 플랫폼 + MATLAB | IoT 플랫폼 | **테스트 용** MQTT 브로커 | **테스트 용** MQTT 브로커 | IoT 플랫폼 | MQTT 브로커 호스팅 | MQTT 브로커 호스팅 |
| 무료 사용 | ✔️ [피드 10개 무료](https://io.adafruit.com/) (피드: MQTT의 토픽과 유사) | ⚠️ [데이터 업로드/다운로드 무제한, UI 위젯 약 5-10개 무료](http://help.blynk.cc/en/articles/580927-how-much-does-blynk-cost) | ⚠️ [채널 4개 무료](https://thingspeak.com/pages/license_faq) (채널: MQTT의 토픽과 유사) | ✔️ [기기 당 5초에 메시지 1개 무료 (대시보드는 유료)](https://dweetpro.io/pricing.html) | ⚠️ 무료 (**모두가 데이터를 볼 수 있음**) | ⚠️ 무료 (**모두가 데이터를 볼 수 있음**) | ⚠️ [12개월 무료](https://aws.amazon.com/ko/free/?all-free-tier.sort-by=item.additionalFields.SortRank&all-free-tier.sort-order=asc&awsf.Free%20Tier%20Categories=productcategories%23internetofthings) | ⚠️ [동시 연결 5개 무료](https://www.cloudmqtt.com/plans.html) | ✔️ [동시 연결 50개 무료](https://solace.com/cloud/pricing/) |
| 가격 정책 | 😃 [피드 무제한 월 10,000원](https://io.adafruit.com/plus) | 😞 [UI 위젯 하나에 500-1,000원](http://help.blynk.cc/en/articles/580927-how-much-does-blynk-cost) | 😞 [1년 65만 원](https://thingspeak.com/prices/thingspeak_standard) ([상용이 아니라면 더 저렴](https://thingspeak.com/prices/thingspeak_home)) | 😞 [기기 당 월 2,000원](https://dweetpro.io/pricing.html) | 테스트 용 | 테스트 용 | 😐 [복잡함](https://aws.amazon.com/iot-core/pricing/) | 😐 [동시 연결 100개 월 20,000원](https://www.cloudmqtt.com/plans.html) | 😞 [동시 연결 100개 월 45,000원](https://solace.com/cloud/pricing/) |
| 전용 라이브러리 | ✔️ [ESP8266, ESP32, 파이썬](https://io.adafruit.com/api/docs/#client-libraries) | ✔️ [ESP8266, ESP32, 파이썬](https://docs.blynk.cc/#supported-hardware) | ❌ 미지원 | ❌ 미지원 | ❌ 미지원 | ❌ 미지원 | ⚠️ [ESP32](https://docs.aws.amazon.com/freertos/latest/userguide/getting_started_espressif.html), [라즈베리파이](https://docs.aws.amazon.com/greengrass/latest/developerguide/setup-filter.rpi.html) (ESP8266 미지원) | ❌ 미지원 | ❌ 미지원 |
| HTTP REST | ✔️ 지원 | ✔️ 지원 | ✔️ 지원 | ✔️ 지원 | ❌ 미지원 | ❌ 미지원 | ✔️ 지원 | ✔️ 지원 | ✔️ 지원 |
| MQTT | ⚠️ 지원 ([정해진 토픽 구조로만 가능](https://io.adafruit.com/api/docs/mqtt.html#feed-topic-format)) | ❌ 미지원 | ⚠️ 지원 ([정해진 토픽 구조로만 가능](https://www.mathworks.com/help/thingspeak/publishtoachannelfeed.html)) | ❌ 미지원 | ✔️ 지원 | ✔️ 지원 | ✔️ 지원 | ✔️ 지원 |✔️ 지원 |
| 데스크톱 대시보드 | ✔️ 웹 기반 | ❌ 미지원 | ✔️ 웹 기반, 버튼과 같은 상호 작용 위젯 미제공 ([예시](https://www.mathworks.com/help/thingspeak/embed-a-chart.html)) | ✔️ 웹 기반, 무료는 지원 안 함 ([예시](http://freeboard.io/)) | ❌ 미지원 | ❓ | ✔️ 웹 기반 ([예시](https://docs.aws.amazon.com/iot/latest/developerguide/view-mqtt-messages.html)) | ❓ | ❓ |
| 모바일 대시보드 | ✔️ 웹 기반, 모바일 레이아웃 ([예시](https://learn.adafruit.com/adafruit-io-basics-digital-output)) | ✔️ 안드로이드, iOS 기반 ([예시](https://docs.blynk.cc/#blynk-main-operations-devices-online-status)) | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | 

## 홈 오토메이션: [Adafruit IO](https://io.adafruit.com/)

[Adafruit IO](https://io.adafruit.com/)는 집 안에서의 IoT 기기 제어를 손쉽게 하기 위해 [Adafruit](https://www.adafruit.com/)에서 만든 IoT 플랫폼입니다. Adafruit는 메이커를 위한 강좌, 아두이노 IDE에서 동작하는 여러 라이브러리를 만듭니다. 그리고 IoT와 관련된 여러 기기를 만드는 제조사로도 유명합니다.

IoT 환경을 집에서 직접 구축하는 데 있어 가장 중요한 것은 편의성입니다. Adafruit IO는 편리한 개발을 위해 전용 라이브러리를 제공합니다. IoT 기기를 원격으로 제어하기 위한 대시보드 역시 드래그 앤 드롭으로 빠르게 만들 수 있습니다. 웹 기반으로 동작하기에 데스크톱, 모바일을 가리지 않고 언제 어디서나 제어할 수 있습니다.

금전적인 부분도 빼놓을 수 없습니다. [월 10,000원 정도의 추가금을 지불하면 무제한](https://io.adafruit.com/plus)으로 사용할 수 있지만, 규모가 크지 않다면 무료로 제공하는 [10개의 피드](https://io.adafruit.com/)로도 충분합니다. (피드는 MQTT의 토픽과 유사한 개념으로, 하나의 데이터 흐름을 뜻합니다)

## 상용: [AWS IoT](https://aws.amazon.com/iot/), [Blynk](https://blynk.io/)

AWS는 여전히 인기 있는 클라우드 제공자입니다. [AWS IoT](https://aws.amazon.com/iot/) 역시 그 명성에 걸맞게 다양한 기능을 제공합니다. 특히 가장 강력한 장점은 AWS의 다른 서비스들과 손쉽게 연동할 수 있다는 것입니다. [Amazon Kinesis](https://aws.amazon.com/kinesis/), [Amazon MSK](https://aws.amazon.com/msk/)를 통해 데이터를 실시간으로 분석하거나 가치 있는 정보를 찾아낼 수 있습니다.

[Blynk](https://blynk.io/)는 모바일 대시보드를 만드는데 있어 탁월합니다. 아름다운 UI, 실시간 제어, 데이터 시각화를 제공합니다. 사용자에게 멋진 애플리케이션을 제공하고 싶다면 다소 값이 나가더라도 Blynk를 사용하는 것이 좋은 선택일 것입니다.

## MQTT 테스트: [Mosquitto Test Server](https://test.mosquitto.org/), [HiveMQ Public Broker](http://www.mqtt-dashboard.com/), [Solace PubSub+](https://solace.com/cloud/)

MQTT 프로토콜만을 테스트하고 싶다면 [Mosquitto Test Server](https://test.mosquitto.org/), [HiveMQ Public Broker](http://www.mqtt-dashboard.com/), [Solace PubSub+](https://solace.com/cloud/)를 사용하세요. 이들은 무료로도 충분한 규모의 MQTT 브로커를 제공합니다.
