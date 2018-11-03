---
title: 이제서야 코틀린을 도입하게 된 이유
category: android
---

처음 안드로이드에 코틀린이 쓰이기 시작했을 때만 해도, 안드로이드 SDK는 코틀린을 제대로 지원하지 않았습니다. SDK가 공식적으로 지원하지 않는 언어를 사용한다면 언어가 가진 생산성을 최대한으로 발휘할 수 없다고 판단해 도입을 미뤄왔습니다. 그러나 지금의 안드로이드는 코틀린을 거의 완벽하게 지원합니다.

## 문법이 좋다는 이유만으로는 코틀린을 선택할 수 없다

**자바의 불편함을 빠르게 해소하였습니다.** 프로그래밍 언어의 우열을 가리는 건 대단히 까다롭습니다만, 적어도 코틀린은 자바 개발자들이 불편하게 여겨왔던 부분을 빠르게 해결했습니다. 자바 8에 추가된 람다와 `Optional`, 자바 10에 추가된 `var`는 자바에 도입되기 전부터 코틀린에서 지원하는 기능입니다. 심지어 자바에서는 아직 도입 논의 중인 데이터 클래스[^data-class] 역시 기본적으로 지원합니다.

**간결합니다.** 코틀린은 자바처럼 장황하지 않습니다. 짧고 간결합니다. 자바에서는 `null` 안전성을 위해 [`Optional.map()`][optional-map], [`Optional.orElse()`][optional-orelse]처럼 메서드를 호출해야 하지만, 코틀린에서는 [`?.`][safe-call], [`?:`][elvis]같이 기호로 구현합니다[^nullable-vs-optional].

**그러나 이것만으로는 부족합니다.** 언어의 좋은 문법으로 인해 생산성 향상이 이루어지는 것은 사실이지만, 반대로 생산성이 떨어질 수도 있습니다. 언어와 관련된 프레임워크와 도구들이 언어를 효과적으로 지원하지 않는다면 말이죠. 문법 강조도 제대로 되지 않고 기존 프레임워크도 마음대로 쓸 수 없다면 아무리 문법이 좋아봤자 쓰기 힘들 것입니다. 이처럼 우리는 언어를 선택함으로써 얻는 이익뿐만 아니라 잠재적인 문제점까지 함께 고려하는 것이 필요합니다.

[^data-class]:
    <http://cr.openjdk.java.net/~briangoetz/amber/datum.html>

[optional-map]: https://download.java.net/java/early_access/jdk11/docs/api/java.base/java/util/Optional.html#map(java.util.function.Function)

[optional-orelse]: https://download.java.net/java/early_access/jdk11/docs/api/java.base/java/util/Optional.html#orElse(T)

[safe-call]: https://kotlinlang.org/docs/reference/null-safety.html#safe-calls

[elvis]: https://kotlinlang.org/docs/reference/null-safety.html#elvis-operator

[^nullable-vs-optional]:
    <https://medium.com/@fatihcoskun/kotlin-nullable-types-vs-java-optional-988c50853692>

## 안드로이드 스튜디오가 코틀린을 지원해야 한다

코딩은 그저 문자를 타이핑하는 것만으로 끝나지 않습니다. 편집기 또는 IDE가 제공하는 자동 완성이나 문법 강조 없이는 높은 생산성을 기대하기 어렵습니다.

코틀린은 유명한 자바 IDE 중 하나인 [인텔리제이 아이디어(IntelliJ IDEA)][intellij-idea]를 개발한 [제트브레인(JetBrains)][jetbrains]에서 만들었습니다. 자사에서 개발한 언어이니만큼, 인텔리제이 아이디어는 코틀린을 위한 문법 강조나 자동 완성 기능을 자바와 견줄 만한 정도로 강력하게 지원합니다.

**안드로이드 스튜디오에서 직접적으로 코틀린을 지원합니다.** 안드로이드 스튜디오는 인텔리제이 아이디어를 기반으로 합니다. 그렇기에 복잡한 설정 없이 안드로이드 스튜디오에서 바로 코틀린을 사용할 수 있습니다. 적어도 코틀린을 선택하는 데 있어 편집기와 관련된 문제는 없다고 볼 수 있겠죠.

[intellij-idea]: https://www.jetbrains.com/idea/

[jetbrains]: https://www.jetbrains.com/

## 안드로이드 SDK가 코틀린을 지원해야 한다

언어와 관련된 SDK나 프레임워크의 지원 또한 중요합니다. 이들이 언어를 제대로 지원하지 못할 경우 언어의 장점을 최대한으로 살릴 수 없기 때문입니다.

코틀린의 장점 중 하나는 `NullPointerException`에 대한 안정성을 특유의 물음표(`?`) 문법으로 손쉽게 확보할 수 있다는 것입니다. 하지만 안드로이드 SDK는 자바로 짜여져 있습니다. 타입 뒤에 물음표를 붙여야만 `null`을 가질 수 있도록 한 코틀린과 달리, 자바의 경우 모든 타입이 `null`을 가질 수 있습니다. 이러한 경우 코틀린에서는 논리 상으로는 `null`이 나올 수 없는데도 불구하고 언제나 `null` 처리 코드를 추가해야 합니다. 물론 자바 메서드에 `@NotNull` 애너테이션을 붙여 `null`이 나오지 않는다는 것을 보장할 수도 있습니다. 여태까지의 안드로이드 프레임워크는 소수의 메서드에만 `@NotNull`이 적용된 상태였죠.

**안드로이드 파이(9.0)부터는 본격적으로 코틀린을 지원합니다.** 대부분의 메서드에 애너테이션을 추가했습니다[^android-pie-sdk-is-now-more-kotlin]. 심지어 코틀린만이 가진 고급 문법을 지원하기 위해 [KTX][ktx]라는 확장 기능도 만들었습니다. 2017년 코틀린을 안드로이드의 공식 언어로 채택했을 때에 비하면[^official-kotlin], 이제는 정말로 안드로이드가 코틀린을 지원한다고 볼 수 있게 되었습니다.

[^android-pie-sdk-is-now-more-kotlin]:
    <https://android-developers.googleblog.com/2018/08/android-pie-sdk-is-now-more-kotlin.html>

    > As part of yesterday's Android 9 announcement, we have also released a new Android SDK that contains nullability annotations for some of the most frequently used APIs. This will preserve the null-safety guarantee when your Kotlin code is calling into any annotated APIs in the SDK. Even if you are using the Java programming language, you can still benefit from these annotations by using Android Studio to catch nullability contract violations.

[ktx]: https://developer.android.com/kotlin/ktx

[^official-kotlin]: <https://blog.jetbrains.com/kotlin/2017/05/kotlin-on-android-now-official/>

## 참고

- <https://dzone.com/articles/why-kotlin-is-the-future-of-android-app-developmen>
- <https://medium.com/@Pinterest_Engineering/the-case-against-kotlin-2c574cb87953>
