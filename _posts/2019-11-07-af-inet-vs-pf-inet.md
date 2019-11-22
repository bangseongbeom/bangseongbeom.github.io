---
title: AF_INET vs PF_INET
category: linux
---

리눅스 소켓 프로그래밍에서, IP 프로토콜을 지정하는 데 사용하는 상수로는 `AF_INET`과 `PF_INET`이 있습니다. 이 둘의 차이가 무엇일까요?

## `AF_INET`과 `PF_INET`의 비교

`AF_INET`
:   - **IP 주소 체계**를 지정합니다. (192.168.0.1, 8.8.4.4같은 주소들을 사용하는 체계)
    - [`sockaddr_in`](http://man7.org/linux/man-pages/man7/ip.7.html)같이 주소 체계를 결정해야 하는 구조체에서 사용합니다.
    - `AF_INET`의 AF는 **A**ddress **F**amily(주소 패밀리)의 줄임말입니다. 주소 체계를 지정하기 위한 표현 앞에는 모두 AF가 들어갑니다. `AF_IPX`, `AF_APPLETALK` 등이 있습니다.

`PF_INET`
:   - **IP 프로토콜**을 지정합니다.
    - [`socket()`](http://man7.org/linux/man-pages/man2/socket.2.html)같이 프로토콜을 지정해야 하는 함수에서 사용합니다.
    - `PF_INET`의 PF는 **P**rotocol **F**amily(프로토콜 패밀리)의 줄임말입니다. 프로토콜을 지정하기 위한 표현 앞에는 모두 PF가 들어갑니다. `PF_IPX`, `PF_APPLETALK` 등이 있습니다.

## 왜 두 개나 있을까

IP라는 프로토콜을 표현하기 위해 `AF_INET`과 `PF_INET`이라는 두 개의 방법이 존재한다는 것이 이상하게 느껴질 수 있습니다. 왜 굳이 주소 체계와 프로토콜을 따로 분리하여 표현할까요? 어차피 IP 주소 체계는 IP 프로토콜에서만 사용될텐데 말이죠.

이유는 이렇습니다. 아주 오래 전 소켓 프로그래밍을 설계할 당시에는, **하나의 주소 체계가 여러 프로토콜을 지원**할 것을 염두에 두고 만들었습니다[^bgnet-1]. 이를테면 IP 주소가 IP 프로토콜뿐만 아니라 다른 프로토콜도 지원하는 식입니다.

[^bgnet-1]:
    <http://beej.us/guide/bgnet/html/#socket>

    > Once upon a time, a long time ago, it was thought that maybe an address family (what the “AF” in “AF_INET” stands for) might support several protocols that were referred to by their protocol family (what the “PF” in “PF_INET” stands for).

이렇게 되면 두 개념(주소 체계, 프로토콜)을 구별할 필요가 생깁니다. 주소 체계는 프로토콜과 개별적으로 사용될 수 있기 때문입니다. **IP 주소 체계를 사용한다고 해서 더 이상 IP 이것이 프로토콜의 사용을 의미하지 않습니다**.

그러므로 코드에서도 차이를 두어 **주소 체계와 프로토콜을 구분**하는 편이 좋습니다. IP의 경우 IP 주소 체계를 위한 `AF_INET`, IP 프로토콜을 위한 `PF_INET`으로 나뉘어 있습니다.

## 의도는 좋았다. 그러나...

그러나, 설계 당시의 의도대로 하나의 주소 체계가 여러 프로토콜을 지원하는 일은 실제로 일어나지 않았습니다[^bgnet-2]. 오늘날까지도 **IP 주소는 오직 IP 프로토콜에서만 사용**합니다.

[^bgnet-2]:
    <http://beej.us/guide/bgnet/html/#socket>

    > That didn’t happen. And they all lived happily ever after, The End.

더 이상 AF와 PF의 구분은 의미가 없습니다. 지금의 [리눅스 커널](https://github.com/torvalds/linux/blob/26bc672134241a080a83b2ab9aa8abede8d30e1c/include/linux/socket.h#L215-L219)은 `PF_INET`이 `AF_INET`과 같은 값을 가지고록 정의하고 있습니다:

```c
/* Protocol families, same as address families. */
#define PF_UNSPEC	AF_UNSPEC
#define PF_UNIX		AF_UNIX
#define PF_LOCAL	AF_LOCAL
#define PF_INET		AF_INET
```

## 권장 방식

두 가지 방식이 있습니다.

[`socket()` 함수에 관한 리눅스 man 페이지](http://man7.org/linux/man-pages/man2/socket.2.html#NOTES)에서는 모든 곳에 AF를 사용하길 권장합니다:

> ... already the BSD man page promises: "The protocol family generally is the same as the address family", and subsequent standards **use AF_\* everywhere.**

반면, 유명한 소켓 프로그래밍 입문서인 <Beej's Guide to Network Programming>에서는 [AF_INET과 PF_INET을 설계 당시의 의도대로 구별하여 사용](http://beej.us/guide/bgnet/html/#socket)하고 있습니다:

> So the most correct thing to do is to **use AF_INET in your struct sockaddr_in and PF_INET in your call to socket()**.
