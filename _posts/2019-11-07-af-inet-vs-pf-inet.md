---
title: AF_INET vs PF_INET
category: linux
---

리눅스 소켓 프로그래밍에서, IP 프로토콜을 지정하는 데 사용하는 상수로는 `AF_INET`과 `PF_INET`이 있습니다. 이 둘의 차이가 무엇일까요?

## AF와 PF의 의도한 차이

아주 오래 전 소켓 프로그래밍을 설계할 당시에는, **하나의 '주소 체계'가 여러 '프로토콜'을 지원**할 것을 염두에 두고 만들었습니다[^bgnet-1]. 이를테면 IP 주소가 IP 프로토콜뿐만 아니라 다른 프로토콜도 지원하는 식입니다.

[^bgnet-1]:
    <http://beej.us/guide/bgnet/html/#socket>

    > Once upon a time, a long time ago, it was thought that maybe an address family (what the “AF” in “AF_INET” stands for) might support several protocols that were referred to by their protocol family (what the “PF” in “PF_INET” stands for).

이렇게 되면 **헷갈리는 경우**가 발생합니다. 인터넷 프로토콜을 예로 들어봅시다. 인터넷 프로토콜을 그저 `INET`이라고만 하면, 이것이 인터넷 '프로토콜' 자체를 의미하는지, 아니면 인터넷 프로토콜의 '주소 체계'를 의미하는지 파악하기 어렵습니다.

그래서 **주소 체계에는 AF**를, **프로토콜 자체에는 PF**를 붙여 서로를 구분하기로 했습니다. 인터넷 프로토콜의 경우 `AF_INET`과 `PF_INET`으로 분리될 것입니다.

**AF**:
- **A**ddress **F**amily(주소 패밀리)의 줄임말
- 프로토콜 이름 앞에 AF를 붙임: `AF_INET`, `AF_IPX`, `AF_APPLETALK`
- [`sockaddr_in`](http://man7.org/linux/man-pages/man7/ip.7.html)같이 **주소 체계**를 결정해야 하는 구조체에서 사용:

  ```c
  struct sockaddr_in sockaddr;
  sockaddr.sin_family = AF_INET;
  ```

**PF**:
- **P**rotocol **F**amily(프로토콜 패밀리)의 줄임말
- 프로토콜 이름 앞에 PF를 붙임: `PF_INET`, `PF_IPX`, `PF_APPLETALK`
- [`socket()`](http://man7.org/linux/man-pages/man2/socket.2.html)같이 **프로토콜**을 지정해야 하는 함수에서 사용:

  ```c
  int sockfd = socket(PF_INET, SOCK_STREAM, 0);
  ```

## AF와 PF는 실제로 같다

**그러나 설계 당시의 의도대로 하나의 주소 체계가 여러 프로토콜을 지원하는 일은 실제로 일어나지 않았습니다[^bgnet-2].** 오늘날까지도 IP 주소 체계는 오직 IP 프로토콜에서만 사용됩니다.

[^bgnet-2]:
    <http://beej.us/guide/bgnet/html/#socket>

    > That didn’t happen. And they all lived happily ever after, The End.

[리눅스 커널](https://github.com/torvalds/linux/blob/26bc672134241a080a83b2ab9aa8abede8d30e1c/include/linux/socket.h#L215-L219)은 **PF가 AF와 같은 값을 가지도록 정의**하고 있습니다:

```c
/* Protocol families, same as address families. */
#define PF_UNSPEC	AF_UNSPEC
#define PF_UNIX		AF_UNIX
#define PF_LOCAL	AF_LOCAL
#define PF_INET		AF_INET
```

## 권장 방식

AF와 PF는 서로 아무런 차이가 없다는 것을 알았습니다. 그렇다면 둘 중 어느 것을 사용하는 것이 좋을까요? **원래 의도를 존중하여 AF를 쓸 자리에는 AF를, PF를 쓸 자리에는 PF를** 써야 할까요? 아니면 **속 편하게 AF와 PF 중 하나만 골라서** 사용할까요?

유명한 소켓 프로그래밍 입문서인 <Beej's Guide to Network Programming>에서는 [AF_INET과 PF_INET을 설계 당시의 의도대로 구별하여 사용](http://beej.us/guide/bgnet/html/#socket)하고 있습니다:

> So the most correct thing to do is to **use AF_INET in your struct sockaddr_in and PF_INET in your call to socket()**.

반면, [리눅스 man 페이지](http://man7.org/linux/man-pages/man2/socket.2.html#NOTES)에서는 모든 곳에 AF를 사용하길 권장합니다:

> ... already the BSD man page promises: "The protocol family generally is the same as the address family", and subsequent standards **use AF_\* everywhere.**
