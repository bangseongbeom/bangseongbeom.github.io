---
title: AF_INET vs PF_INET
category: linux
---

리눅스 소켓 프로그래밍에서 `AF_INET`과 `PF_INET`의 차이에 대해 알아봅니다.

## 원래 의도

초창기 소켓 프로그래밍을 설계할 당시에는, **하나의 주소 체계가 여러 프로토콜을 지원**할 것을 염두에 두고 만들었습니다. 예를 들자면 **IP 주소**가 **IP 프로토콜**뿐만 아니라 다른 프로토콜도 지원하는 식입니다.

그래서 다음과 같이 상수를 달리 하여 사용하기로 했습니다:

- `AF_INET`
    - [`sin_family`](http://man7.org/linux/man-pages/man7/ip.7.html)같이 통신 주소 체계를 결정해야 하는 구조체/함수에 사용
    - AF는 **A**ddress **F**amily(주소 패밀리)의 줄임말
    - 이외에도 `AF_IPX`, `AF_APPLETALK` 등이 있음
- `PF_INET`
    - [`socket()`](http://man7.org/linux/man-pages/man2/socket.2.html)같이 프로토콜을 지정해야 하는 구조체/함수에 사용
    - PF는 **P**rotocol **F**amily(프로토콜 패밀리)의 줄임말
    - 이외에도 `AF_IPX`, `AF_APPLETALK` 등이 있음

## 의도는 좋았다. 그러나...

그러나 원래의 의도대로 하나의 주소 체계가 여러 프로토콜을 지원하는 일은 실제로 일어나지 않았습니다. 오늘날, IP 주소는 오직 IP 프로토콜에서만 사용합니다.

더 이상 AF와 PF의 구분은 의미가 없기에, 지금의 `PF_INET`는 `AF_INET`으로서 정의되어 있습니다(결국 `PF_INET`과 `AF_INT`은 같은 값을 가집니다):

[/include/linux/socket.h](https://github.com/torvalds/linux/blob/26bc672134241a080a83b2ab9aa8abede8d30e1c/include/linux/socket.h#L215-L219)

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
