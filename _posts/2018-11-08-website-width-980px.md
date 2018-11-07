---
title: "웹 사이트의 너비: 980px"
category: css
---

웹 사이트의 너비가 너무 넓으면 가독성을 해칩니다. 반대로 너무 좁으면 화면에 충분한 정보를 담을 수 없습니다. 그렇다면 웹 사이트의 너비는 몇으로 해야 적당할까요?

## 기준 정하기: 모바일에서의 가짜 화면 너비

마음대로 정하는 것보다는 유명하고 안정적인 기준이 있는 게 낫겠죠.

모바일 브라우저는 데스크톱 전용 웹 페이지를 렌더링할 때, 일부만 보이는 것을 막기 위해 화면이 약 980px인 것처럼 속인 다음 렌더링한다고 합니다[^set-the-viewport]. 그래야만 한 화면에 페이지를 모두 담을 수 있기 때문입니다.

이 기준을 넘어간다면 렌더링 후에도 페이지를 좌우로 스크롤해야 하는 불편함이 생깁니다. **결국 이 수치는 모바일 페이지를 지원하지 않음에도 모바일에서 제대로 보이기 위한 최대한의 수치입니다.**

최근에는 대부분 모바일 페이지를 지원하므로 사실 큰 의미는 없습니다. **그러나 이 수치는 웹 사이트의 너비를 결정 짓는 기준점이 될 수 있을 정도로 충분히 안정적입니다.** 따라서 이를 기준으로 조사합니다.

[^set-the-viewport]:
    <https://developers.google.com/web/fundamentals/design-and-ux/responsive/#set-the-viewport>

    > To attempt to provide the best experience, mobile browsers render the page at a desktop screen width (usually about 980px, though this varies across devices), and then try to make the content look better by increasing font sizes and scaling the content to fit the screen.

## 아이폰: 980px

<https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/UsingtheViewport/UsingtheViewport.html>

> The default width is 980 pixels.

## 안드로이드: 980px

<https://developer.android.com/guide/webapps/targeting#Viewport>

> Most web browsers on Android (including Chrome) set the viewport to a large size by default (known as "wide viewport mode" at about 980px wide).

## 기타 문서: 980-1024px

구글 Developers 문서에서 예시로 든 너비: **980px:**

<https://developers.google.com/web/fundamentals/design-and-ux/responsive/#set-the-viewport>
> ... a desktop screen width (usually about 980px, though this varies across devices), ...

CSS 표준 명세에서 예시로 든 너비: **980-1024px:**

<https://drafts.csswg.org/css-device-adapt/#intro>
> ... (typically 980-1024px).

## 결론: 980px

980px을 쓰기로 했습니다.

