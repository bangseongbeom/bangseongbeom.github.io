---
title: PostCSS가 Sass보다 좋은 이유
category: web
---

[Sass(사스)](https://sass-lang.com/)의 복잡한 문법이 필요 없다면, CSS의 표준 문법에 기반한 [PostCSS(포스트CSS)](https://postcss.org/)를 사용하는 것이 더 편리합니다.

## PostCSS Preset Env

이 글에서 말하는 PostCSS는, Sass처럼 CSS 문법을 제공하는 PostCSS의 여러 플러그인들을 의미합니다. 대표적으로 **[PostCSS Preset Env](https://preset-env.cssdb.org/)**가 있습니다. 자체적으로 많은 기능을 가지는 Sass와 달리, PostCSS의 경우 그 자체로는 아무런 기능이 없으며 플러그인 개발 도구만을 제공합니다. 때문에 PostCSS 자체를 Sass와 비교할 수는 없습니다.

## 장점: CSS 표준 문법 사용

PostCSS는 CSS 표준 문법([CSS 커스텀 프로퍼티](https://drafts.csswg.org/css-variables/))이나 표준화 작업 중에 있는 문법([CSS 중첩(Nesting)](https://drafts.csswg.org/css-nesting-1/))을 제공합니다. 문법이 표준으로서 기능하기 위해서는 하위 호환성을 확보하거나 특수한 상황에서도 잘 동작하도록 합니다. 쉽게 말하자면, 이러한 문법은 CSS와 잘 어울리도록 설계됩니다. 그렇기에 처음 문법을 접하는 사람에게 있어 CSS의 근본적인 동작 방식과 크게 다르다는 느낌이 들지 않고 자연스럽습니다.

반면 Sass는 기존 CSS의 문법을 확장하는 방식을 취합니다. Sass를 잘 사용하기 위해서는 Sass만의 독특한 방식을 배워야 합니다.

## 장점: 자바스크립트 기반

PostCSS는 자바스크립트 기반입니다. 웹 개발자라면 어렵지 않게 플러그인을 개발해낼 수 있습니다. 또, PostCSS로 만들어진 모든 것은 플러그인이기에 참고할만한 코드나 예제도 수없이 많습니다.

이와 달리 Sass는 루비 기반입니다. 플러그인을 개발하기 위해서는 루비를 배워야 합니다. 만약 여러분이 루비 기반인 Sass 대신 C/C++ 기반인 [LibSass](https://sass-lang.com/libsass)를 쓴다면 플러그인을 개발하기 더욱 어려워집니다.

## 단점: 강력한 문법을 제공하지 않는다

PostCSS는 Sass의 [함수](https://sass-lang.com/documentation/at-rules/function)나 [for 문](https://sass-lang.com/documentation/at-rules/control/for)같이 강력한 문법을 제공하지 않습니다. 정확히 말하면 이러한 기능을 제공하는, 유명하면서도 유지 보수가 잘 되는 플러그인을 찾기 어렵습니다.

물론, 스타일링을 위한 언어인 CSS에서 이런 문법을 사용할 일은 거의 없습니다. 그렇지만 CSS 위에서 코딩하는 것이 정말로 필요하다면 PostCSS는 좋은 선택이 아닙니다.

## 단점: Sass에 비해 덜 유명

PostCSS는 Sass에 비해 덜 유명합니다. 덜 유명한 도구를 사용한다는 말은 도구에 대한 숙련자가 적다는 말과 같습니다. 이로 인해 문제 상황에 대한 해결책을 찾기 어려울 수도 있습니다.

<figure>
<img src="/assets/2019-07-17-postcss-better-than-sass/tools-section-overview.png" alt="Sass의 인기를 100%로 봤을 때, PostCSS의 인기는 84%">
<figcaption><a href="https://2019.stateofcss.com/technologies/pre-post-processors/#tools-section-overview">The State of CSS Survey 2019 전처리기 순위</a></figcaption>
</figure>
