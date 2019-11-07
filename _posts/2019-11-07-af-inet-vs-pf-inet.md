---
title: AF_INET vs PF_INET
category: linux
---

리눅스 소켓 프로그래밍에서 `AF_INET`과 `PF_INET`의 차이에 대해 알아봅니다.

## 원래 의도

초창기 소켓 프로그래밍 API를 설계할 당시에는, **하나의 주소 체계가 여러 프로토콜을 지원**할 것을 염두에 두고 만들었습니다. 두 프로토콜이 서로 다르다고 할지라도 같은 주소 체계를 사용할 가능성도 있으니까요. **(물론 실제로 그런 일은 일어나지 않았죠.)**[^dadi]

[^dadi]:
    <http://www.cs.ubbcluj.ro/~dadi/compnet/labs/socketstheory/syscalls.html>

    > In some documentation, you'll see mention of a mystical "PF_INET". This is a weird etherial beast that is rarely seen in nature, but I might as well clarify it a bit here. Once a long time ago, it was thought that maybe a address family (what the "AF" in "AF_INET" stands for) might support several protocols that were referenced by their protocol family (what the "PF" in "PF_INET" stands for).
    >
    > That didn't happen. Oh well. So the correct thing to do is to use AF_INET in your struct sockaddr_in and PF_INET in your call to socket(). But practically speaking, you can use AF_INET everywhere. And, since that's what W. Richard Stevens does in his book, that's what I'll do here.

예를 들자면, IP 주소가 IP(인터넷 프로토콜)뿐만 아니라 다른 프로토콜도 지원하는 식입니다.

그래서 다음과 같이 설계했습니다:

- 주소를 지정하는 역할을 하는 `struct sockaddr_in`에는 `AF_INET`, `AF_IPX` 등 **AF**로 시작하는 상수만 사용합니다. AF는 **A**ddress **F**amily의 줄임말입니다.
- 실제 통신을 담당하는 `socket()`에는 `PF_INET`, `PF_IPX` 등 **PF**로 시작하는 상수만 사용합니다. PF는 **P**rotocol **F**amily의 줄임말입니다.

## 실제로 두 값은 같다

하나의 주소 체계가 여러 프로토콜을 지원하는 일은 실제로 일어나지 않았습니다. 리눅스 커널 코드를 살펴보면, `PF_INET`이 `AF_INET`과 같은 값으로 정의되어 있음을 알 수 있습니다([/include/linux/socket.h](https://github.com/torvalds/linux/blob/26bc672134241a080a83b2ab9aa8abede8d30e1c/include/linux/socket.h#L215-L219)):

```c
/* Protocol families, same as address families. */
#define PF_UNSPEC	AF_UNSPEC
#define PF_UNIX		AF_UNIX
#define PF_LOCAL	AF_LOCAL
#define PF_INET		AF_INET
```

## 권장 방식: 모든 곳에 AF를 쓰자

문서에서는 모든 곳에 AF를 사용하길 권장합니다:

<http://man7.org/linux/man-pages/man2/socket.2.html#NOTES>
> The manifest constants used under 4.x BSD for protocol families are PF_UNIX, PF_INET, and so on, while AF_UNIX, AF_INET, and so on are used for address families.  However, already the BSD man page promises: "The protocol family generally is the same as the address family", and subsequent standards **use AF_\* everywhere.**
