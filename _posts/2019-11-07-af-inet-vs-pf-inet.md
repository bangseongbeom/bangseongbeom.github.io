---
title: AF_INET vs PF_INET
category: linux
---

리눅스 소켓 프로그래밍에서, IP 프로토콜을 지정하는 데 사용하는 상수로는 `AF_INET`과 `PF_INET`이 있습니다. 이 둘의 차이가 무엇일까요?

## 의문

통신을 하는 데 있어 프로토콜을 명시하지 않을 수는 없죠. 소켓을 생성하는 [`socket()`](http://man7.org/linux/man-pages/man2/socket.2.html) 함수, 그리고 통신할 서버의 주소를 지정하는 [`sockaddr_in`](http://man7.org/linux/man-pages/man7/ip.7.html) 구조체 모두 어떤 프로토콜을 사용할 것인지 명시해야 합니다:

```c
sockfd = socket(
    int socket_family, /* socket_family에 사용할 프로토콜을 지정 */
    int socket_type,
    int protocol);
```

```c
struct sockaddr_in {
    sa_family_t sin_family; /* sin_family에 사용할 프로토콜을 지정 */
    /* ... */
};
```

우리가 만드는 소프트웨어는 대부분 인터넷 프로토콜 위에서 동작합니다. 다음처럼 `PF_INET`이나 `AF_INET`을 명시해 인터넷 프로토콜을 사용할 수 있습니다:

```c
socket(PF_INET, SOCK_STREAM, 0); // PF_INET을 명시해 인터넷 프로토콜 사용
struct sockaddr_in my_sockaddr;
my_sockaddr.sin_family = AF_INET; // AF_INET을 명시해 인터넷 프로토콜 사용
```

`PF_INET`과 `AF_INET` 뒤에 붙은 INET은 **I**nter**NET** Protocol의 줄임말입니다. 인터넷 프로토콜을 의미하죠. 그렇다면 앞에 붙은 PF와 AF는 무엇일까요?

## 설계 당시의 의도

아주 오래 전 소켓 프로그래밍을 설계할 당시에는, **하나의 주소 체계가 여러 프로토콜을 지원**할 것을 염두에 두고 만들었습니다[^bgnet-1]. 이를테면 IP 주소가 IP 프로토콜뿐만 아니라 다른 프로토콜도 지원하는 식입니다.

[^bgnet-1]:
    <http://beej.us/guide/bgnet/html/#socket>

    > Once upon a time, a long time ago, it was thought that maybe an address family (what the “AF” in “AF_INET” stands for) might support several protocols that were referred to by their protocol family (what the “PF” in “PF_INET” stands for).

이렇게 되면 주소 체계와 프로토콜이라는 두 개념을 구별할 필요가 생깁니다. 주소 체계는 프로토콜과 **개별적으로** 사용될 수 있기 때문입니다. IP 주소 체계를 사용한다고 해서 이것이 더 이상 IP 프로토콜의 사용을 의미하지 않습니다.

이러한 이유로 인해 주소 체계에는 AF를, 프로토콜에는 PF를 붙이게 되었습니다.

AF
:   - **A**ddress **F**amily(주소 패밀리)의 줄임말
    - [`sockaddr_in`](http://man7.org/linux/man-pages/man7/ip.7.html)같이 **주소 체계**를 결정해야 하는 구조체에서 사용
    - 주소 체계를 지정하기 위한 표현 앞에는 모두 AF을 붙임: `AF_INET`, `AF_IPX`, `AF_APPLETALK`

PF
:   - **P**rotocol **F**amily(프로토콜 패밀리)의 줄임말
    - [`socket()`](http://man7.org/linux/man-pages/man2/socket.2.html)같이 **프로토콜**을 지정해야 하는 함수에서 사용
    - 프로토콜을 지정하기 위한 표현 앞에는 모두 PF를 붙임: `PF_INET`, `PF_IPX`, `PF_APPLETALK`

## 이론과 현실의 차이

그러나 설계 당시의 의도대로 하나의 주소 체계가 여러 프로토콜을 지원하는 일은 실제로 일어나지 않았습니다[^bgnet-2].

[^bgnet-2]:
    <http://beej.us/guide/bgnet/html/#socket>

    > That didn’t happen. And they all lived happily ever after, The End.

오늘날 AF와 PF의 구분은 의미가 없습니다. **IP 주소는 오직 IP 프로토콜에서만 사용합니다.** 지금의 [리눅스 커널](https://github.com/torvalds/linux/blob/26bc672134241a080a83b2ab9aa8abede8d30e1c/include/linux/socket.h#L215-L219)은 `PF_INET`이 `AF_INET`과 같은 값을 가지도록 정의하고 있습니다:

```c
/* Protocol families, same as address families. */
#define PF_UNSPEC	AF_UNSPEC
#define PF_UNIX		AF_UNIX
#define PF_LOCAL	AF_LOCAL
#define PF_INET		AF_INET
```

## 오늘날의 권장 방식

오늘날 AF와 PF 사이에는 서로 아무런 차이가 없다는 것을 알았습니다. 그렇다면 둘 중 어느 것을 사용하는 것이 좋을까요? 원래 의도를 존중하여 AF를 쓸 자리에는 AF를, PF를 쓸 자리에는 PF를 써야 할까요? 아니면 AF와 PF 중 하나만 골라서 사용할까요?

유명한 소켓 프로그래밍 입문서인 <Beej's Guide to Network Programming>에서는 [AF_INET과 PF_INET을 설계 당시의 의도대로 구별하여 사용](http://beej.us/guide/bgnet/html/#socket)하고 있습니다:

> So the most correct thing to do is to **use AF_INET in your struct sockaddr_in and PF_INET in your call to socket()**.

반면, [리눅스 man 페이지](http://man7.org/linux/man-pages/man2/socket.2.html#NOTES)에서는 모든 곳에 AF를 사용하길 권장합니다:

> ... already the BSD man page promises: "The protocol family generally is the same as the address family", and subsequent standards **use AF_\* everywhere.**
