---
title: AF_INET vs PF_INET
category: linux
---

리눅스 소켓 프로그래밍에서, IP 프로토콜을 지정하는 데 사용하는 상수로는 `AF_INET`과 `PF_INET`이 있습니다. 이 둘의 차이가 무엇일까요?

## 원래 의도

초창기 개발자들이 소켓 프로그래밍을 설계할 당시에는, **하나의 주소 체계가 여러 프로토콜을 지원**할 것을 염두에 두고 만들었습니다.[^bgnet-1].

[^bgnet-1]:
    <http://beej.us/guide/bgnet/html/#socket>

    > Once upon a time, a long time ago, it was thought that maybe an address family (what the “AF” in “AF_INET” stands for) might support several protocols that were referred to by their protocol family (what the “PF” in “PF_INET” stands for).

이를 위해, 소켓 프로그래밍에서는 프로토콜 주소 체계와 프로토콜 자체를 하나의 개념으로 보는 것이 아니라 별개의 개념으로 봅니다.

IP 프로토콜 역시 마찬가지로 IP 주소 체계와 IP 프로토콜 자체로 나뉘어져 있습니다:

- **`AF_INET`은 IP 주소 체계를 지정할 때 사용합니다**. [`sockaddr_in`](http://man7.org/linux/man-pages/man7/ip.7.html)같이 주소 체계를 결정해야 하는 구조체에서 사용합니다.
    - `AF_INET`의 AF는 **A**ddress **F**amily(주소 패밀리)의 줄임말입니다. 주소 체계를 지정하기 위한 표현 앞에는 모두 AF가 들어갑니다. `AF_IPX`, `AF_APPLETALK` 등이 있습니다.
- **`PF_INET`은 IP 프로토콜을 지정합니다**. [`socket()`](http://man7.org/linux/man-pages/man2/socket.2.html)같이 프로토콜을 지정해야 하는 함수에서 사용합니다.
    - `PF_INET`의 PF는 **P**rotocol **F**amily(프로토콜 패밀리)의 줄임말입니다. 프로토콜을 지정하기 위한 표현 앞에는 모두 PF가 들어갑니다. `PF_IPX`, `PF_APPLETALK` 등이 있습니다.

## 의도는 좋았다. 그러나...

그러나 설계 당시의 의도대로 하나의 주소 체계가 여러 프로토콜을 지원하는 일은 실제로 일어나지 않았습니다[^bgnet-2]. 오늘날까지도 **IP 주소는 오직 IP 프로토콜에서만 사용**합니다.

[^bgnet-2]:
    <http://beej.us/guide/bgnet/html/#socket>

    > That didn’t happen. And they all lived happily ever after, The End.

더 이상 AF와 PF의 구분은 의미가 없기에, 지금의 `PF_INET`는 `AF_INET`으로서 정의되어 있습니다(결국 `PF_INET`과 `AF_INET`은 같은 값을 가집니다):

[/include/linux/socket.h](https://github.com/torvalds/linux/blob/26bc672134241a080a83b2ab9aa8abede8d30e1c/include/linux/socket.h#L215-L219)

```c
/* Protocol families, same as address families. */
#define PF_UNSPEC	AF_UNSPEC
#define PF_UNIX		AF_UNIX
#define PF_LOCAL	AF_LOCAL
#define PF_INET		AF_INET
```

## 권장 방식

[`socket()` 함수에 관한 리눅스 man 페이지](http://man7.org/linux/man-pages/man2/socket.2.html#NOTES)에서는 모든 곳에 AF를 사용하길 권장합니다:

> ... already the BSD man page promises: "The protocol family generally is the same as the address family", and subsequent standards **use AF_\* everywhere.**

유명한 소켓 프로그래밍 입문서인 <Beej's Guide to Network Programming>에서는 [AF_INET과 PF_INET을 설계 당시의 의도대로 구별하여 사용](http://beej.us/guide/bgnet/html/#socket)하고 있습니다:

> So the most correct thing to do is to **use AF_INET in your struct sockaddr_in and PF_INET in your call to socket()**.
