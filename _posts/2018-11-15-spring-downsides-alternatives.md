---
title: 스프링의 단점과 대안
category: java
published: false
---

[스프링(Spring)][spring]은 강력하지만 그만큼 배워야 할 것이 많은 복잡한 프레임워크입니다. 자바를 써야 하지만 스프링은 부담된다면, 대안으로 [드롭위자드(Dropwizard)][dropwizard]를 사용해보세요.

[spring]: https://spring.io/

[dropwizard]: https://www.dropwizard.io/

## 단점: 선택적으로 도입할 수 없는 복잡한 기술

스프링은 거대한 소프트웨어의 개발을 편리하게 하기 위해 특별한 기술을 기반으로 움직입니다. 의존성 주입(DI; Dependency Injection)이라고도 불리는 제어의 역전(IoC; Inversion of Control)과, 관점 지향 프로그래밍(AOP: Aspect Oriented Programming)이 그것입니다.

이러한 기술이 언제나 효과적이지는 않습니다. **제어의 역전은 객체 사이의 의존도를 떨어트린다는 장점이 있습니다.** 그러나 어느 정도 규모 있는 소프트웨어가 아닌 이상 의존성이 바뀔 일이 무척 적습니다. **정말 다른 객체에 의존하도록 해야 한다면, 그때 코드를 수정하면 됩니다.** 미래는 알 수 없습니다. 미래에 대해 과도하게 대응하는 것은 좋지 않습니다[^designing-too-far].

[^designing-too-far]: <https://www.codesimplicity.com/post/designing-too-far-into-the-future/>

    > A common mistake that developers make is designing too far into that unknown future, making too many assumptions about it.

제어의 역전은 사실 그렇게 어려운 기술이 아닙니다. 프레임워크를 통하지 않고 수동으로 적용한다면 누구나 이해할 수 있습니다[^manual-di]. 하지만 프레임워크에서 제공하는 기술을 사용한다면 모두가 해당 기술에 대해 알고 있어야만 합니다.

[^manual-di]: <http://misko.hevery.com/2009/01/14/when-to-use-dependency-injection/>

    > In favor of manual DI:
    > - Simple: Nothing to learn, no dependencies.
    > - No reflection magic: In IDE it is easy to find out who calls the constructors.
    > - Even developers who do not understand DI can follow and contribute to projects.

적어도 이러한 기술을 선택적으로 적용할 수 있으면 좋겠습니다. 그러나 앞서 말했듯 스프링은 이러한 기술을 완전히 기반으로 하여 움직입니다. 프레임워크에 강력하게 종속되어 있어 제거할 수 없습니다.

## 단점: 너무 다양한 방법 제시

스프링은 특정한 문제를 해결할 수 있는 단 한 가지의 방법 대신, 여러 방법을 동시에 제공하는 경우가 매우 많습니다:

- XML 기반 의존성 vs 애너테이션 기반 의존성
- 리액티브 웹 vs 서블릿 웹
- 스프링 전용 애너테이션 vs 표준 호환(JSR-330, JSR-107) 애너테이션

이처럼 스프링은 다양한 선택지를 제시하여 프로젝트마다 각각의 방식을 추구할 수 있도록 도와줍니다. 그러나 무언가를 결정하는 것은 누구나 할 수 있는 일이 아닙니다. 충분한 자료 조사와 학습이 필요합니다.

스프링 문서는 특정한 방식을 직접적으로 권장하는 일이 드뭅니다. 만약 똑같은 문제를 해결할 수 있는 대안 기능이 나온다고 할지라도, **스프링은 옛 기능을 '또다른 해결책'으로서 남겨두는 경우가 대부분입니다.**

## 해결책: 스프링 전문가와 함께 일하기

사실 위에서 말한 단점들은 스프링 전문가가 있을 경우 오히려 장점이라 할 수 있습니다. 스프링 전문가라면 제어의 역전이나 관점 지향 프로그래밍으로 인한 학습 비용을 충분히 극복할 수 있습니다. 또, 다양한 해결 방법이 있기 때문에 프로젝트의 규모나 방향에 따라 기능을 선택적으로 도입하는 것도 가능합니다.

하지만 언제나 스프링 전문가와 함께할 수 있는 것은 아닙니다. 소규모 프로젝트에서는 특히 그렇습니다. 이런 경우 스프링 도입에 대해 다시 생각해보아야 합니다.

## 대안: 드롭위자드

[드롭위자드(Dropwizard)][dropwizard]는 자바의 여러 유명 라이브러리를 통합한 프레임워크입니다. 데이터베이스부터 MVC 계층에 이르기까지 다양한 라이브러리를 지원합니다. 유명한 사례로는 에어비앤비(Airbnb)[^in-airbnb], 국내에서는 [채널io(Channel.io)][channelio]를 개발한 조이가 있습니다[^in-zoyi].

[^in-airbnb]: <https://medium.com/airbnb-engineering/building-services-at-airbnb-part-1-c4c1d8fa811b>

    > At Airbnb, backend services are mostly written in Java using the Dropwizard web service framework, ...

[channelio]: https://channel.io/

[^in-zoyi]: <https://medium.com/@zoyi_product/dropwizard-asynchronous-hbase-b2b0cb3a0966>

    > 넘쳐나는 프레임워크들의 홍수 속에서 가볍고 안정적이며 구현이 편리한 프레임워크를 찾기란 쉽지 않았습니다만, 결국 Dropwizard라는 자바 프레임워크를 도입하기로 결정하게 됩니다. Dropwizard는 이미 잘 알려져 있는 Spring이나 Play 등과 같은 풀 스택 자바 프레임워크와는 다른, 경량 REST API 프레임워크입니다.

드롭위자드가 스프링의 완벽한 대안은 아닙니다. 자바라는 언어를 선택한다는 것은, 결국 대규모의 소프트웨어를 개발한다는 말과 같습니다. 그렇기에 스프링이 가장 적합하고, 가장 많이 사용될 수밖에 없습니다.

## 참고

- http://samatkinson.com/why-i-hate-spring/
