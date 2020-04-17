---
title: AF_INET vs PF_INET
category: linux
---

`192.168.0.1`같은 IP 주소를 꼭 인터넷 프로토콜에서만 사용해야 할까요? 다른 '프로토콜'에서 IP '주소 체계'를 사용하도록 하면 어떨까요? 

## 원래 의도

아주 오래 전 소켓 프로그래밍을 설계한 사람들은, 확장성을 위해 한 종류의 '주소 체계'가 여러 '프로토콜'을 지원할 수 있도록 했습니다[^bgnet-1]. 인터넷 프로토콜을 예로 들자면, `192.168.0.1`, `8.8.4.4`같은 주소 체계가 인터넷 프로토콜뿐만 아니라 다른 프로토콜도 지원하는 식입니다.

[^bgnet-1]: <http://beej.us/guide/bgnet/html/#socket>

    > Once upon a time, a long time ago, it was thought that maybe an address family (what the “AF” in “AF_INET” stands for) might support several protocols that were referred to by their protocol family (what the “PF” in “PF_INET” stands for).

이 두 개념의 분리로 인해 프로토콜을 지정하는 방법도 두 가지로 나누어졌습니다:

- '주소 체계'를 지정하기 위해서는 AF로 시작하는 상수(`AF_INET`, `AF_IPX`, …)를 사용해야 합니다. AF는 **A**ddress **F**amily의 줄임말입니다. [`sockaddr_in`](http://man7.org/linux/man-pages/man7/ip.7.html) 구조체처럼 소켓의 주소를 지정해야 하는 경우 사용합니다.

- '프로토콜'을 지정하기 위해서는 PF로 시작하는 상수(`PF_INET`, `PF_IPX`, …)를 사용해야 합니다. PF는 **P**rotocol **F**amily의 줄임말입니다. [`socket()`](http://man7.org/linux/man-pages/man2/socket.2.html) 함수처럼 실제 연결을 하기 위한 프로토콜을 요구하는 경우 사용합니다.

원래 의도대로 소켓 프로그래밍을 한다면 이런 형태가 됩니다:

```c
struct sockaddr_in addr;
int sockfd;

addr.sin_family = AF_INET; // AF로 시작하는 상수 사용
addr.sin_port = htons(54321);
addr.sin_addr.s_addr = htonl(INADDR_ANY);

sockfd = socket(PF_INET, SOCK_STREAM, 0); // PF로 시작하는 상수 사용
```

## AF와 PF의 구분은 무의미

물론 하나의 주소 체계가 여러 프로토콜을 지원하는 일은 **실제로 일어나지 않았습니다[^bgnet-2].**

[^bgnet-2]: <http://beej.us/guide/bgnet/html/#socket>

    > That didn’t happen. And they all lived happily ever after, The End.

[리눅스 커널](https://github.com/torvalds/linux/blob/26bc672134241a080a83b2ab9aa8abede8d30e1c/include/linux/socket.h#L215-L219)에서도 이 두 상수 종류를 구분하지 않고, PF로 시작하는 상수와 AF로 시작하는 상수가 서로 같은 값을 가지도록 정의하고 있습니다:

```c
/* Protocol families, same as address families. */
#define PF_UNSPEC	AF_UNSPEC
#define PF_UNIX		AF_UNIX
#define PF_LOCAL	AF_LOCAL
#define PF_INET		AF_INET
```

즉, 리눅스에서는 PF를 써야 할 자리에 AF를 써도 되고, AF를 써야 할 자리에 PF를 써도 됩니다.

## 권장 방법

AF와 PF는 서로 아무런 차이가 없다는 것을 알았습니다. 그렇다면 둘 중 어느 것을 사용하는 것이 좋을까요? 원래 의도를 존중하여 AF를 쓸 자리에는 AF를, PF를 쓸 자리에는 PF를 써야 할까요? 아니면 단순히 AF와 PF 중 하나만 골라서 사용할까요?

유명한 소켓 프로그래밍 입문서인 <Beej's Guide to Network Programming>에서는 [AF_INET과 PF_INET을 설계 당시의 의도대로 구별하여 사용](http://beej.us/guide/bgnet/html/#socket)하고 있습니다:

> So the most correct thing to do is to **use AF_INET in your struct sockaddr_in and PF_INET in your call to socket()**.

반면, [리눅스 man 페이지](http://man7.org/linux/man-pages/man2/socket.2.html#NOTES)에서는 모든 곳에 AF를 사용하길 권장합니다:

> ... already the BSD man page promises: "The protocol family generally is the same as the address family", and subsequent standards **use AF_\* everywhere.**
