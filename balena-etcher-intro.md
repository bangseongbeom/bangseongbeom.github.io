---
category: etc
---

[🏠 방성범 블로그](/README.md)

[📦 기타](/etc.md)

# 발레나에처 소개

<time id="published" datetime="2020-05-07">2020. 5. 7.</time>

[발레나에처]\(balenaEtcher)는 간단하게 SD 카드나 USB에 운영 체제 이미지를 구울 수 있는 유틸리티 프로그램입니다.

[발레나에처]: https://www.balena.io/etcher/

## 장점

- 매우 단순한 UI를 가지고 있어 누구나 쉽게 사용할 수 있습니다.

## 단점

- 용량이 100MB가 넘습니다. 기능에 비해 너무 큽니다. (이는 [일렉트론](https://www.electronjs.org/)을 기반으로 하기 때문입니다[^electron]. 일렉트론은 내부적으로 [크롬 브라우저](https://www.google.com/chrome/)를 포함하고 있습니다)

[^electron]: [balenaEtcher](https://www.balena.io/etcher/)

    > Open Source
    >
    > Made with JS, HTML, node.js and Electron. Dive in and contribute!

## 시스템 요구 사항

- **언어:** 영어 **(한국어 지원 안 함)**
- **OS:** 윈도우, 맥OS, 리눅스
- **용량:** 약 142MB

## 사용 방법

<figure>

![](/assets/2020-05-07-balena-etcher-intro/balena-etcher-1.png)

<figcaption>

**'Select image'** 버튼을 누릅니다.

</figcaption>

</figure>

<figure>

![](/assets/2020-05-07-balena-etcher-intro/balena-etcher-2.png)

<figcaption>

굽는데 사용할 이미지 파일(ISO, IMG, ...)을 선택합니다.

</figcaption>

</figure>

<figure>

![](/assets/2020-05-07-balena-etcher-intro/balena-etcher-3.png)

<figcaption>

**'Select target'** 버튼을 누릅니다.

</figcaption>

</figure>

<figure>

![](/assets/2020-05-07-balena-etcher-intro/balena-etcher-4.png)

<figcaption>

이미지를 설치할 SD 카드 또는 USB를 선택합니다.

</figcaption>

</figure>

<figure>

![](/assets/2020-05-07-balena-etcher-intro/balena-etcher-5.png)

<figcaption>

**'Flash!'** 버튼을 눌러 굽기를 시작합니다.

</figcaption>

</figure>

{% include note.html %}

<figure>

![](/assets/2020-05-07-balena-etcher-intro/balena-etcher-6.png)

<figcaption>

SD 카드 또는 USB의 용량이 너무 클 경우, [발레나에처]는 사용자가 **자료 백업 용과 같은 중요한 드라이브**에 이미지를 구우려 하는 것이 아닌지 경고합니다. 정말 이미지를 굽기 위한 드라이브가 맞다면 **'Continue'** 버튼을 눌러 굽기를 시작합시다.

</figcaption>

</figure>

{% include note.html end=true %}

## 대안

- [루퍼스](https://rufus.ie/)(Rufus): 매우 적은 용량을 차지합니다. 한국어도 지원합니다. 단순한 UI를 가지고 있지만, 미숙련 사용자에게는 [발레나에처]에 비해 조금 어려울 수 있습니다.
