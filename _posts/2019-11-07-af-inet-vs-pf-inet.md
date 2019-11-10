---
title: AF_INET vs PF_INET
category: linux
---

리눅스 소켓 프로그래밍에서 `AF_INET`과 `PF_INET`의 차이에 대해 알아봅니다.

## 원래 의도

초창기 소켓 프로그래밍 API를 설계할 당시에는, **하나의 주소 체계가 여러 프로토콜을 지원**할 것을 염두에 두고 만들었습니다. 예를 들자면, IP 주소가 IP 프로토콜뿐만 아니라 다른 프로토콜도 지원하는 식입니다.

둘의 구분을 위해 **주소의 종류**를 지정해야 하는 경우와 **프로토콜의 종류**를 지정해야 하는 경우 각각 다른 값을 사용하기로 했습니다. IP를 IP **주소**와 IP **프로토콜**로 분리하는 셈이죠:

- [`sockaddr_in.sin_family`](http://man7.org/linux/man-pages/man7/ip.7.html)같이 주소를 지정해야 하는 경우, **AF로 시작하는 상수**를 사용합니다 (**AF**는 **A**ddress **F**amily(주소 패밀리)의 줄임말입니다):

    - IP **주소**: `AF_INET`
    - IPX **주소**: `AF_IPX`
    - 애플토크 **주소**: `AF_APPLETALK`

- [`socket()`](http://man7.org/linux/man-pages/man2/socket.2.html)같이 프로토콜을 지정해야 하는 경우, **PF로 시작하는 상수**만 사용합니다 (**PF**는 **P**rotocol **F**amily(프로토콜 패밀리)의 줄임말입니다):

    - IP **프로토콜**: `PF_INET`
    - IPX **프로토콜**: `PF_IPX`
    - 애플토크 **프로토콜**: `PF_APPLETALK`

## AF와 PF는 같다

그러나 원래 의도하던 대로 하나의 주소 체계가 여러 프로토콜을 지원하는 일은 실제로 일어나지 않았습니다. IP 주소는 오직 IP 프로토콜만 사용합니다. 다른 프로토콜 역시 마찬가지였죠.

그렇다고 AF와 PF 둘 중에 하나를 제거해버린다면 하위 호환성이 깨져 컴파일에 실패할 것입니다. 그래서 제거 대신 `PF_INET`와 `AF_INET` 모두 같은 값으로 정의하는 식으로 해결했습니다([/include/linux/socket.h](https://github.com/torvalds/linux/blob/26bc672134241a080a83b2ab9aa8abede8d30e1c/include/linux/socket.h#L215-L219)):

```c
/* Protocol families, same as address families. */
#define PF_UNSPEC	AF_UNSPEC
#define PF_UNIX		AF_UNIX
#define PF_LOCAL	AF_LOCAL
#define PF_INET		AF_INET
```

## 권장 방식: 모든 곳에 AF를 쓰자

리눅스 문서에서는 모든 곳에 AF를 사용하길 권장합니다:

<http://man7.org/linux/man-pages/man2/socket.2.html#NOTES>
> ... already the BSD man page promises: "The protocol family generally is the same as the address family", and subsequent standards **use AF_\* everywhere.**

## 참고

- <http://www.cs.ubbcluj.ro/~dadi/compnet/labs/socketstheory/syscalls.html>

    > In some documentation, you'll see mention of a mystical "PF_INET". This is a weird etherial beast that is rarely seen in nature, but I might as well clarify it a bit here. Once a long time ago, it was thought that maybe a address family (what the "AF" in "AF_INET" stands for) might support several protocols that were referenced by their protocol family (what the "PF" in "PF_INET" stands for).
    >
    > That didn't happen. Oh well. So the correct thing to do is to use AF_INET in your struct sockaddr_in and PF_INET in your call to socket(). But practically speaking, you can use AF_INET everywhere. And, since that's what W. Richard Stevens does in his book, that's what I'll do here.
