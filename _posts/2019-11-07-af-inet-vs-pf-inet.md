---
title: AF_INET vs PF_INET
category: linux
---

리눅스 소켓 프로그래밍에서, [`sockaddr_in`](http://man7.org/linux/man-pages/man7/ip.7.html)이나 [`socket()`](http://man7.org/linux/man-pages/man2/socket.2.html)을 사용할 때, IP(인터넷 프로토콜)임을 지정하기 위해 `AF_INET`과 `PF_INET` 중 어느 것을 사용해도 상관이 없는 것을 확인할 수 있습니다. 이 둘의 차이가 무엇일까요?

## 원래 의도

아주 오래 전 소켓 프로그래밍을 설계할 당시에는, **한 종류의 '프로토콜 주소'가 여러 '프로토콜'을 지원**할 것을 염두에 두고 만들었습니다<sup>[[bgnet-1]](#footnote-bgnet-1)</sup>. 이를테면 `192.168.0.1`, `8.8.4.4`같은 IP 주소가 IP뿐만 아니라 다른 프로토콜도 지원하는 식입니다.

즉, 당시 사람들의 생각은 '프로토콜 주소'와 '프로토콜'이 하나의 개념이 아니라 **별개의 개념**이라는 것이었습니다. 그러므로:

- 같은 프로토콜이라도, '프로토콜 주소'를 나타내는 상수와 '프로토콜'을 나타내는 상수를 구분하기로 했습니다.
    - '프로토콜 주소'를 지정하는 상수는 `AF_INET`, `AF_IPX`처럼 프로토콜 이름 앞에 **AF**를 붙입니다. AF는 **A**ddress **F**amily(주소 패밀리)의 줄임말입니다.
    - '프로토콜'을 지정하는 상수는 `PF_INET`, `PF_IPX`같이 프로토콜 이름 앞에 **PF**를 붙입니다. PF는 **P**rotocol **F**amily(프로토콜 패밀리)의 줄임말입니다.
- '프로토콜 주소'와 '프로토콜' 상수를 구분하여 사용하기로 했습니다:
    - 소켓 주소를 담는 [`sockaddr_in`](http://man7.org/linux/man-pages/man7/ip.7.html) 구조체에서는 '프로토콜 주소'를 지정하는 상수를 사용합니다.
    - 소켓을 생성하는 [`socket()`](http://man7.org/linux/man-pages/man2/socket.2.html) 함수에서는 '프로토콜'을 지정하는 상수를 사용합니다.

예를 들자면 다음과 같이 구분하는 식입니다:

```c
struct sockaddr_in addr;
int sockfd;

addr.sin_family = AF_INET; # 여기에는 'AF_INET'같이 AF로 시작하는 상수 사용
addr.sin_port = htons(54321);
addr.sin_addr.s_addr = htonl(INADDR_ANY);

sockfd = socket(PF_INET, SOCK_STREAM, 0); # 여기에는 'PF_INET'같이 PF로 시작하는 상수 사용
```

## AF와 PF는 실제로 같다

**그러나**, 설계 당시의 의도대로 하나의 주소 체계가 여러 프로토콜을 지원하는 일은 **실제로 일어나지 않았습니다**<sup>[[bgnet-2]](#footnote-bgnet-2)</sup>. AF와 PF의 구분은 무용지물이 되고 말았죠. 오늘날까지도 IP 주소 체계는 오직 IP 프로토콜에서만 사용됩니다.

AF와 PF의 구분이이 무의미하기에, [리눅스 커널](https://github.com/torvalds/linux/blob/26bc672134241a080a83b2ab9aa8abede8d30e1c/include/linux/socket.h#L215-L219)에서는 PF가 AF와 같은 값을 가지도록 정의하고 있습니다:

```c
/* Protocol families, same as address families. */
#define PF_UNSPEC	AF_UNSPEC
#define PF_UNIX		AF_UNIX
#define PF_LOCAL	AF_LOCAL
#define PF_INET		AF_INET
```

## 그러면 어떻게 해야 할까

AF와 PF는 서로 아무런 차이가 없다는 것을 알았습니다. 그렇다면 둘 중 어느 것을 사용하는 것이 좋을까요? 원래 의도를 존중하여 AF를 쓸 자리에는 AF를, PF를 쓸 자리에는 PF를 써야 할까요? 아니면 단순히 AF와 PF 중 하나만 골라서 사용할까요?

유명한 소켓 프로그래밍 입문서인 <Beej's Guide to Network Programming>에서는 [AF_INET과 PF_INET을 설계 당시의 의도대로 구별하여 사용](http://beej.us/guide/bgnet/html/#socket)하고 있습니다:

> So the most correct thing to do is to **use AF_INET in your struct sockaddr_in and PF_INET in your call to socket()**.

반면, [리눅스 man 페이지](http://man7.org/linux/man-pages/man2/socket.2.html#NOTES)에서는 모든 곳에 AF를 사용하길 권장합니다:

> ... already the BSD man page promises: "The protocol family generally is the same as the address family", and subsequent standards **use AF_\* everywhere.**

## 참고

- <span id="footnote-bgnet-1">[bgnet-1]</span>: <http://beej.us/guide/bgnet/html/#socket>

  > Once upon a time, a long time ago, it was thought that maybe an address family (what the “AF” in “AF_INET” stands for) might support several protocols that were referred to by their protocol family (what the “PF” in “PF_INET” stands for).

- <span id="footnote-bgnet-2">[bgnet-2]</span>: <http://beej.us/guide/bgnet/html/#socket>

  > That didn’t happen. And they all lived happily ever after, The End.
