[🏠 방성범 블로그](/README.md) > [🛜 IoT](/iot.md)

# MQTT 연결 방식

<time id="published" datetime="2019-08-16">2019. 8. 16.</time>

MQTT의 TLS 보안 연결이나 웹소켓을 통한 연결 방식에 대해 소개합니다.

## 일반

일반적인 MQTT 연결 방식입니다. 암호화되어있지 않으므로, **같은 Wi-Fi를 사용하는 경우** 타인이 감청할 수 있습니다.

하지만 어차피 민감한 데이터도 아니고, 암호화로 인한 성능 손실 또한 무시할 수 없기에 암호화하지 않아도 큰 문제는 없습니다.

## TLS(SSL) 암호화(encrypted)

메시지를 암호화하여 전송합니다. 타인이 감청할 수 없습니다. (메시지를 어떤 브로커와 주고받는지 정도는 감청할 수 있습니다) 앞서 말했듯 데이터의 낮은 민감도와 성능 손실로 인해 암호화하지 않고 통신하는 경우가 대부분입니다.

암호화 통신을 위해서는 공개 키 암호화, 인증서, OpenSSL에 대해 알아야 합니다. 처음 배운다면 까다로울 수 있습니다.

아두이노, ESP8266에서 MQTT 통신을 위해 사용하는 PubSubClient는 [아직 TLS(SSL)를 지원하지 않습니다](https://github.com/knolleary/pubsubclient/issues/462).

## 웹소켓

IoT 기기가 MQTT라는 프로토콜을 따라 통신하듯, 웹 페이지는 **HTTP**라는 프로토콜을 따라 동작합니다. 인터넷 익스플로러나 크롬과 같은 웹 브라우저는 HTTP만을 이해할 수 있을 뿐, MQTT를 통해 메시지를 보내거나 받는 기능을 포함하고 있지 않습니다.

웹 페이지에서 MQTT를 사용하기 위해서는 **웹소켓**을 통해야 합니다. 웹소켓은 HTTP 상에서 HTTP를 사용하지 않고 통신할 수 있는 웹 기술입니다. 말이 조금 이상한데, 정말 말 그대로 HTTP 상에서 HTTP 기능을 이용하지 않고 대신 다른 프로토콜을 사용할 수 있게 해줍니다.

다만 브로커가 웹소켓을 통한 방식을 지원해야 합니다. 다행히도 Mosquitto, HiveMQ, AWS IoT 등 대부분의 MQTT 브로커들은 웹소켓을 지원합니다.

관련 글:

- <https://www.hivemq.com/blog/mqtt-over-websockets-with-hivemq/>

## 웹소켓 + TLS

웹소켓을 TLS로 암호화할 수도 있습니다.
