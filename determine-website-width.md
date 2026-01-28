---
lang: ko
categories: [web]
date: 2018-11-08
redirect_from: [/posts/website-width.html, /website-width.html]
---

[방성범](/README.md) / [웹](/web.md)

# 웹 사이트 너비 정하기

웹 사이트의 너비에 대한 절대적인 기준은 없습니다. 그래도 마음대로 정하는 것보다는, 모바일에서 데스크톱 전용 웹 페이지를 렌더링할 때 사용되는 너비인 980px을 권장합니다.

## 980px: 모바일에서 제대로 보이기 위한 최대한의 너비

모바일 브라우저는 모바일 페이지가 없는 데스크톱 전용 웹 페이지를 렌더링할 때, 일부만 보이는 것을 막기 위해 실제 화면 크기에 상관 없이 너비를 약 980px인 것처럼 렌더링한다고 합니다[^set-the-viewport]. 그래야만 한 화면에 페이지를 최대한 담을 수 있기 때문입니다.

[^set-the-viewport]:
    <https://developers.google.com/web/fundamentals/design-and-ux/responsive/#set-the-viewport>

    > To attempt to provide the best experience, mobile browsers render the page at a desktop screen width (usually about 980px, though this varies across devices), and then try to make the content look better by increasing font sizes and scaling the content to fit the screen.

웹 사이트가 이 수치를 초과한다면 렌더링 후에도 페이지를 좌우로 스크롤해야 하는 불편함이 생깁니다. **결국 이 수치는 모바일에서 제대로 보이기 위한 최대한의 너비라 볼 수 있습니다.**

최근에는 모바일 페이지를 따로 제공하거나, 아예 웹 사이트를 반응형으로 만드는 경우가 많아 이 수치 자체에 큰 의미가 있지는 않습니다. **그래도 웹 사이트 설계 시 너비를 결정하기 위한 참고 용도로 쓰기에는 괜찮아 보입니다.**

## 참고: 980px이 언급된 문서

아이폰: 980px:

<https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/UsingtheViewport/UsingtheViewport.html>

> The default width is 980 pixels.

안드로이드: 약 980px:

<https://developer.android.com/guide/webapps/targeting#Viewport>

> Most web browsers on Android (including Chrome) set the viewport to a large size by default (known as "wide viewport mode" at about 980px wide).

구글 Developers 문서의 예시: 약 980px:

<https://developers.google.com/web/fundamentals/design-and-ux/responsive/#set-the-viewport>

> ... a desktop screen width (usually about 980px, though this varies across devices), ...

CSS 표준 명세의 예시: 980-1024px:

<https://drafts.csswg.org/css-device-adapt/#intro>

> ... (typically 980-1024px).
